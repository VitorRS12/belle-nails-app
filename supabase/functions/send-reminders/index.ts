// Scheduled job: sends configurable reminder emails for upcoming appointments.
// Runs every 15 minutes via pg_cron. Each company defines which hours-before
// windows should trigger a reminder (e.g. {24, 2}). For each pending
// appointment we check whether any configured window matches (with a small
// tolerance) and hasn't been sent yet.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// How close (in minutes) the appointment must be to a configured window to
// trigger. Half of the cron interval keeps overlap minimal.
const WINDOW_TOLERANCE_MIN = 8;

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
    // Look ahead up to 72h so we catch any configured window; per-appointment
    // matching narrows it down to the configured hours.
    const lookaheadMs = 72 * 60 * 60 * 1000;
    const lower = now;
    const upper = new Date(now.getTime() + lookaheadMs);
    const lowerDate = lower.toISOString().slice(0, 10);
    const upperDate = upper.toISOString().slice(0, 10);

    const { data: rows, error } = await admin
      .from("appointments")
      .select(
        "id, company_id, date, time, service, customer_email, client_name, professional_id, status, reminder_sent_hours",
      )
      .in("status", ["scheduled", "pendente_confirmacao"])
      .not("customer_email", "is", null)
      .gte("date", lowerDate)
      .lte("date", upperDate)
      .limit(500);

    if (error) {
      console.error("query failed", error);
      return json({ error: error.message }, 500);
    }

    if (!rows?.length) return json({ ok: true, processed: 0, sent: 0 });

    // Preload companies (name + reminder config) and professionals.
    const companyIds = Array.from(new Set(rows.map((a) => a.company_id)));
    const profIds = Array.from(
      new Set(rows.map((a) => a.professional_id).filter(Boolean) as string[]),
    );
    const [{ data: companies }, { data: profs }] = await Promise.all([
      admin
        .from("companies")
        .select("id, name, reminder_hours_before")
        .in("id", companyIds),
      profIds.length
        ? admin.from("professionals").select("id, name").in("id", profIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    ]);

    const companyById = new Map(
      (companies ?? []).map((c) => [
        c.id,
        {
          name: c.name as string,
          hours: (c.reminder_hours_before as number[] | null) ?? [24],
        },
      ]),
    );
    const profName = new Map((profs ?? []).map((p) => [p.id, p.name]));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sendUrl = `${supabaseUrl}/functions/v1/send-notification-email`;
    const baseHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    };

    let sent = 0;
    let evaluated = 0;

    for (const a of rows) {
      const company = companyById.get(a.company_id);
      if (!company) continue;
      const configured = (company.hours ?? [24]).filter((h) => h > 0);
      if (!configured.length) continue;

      const timeStr = a.time.length === 5 ? `${a.time}:00` : a.time;
      const apptAt = new Date(`${a.date}T${timeStr}`);
      const minutesUntil = (apptAt.getTime() - now.getTime()) / 60000;
      if (minutesUntil <= 0) continue;

      const alreadySent = new Set((a.reminder_sent_hours as number[] | null) ?? []);

      // Find the closest configured window that matches "now" and hasn't been sent.
      const match = configured.find(
        (h) =>
          !alreadySent.has(h) &&
          Math.abs(minutesUntil - h * 60) <= WINDOW_TOLERANCE_MIN,
      );
      if (!match) continue;

      evaluated++;
      try {
        const res = await fetch(sendUrl, {
          method: "POST",
          headers: baseHeaders,
          body: JSON.stringify({
            template: "booking_reminder_customer",
            to: a.customer_email,
            data: {
              customerName: a.client_name,
              companyName: company.name ?? "",
              serviceName: a.service,
              professionalName: a.professional_id
                ? profName.get(a.professional_id) ?? ""
                : "",
              date: new Date(a.date + "T00:00:00").toLocaleDateString("pt-BR"),
              time: a.time.slice(0, 5),
              hoursBefore: match,
            },
            companyId: a.company_id,
            appointmentId: a.id,
          }),
        });
        if (res.ok) {
          const merged = Array.from(new Set([...alreadySent, match]));
          const patch: Record<string, unknown> = { reminder_sent_hours: merged };
          // Keep legacy column populated for the 24h window for back-compat.
          if (match === 24) patch.reminder_sent_at = new Date().toISOString();
          await admin.from("appointments").update(patch).eq("id", a.id);
          sent++;
        } else {
          console.error("reminder send failed", a.id, res.status, await res.text());
        }
      } catch (e) {
        console.error("reminder loop error", a.id, e);
      }
    }

    return json({ ok: true, processed: rows.length, evaluated, sent });
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
