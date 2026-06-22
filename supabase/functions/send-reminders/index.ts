// Scheduled job: sends 24h reminder emails for upcoming appointments.
// Runs hourly via pg_cron. Picks up appointments scheduled between
// now+23h and now+25h that still need a reminder and have a customer email.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (token !== SERVICE_ROLE) {
      return json({ error: "Unauthorized" }, 401);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();
    const lower = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const upper = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    const lowerDate = lower.toISOString().slice(0, 10);
    const upperDate = upper.toISOString().slice(0, 10);

    const { data: rows, error } = await admin
      .from("appointments")
      .select(
        "id, company_id, date, time, service, customer_email, client_name, professional_id, status",
      )
      .in("status", ["scheduled", "pendente_confirmacao"])
      .is("reminder_sent_at", null)
      .not("customer_email", "is", null)
      .gte("date", lowerDate)
      .lte("date", upperDate)
      .limit(200);

    if (error) {
      console.error("query failed", error);
      return json({ error: error.message }, 500);
    }

    const candidates = (rows ?? []).filter((a) => {
      const at = new Date(`${a.date}T${a.time.length === 5 ? a.time + ":00" : a.time}`);
      return at >= lower && at <= upper;
    });

    if (!candidates.length) {
      return json({ ok: true, processed: 0 });
    }

    // Preload companies and professionals
    const companyIds = Array.from(new Set(candidates.map((a) => a.company_id)));
    const profIds = Array.from(
      new Set(candidates.map((a) => a.professional_id).filter(Boolean) as string[]),
    );
    const [{ data: companies }, { data: profs }] = await Promise.all([
      admin.from("companies").select("id, name").in("id", companyIds),
      profIds.length
        ? admin.from("professionals").select("id, name").in("id", profIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    ]);

    const companyName = new Map((companies ?? []).map((c) => [c.id, c.name]));
    const profName = new Map((profs ?? []).map((p) => [p.id, p.name]));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const sendUrl = `${supabaseUrl}/functions/v1/send-notification-email`;
    const baseHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    };

    let sent = 0;
    for (const a of candidates) {
      try {
        const res = await fetch(sendUrl, {
          method: "POST",
          headers: baseHeaders,
          body: JSON.stringify({
            template: "booking_reminder_customer",
            to: a.customer_email,
            data: {
              customerName: a.client_name,
              companyName: companyName.get(a.company_id) ?? "",
              serviceName: a.service,
              professionalName: a.professional_id ? profName.get(a.professional_id) ?? "" : "",
              date: new Date(a.date + "T00:00:00").toLocaleDateString("pt-BR"),
              time: a.time.slice(0, 5),
            },
            companyId: a.company_id,
            appointmentId: a.id,
          }),
        });
        if (res.ok) {
          await admin
            .from("appointments")
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq("id", a.id);
          sent++;
        } else {
          console.error("reminder send failed", a.id, res.status, await res.text());
        }
      } catch (e) {
        console.error("reminder loop error", a.id, e);
      }
    }

    return json({ ok: true, processed: candidates.length, sent });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
