// Public endpoint: returns available time slots for a professional + service on a given date.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  companyId: string;
  professionalId: string;
  serviceId: string;
  date: string; // yyyy-MM-dd
}

const SLOT_STEP_MINUTES = 30;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = (await req.json()) as Body;
    if (!body.companyId || !body.professionalId || !body.serviceId || !body.date) {
      return json({ error: "Missing fields" }, 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return json({ error: "Invalid date" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Validate professional belongs to company
    const { data: prof } = await admin
      .from("professionals")
      .select("id, company_id, active")
      .eq("id", body.professionalId)
      .maybeSingle();
    if (!prof || prof.company_id !== body.companyId || !prof.active) {
      return json({ error: "Profissional indisponível" }, 404);
    }

    // Service duration
    const { data: service } = await admin
      .from("services")
      .select("id, company_id, duration_minutes, active")
      .eq("id", body.serviceId)
      .maybeSingle();
    if (!service || service.company_id !== body.companyId || !service.active) {
      return json({ error: "Serviço indisponível" }, 404);
    }
    const duration = service.duration_minutes;

    // Weekday for that date (JS getDay matches our 0..6 convention)
    const weekday = new Date(`${body.date}T12:00:00Z`).getUTCDay();

    // Schedules
    const { data: schedules } = await admin
      .from("professional_schedules")
      .select("start_time, end_time")
      .eq("professional_id", body.professionalId)
      .eq("weekday", weekday);
    if (!schedules || schedules.length === 0) return json({ slots: [] });

    // Existing appointments for that pro on that date
    const { data: appts } = await admin
      .from("appointments")
      .select("time, services")
      .eq("professional_id", body.professionalId)
      .eq("date", body.date)
      .neq("status", "cancelled");

    // Build busy intervals (start, end) in minutes
    const busy: Array<[number, number]> = (appts ?? []).map((a) => {
      const start = toMinutes(a.time);
      // We don't store duration on appointments; assume same `duration` minimum.
      // Use 60 as safety default if services array is empty.
      const dur = 60;
      return [start, start + dur];
    });

    const today = new Date();
    const isToday = body.date === today.toISOString().slice(0, 10);
    const nowMin = isToday ? today.getHours() * 60 + today.getMinutes() : -1;

    const slots: string[] = [];
    for (const block of schedules) {
      const blockStart = toMinutes(block.start_time);
      const blockEnd = toMinutes(block.end_time);
      for (let t = blockStart; t + duration <= blockEnd; t += SLOT_STEP_MINUTES) {
        if (isToday && t <= nowMin + 30) continue; // 30min buffer for same-day
        const slotEnd = t + duration;
        const conflict = busy.some(([bs, be]) => t < be && slotEnd > bs);
        if (!conflict) slots.push(fromMinutes(t));
      }
    }

    return json({ slots });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

function toMinutes(hms: string): number {
  const [h, m] = hms.split(":").map(Number);
  return h * 60 + m;
}
function fromMinutes(t: number): string {
  const h = Math.floor(t / 60).toString().padStart(2, "0");
  const m = (t % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
