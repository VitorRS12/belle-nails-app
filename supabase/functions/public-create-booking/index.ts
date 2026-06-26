// Public endpoint: creates a booking with status 'pendente_confirmacao'.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  companySlug: string;
  professionalId: string;
  serviceId: string;
  date: string;
  time: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const b = (await req.json()) as Body;

    // Validation
    const errors: string[] = [];
    if (!b.companySlug || b.companySlug.length > 80) errors.push("companySlug");
    if (!b.professionalId) errors.push("professionalId");
    if (!b.serviceId) errors.push("serviceId");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date)) errors.push("date");
    if (!/^\d{2}:\d{2}$/.test(b.time)) errors.push("time");
    if (!b.customerName?.trim() || b.customerName.length > 120) errors.push("customerName");
    if (b.customerEmail && b.customerEmail.length > 255) errors.push("customerEmail");
    if (b.customerPhone && b.customerPhone.length > 30) errors.push("customerPhone");
    if (b.notes && b.notes.length > 1000) errors.push("notes");
    if (errors.length) return json({ error: "Invalid fields", fields: errors }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: company } = await admin
      .from("companies")
      .select("id, name, slug, owner_user_id")
      .eq("slug", b.companySlug.toLowerCase())
      .maybeSingle();
    if (!company) return json({ error: "Empresa não encontrada" }, 404);

    const { data: prof } = await admin
      .from("professionals")
      .select("id, name, company_id, active")
      .eq("id", b.professionalId)
      .maybeSingle();
    if (!prof || prof.company_id !== company.id || !prof.active) {
      return json({ error: "Profissional indisponível" }, 404);
    }

    const { data: service } = await admin
      .from("services")
      .select("id, name, company_id, duration_minutes, price, active")
      .eq("id", b.serviceId)
      .maybeSingle();
    if (!service || service.company_id !== company.id || !service.active) {
      return json({ error: "Serviço indisponível" }, 404);
    }

    // Re-check conflict
    const { data: existing } = await admin
      .from("appointments")
      .select("time")
      .eq("professional_id", b.professionalId)
      .eq("date", b.date)
      .neq("status", "cancelled");
    const conflict = (existing ?? []).some((a) => a.time.startsWith(b.time));
    if (conflict) {
      return json({ error: "Horário já ocupado, escolha outro" }, 409);
    }

    // Find or create client (scoped to the company)
    const cleanPhone = b.customerPhone?.trim() || null;
    const cleanEmail = b.customerEmail?.trim().toLowerCase() || null;

    let clientId: string | null = null;
    if (cleanPhone) {
      const { data: existingClient } = await admin
        .from("clients")
        .select("id")
        .eq("company_id", company.id)
        .eq("phone", cleanPhone)
        .maybeSingle();
      if (existingClient) clientId = existingClient.id;
    }
    if (!clientId) {
      const { data: newClient, error: clientErr } = await admin
        .from("clients")
        .insert({
          company_id: company.id,
          user_id: company.owner_user_id,
          name: b.customerName.trim(),
          phone: cleanPhone,
          notes: cleanEmail ? `Email: ${cleanEmail}` : null,
        })
        .select("id")
        .single();
      if (clientErr || !newClient) {
        console.error("client insert failed", clientErr);
        return json({ error: "Não foi possível registrar o cliente" }, 500);
      }
      clientId = newClient.id;
    }

    // Insert appointment
    const { data: appt, error: apptErr } = await admin
      .from("appointments")
      .insert({
        company_id: company.id,
        user_id: company.owner_user_id,
        client_id: clientId,
        client_name: b.customerName.trim(),
        professional_id: prof.id,
        service_id: service.id,
        date: b.date,
        time: b.time,
        service: service.name,
        services: [{ name: service.name, price: Number(service.price) || 0 }],
        materials: [],
        price: Number(service.price) || 0,
        notes: b.notes?.trim() || null,
        status: "pendente_confirmacao",
        customer_email: cleanEmail,

      })
      .select("id")
      .single();

    if (apptErr || !appt) {
      console.error("appointment insert failed", apptErr);
      return json({ error: "Não foi possível criar o agendamento" }, 500);
    }

    // Fire-and-forget notification emails (do not block booking response)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const baseHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      };
      const sendUrl = `${supabaseUrl}/functions/v1/send-notification-email`;
      const formattedDate = new Date(b.date + "T00:00:00").toLocaleDateString("pt-BR");
      const baseData = {
        customerName: b.customerName.trim(),
        companyName: company.name,
        serviceName: service.name,
        professionalName: prof.name,
        date: formattedDate,
        time: b.time,
      };

      // Customer confirmation
      if (cleanEmail) {
        fetch(sendUrl, {
          method: "POST",
          headers: baseHeaders,
          body: JSON.stringify({
            template: "booking_confirmation_customer",
            to: cleanEmail,
            data: baseData,
            companyId: company.id,
            appointmentId: appt.id,
          }),
        }).catch((e) => console.error("customer email failed", e));
      }

      // Company owner notification
      const { data: ownerAuth } = await admin.auth.admin.getUserById(company.owner_user_id);
      const ownerEmail = ownerAuth?.user?.email;
      if (ownerEmail) {
        fetch(sendUrl, {
          method: "POST",
          headers: baseHeaders,
          body: JSON.stringify({
            template: "booking_new_company",
            to: ownerEmail,
            data: {
              ...baseData,
              customerContact: cleanEmail || cleanPhone || "—",
            },
            companyId: company.id,
            appointmentId: appt.id,
          }),
        }).catch((e) => console.error("company email failed", e));
      }
    } catch (notifyErr) {
      console.error("notification dispatch failed", notifyErr);
    }

    return json({
      ok: true,
      appointmentId: appt.id,
      company: company.name,
      professional: prof.name,
      service: service.name,
    });

  } catch (e) {
    console.error(e);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
