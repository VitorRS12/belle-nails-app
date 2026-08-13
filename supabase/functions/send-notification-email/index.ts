// Thin compatibility wrapper: keeps the legacy `template` API used across the app
// while delegating the actual delivery to `send-transactional-email`
// (Lovable Emails infrastructure, verified sender domain).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Template =
  | "booking_confirmation_customer"
  | "booking_new_company"
  | "booking_confirmed_customer"
  | "booking_cancelled_customer"
  | "booking_cancelled_company"
  | "booking_reminder_customer";

const TEMPLATE_MAP: Record<Template, string> = {
  booking_confirmation_customer: "booking-confirmation-customer",
  booking_new_company: "booking-new-company",
  booking_confirmed_customer: "booking-confirmed-customer",
  booking_cancelled_customer: "booking-cancelled-customer",
  booking_cancelled_company: "booking-cancelled-company",
  booking_reminder_customer: "booking-reminder-customer",
};

interface Body {
  template: Template;
  to: string;
  data: Record<string, string | number | undefined>;
  companyId?: string;
  appointmentId?: string;
  idempotencyKey?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth: accept either a valid user JWT or the service role key (server-to-server).
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    let authorized = false;
    if (token && token === SERVICE_ROLE) {
      authorized = true;
    } else if (token) {
      const authClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);
      const { data, error } = await authClient.auth.getUser(token);
      if (!error && data?.user) authorized = true;
    }
    if (!authorized) return json({ error: "Unauthorized" }, 401);

    const body = (await req.json()) as Body;
    if (!body.template || !body.to || !body.data) {
      return json({ error: "template, to and data are required" }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.to) || body.to.length > 255) {
      return json({ error: "Invalid recipient email" }, 400);
    }

    const templateName = TEMPLATE_MAP[body.template];
    if (!templateName) return json({ error: "Unknown template" }, 400);

    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE}`,
        apikey: SERVICE_ROLE,
      },
      body: JSON.stringify({
        templateName,
        recipientEmail: body.to,
        idempotencyKey:
          body.idempotencyKey ??
          (body.appointmentId ? `${templateName}-${body.appointmentId}` : undefined),
        templateData: body.data,
      }),
    });

    const payload = await res.json().catch(() => ({}));
    const ok = res.ok && payload?.success !== false;

    // Best-effort audit log (app-facing notification history)
    try {
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
      await admin.from("notification_log").insert({
        company_id: body.companyId ?? null,
        appointment_id: body.appointmentId ?? null,
        channel: "email",
        template: body.template,
        recipient: body.to,
        subject: templateName,
        status: ok ? "sent" : "failed",
        provider_id: payload?.messageId ?? payload?.message_id ?? null,
        error: ok ? null : JSON.stringify(payload).slice(0, 500),
      });
    } catch (logErr) {
      console.error("notification_log insert failed", logErr);
    }

    if (!ok) {
      console.error("send-transactional-email failed", res.status, payload);
      return json({ error: "Email send failed" }, 502);
    }
    return json({ ok: true, id: payload?.messageId ?? null });
  } catch (e) {
    console.error(e);
    return json({ error: "Unexpected error" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
