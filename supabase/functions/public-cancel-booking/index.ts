// Public endpoint: cancels a booking using its cancellation token.
// Sends notification emails to both the customer and the company owner.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    let token: string | null = null;

    if (req.method === "GET") {
      token = url.searchParams.get("token");
    } else {
      const body = await req.json().catch(() => ({}));
      token = (body as { token?: string })?.token ?? url.searchParams.get("token");
    }

    if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
      return json({ error: "Token inválido" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: appt } = await admin
      .from("appointments")
      .select(
        "id, company_id, customer_email, client_name, date, time, service, status, professional_id",
      )
      .eq("cancellation_token", token)
      .maybeSingle();

    if (!appt) return json({ error: "Agendamento não encontrado" }, 404);

    // Preview: return details without cancelling
    if (req.method === "GET") {
      const { data: company } = await admin
        .from("companies")
        .select("name")
        .eq("id", appt.company_id)
        .maybeSingle();
      return json({
        ok: true,
        alreadyCancelled: appt.status === "cancelled",
        company: company?.name ?? "",
        clientName: appt.client_name,
        service: appt.service,
        date: appt.date,
        time: appt.time,
      });
    }

    if (appt.status === "cancelled") {
      return json({ ok: true, alreadyCancelled: true });
    }

    const { error: updErr } = await admin
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appt.id);
    if (updErr) {
      console.error("cancel update failed", updErr);
      return json({ error: "Não foi possível cancelar" }, 500);
    }

    // Fire-and-forget emails
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sendUrl = `${supabaseUrl}/functions/v1/send-notification-email`;
      const baseHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      };

      const [{ data: company }, { data: prof }] = await Promise.all([
        admin.from("companies").select("name, owner_user_id").eq("id", appt.company_id).maybeSingle(),
        appt.professional_id
          ? admin.from("professionals").select("name, user_id").eq("id", appt.professional_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const formattedDate = new Date(appt.date + "T00:00:00").toLocaleDateString("pt-BR");
      const data = {
        customerName: appt.client_name,
        companyName: company?.name ?? "",
        serviceName: appt.service,
        professionalName: prof?.name ?? "",
        date: formattedDate,
        time: appt.time,
      };

      // Customer email
      if (appt.customer_email) {
        fetch(sendUrl, {
          method: "POST",
          headers: baseHeaders,
          body: JSON.stringify({
            template: "booking_cancelled_customer",
            to: appt.customer_email,
            data,
            companyId: appt.company_id,
            appointmentId: appt.id,
          }),
        }).catch((e) => console.error("customer cancel email failed", e));
      }

      // Company / professional email
      const targetUser = prof?.user_id ?? company?.owner_user_id;
      if (targetUser) {
        const { data: userInfo } = await admin.auth.admin.getUserById(targetUser);
        const to = userInfo?.user?.email;
        if (to) {
          fetch(sendUrl, {
            method: "POST",
            headers: baseHeaders,
            body: JSON.stringify({
              template: "booking_cancelled_company",
              to,
              data,
              companyId: appt.company_id,
              appointmentId: appt.id,
            }),
          }).catch((e) => console.error("company cancel email failed", e));
        }
      }
    } catch (e) {
      console.error("cancel notify dispatch failed", e);
    }

    return json({ ok: true });
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
