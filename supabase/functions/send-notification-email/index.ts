// Feature sender: keeps the legacy `template` API used across the app while
// delivering through Lovable's managed email API (verified sender domain).

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { sendTemplateEmailLogged } from "../_shared/send-email-logged.ts";

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

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    let ok = true;
    let suppressed = false;
    let errorMessage: string | null = null;

    try {
      const result = await sendTemplateEmailLogged(admin, templateName, body.to, {
        templateData: body.data,
        idempotencyKey:
          body.idempotencyKey ??
          (body.appointmentId ? `${templateName}-${body.appointmentId}` : undefined),
      });
      suppressed = !result.sent;
    } catch (e) {
      ok = false;
      errorMessage = e instanceof Error ? e.message : String(e);
      console.error("email send failed", templateName, errorMessage);
    }

    // Best-effort audit log (app-facing notification history)
    try {
      await admin.from("notification_log").insert({
        company_id: body.companyId ?? null,
        appointment_id: body.appointmentId ?? null,
        channel: "email",
        template: body.template,
        recipient: body.to,
        subject: templateName,
        status: ok ? (suppressed ? "suppressed" : "sent") : "failed",
        provider_id: null,
        error: errorMessage ? errorMessage.slice(0, 500) : null,
      });
    } catch (logErr) {
      console.error("notification_log insert failed", logErr);
    }

    if (!ok) return json({ error: "Email send failed" }, 502);
    // A suppressed recipient is an expected outcome, not an error.
    return json({ ok: true, suppressed });
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
