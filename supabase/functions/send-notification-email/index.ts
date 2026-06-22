// Sends transactional emails via the Resend connector gateway.
// Templates: booking_confirmation_customer, booking_new_company,
//            booking_confirmed_customer, booking_cancelled_customer,
//            booking_reminder_customer.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

type Template =
  | "booking_confirmation_customer"
  | "booking_new_company"
  | "booking_confirmed_customer"
  | "booking_cancelled_customer"
  | "booking_reminder_customer";

interface Body {
  template: Template;
  to: string;
  data: Record<string, string | number | undefined>;
  companyId?: string;
  appointmentId?: string;
}

const FROM = Deno.env.get("NOTIFICATION_FROM") ?? "Bellenails <onboarding@resend.dev>";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      return json({ error: "Email provider not configured" }, 500);
    }

    // Auth: accept either a valid user JWT or the service role key (server-to-server).
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    let authorized = false;
    if (token && token === SERVICE_ROLE) {
      authorized = true;
    } else if (token) {
      const authClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
      );
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

    const rendered = renderTemplate(body.template, body.data);
    if (!rendered) return json({ error: "Unknown template" }, 400);

    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: FROM,
        to: [body.to],
        subject: rendered.subject,
        html: rendered.html,
      }),
    });

    const payload = await res.json().catch(() => ({}));

    // Best-effort audit log
    try {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await admin.from("notification_log").insert({
        company_id: body.companyId ?? null,
        appointment_id: body.appointmentId ?? null,
        channel: "email",
        template: body.template,
        recipient: body.to,
        subject: rendered.subject,
        status: res.ok ? "sent" : "failed",
        provider_id: payload?.id ?? null,
        error: res.ok ? null : JSON.stringify(payload).slice(0, 500),
      });
    } catch (logErr) {
      console.error("notification_log insert failed", logErr);
    }

    if (!res.ok) {
      console.error("Resend error", res.status, payload);
      return json({ error: "Email send failed", details: payload }, 502);
    }
    return json({ ok: true, id: payload?.id });
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

// ---------- Templates ----------

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="background:#fff;border-radius:16px;padding:32px 28px;box-shadow:0 1px 3px rgba(0,0,0,.05);">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;">${esc(title)}</h1>
      ${body}
    </div>
    <p style="margin-top:24px;font-size:12px;color:#888;text-align:center;">Enviado automaticamente — não responda este e-mail.</p>
  </div></body></html>`;
}

function renderTemplate(t: Template, d: Record<string, unknown>) {
  const customer = esc(d.customerName);
  const company = esc(d.companyName);
  const service = esc(d.serviceName);
  const professional = esc(d.professionalName);
  const date = esc(d.date);
  const time = esc(d.time);

  switch (t) {
    case "booking_confirmation_customer":
      return {
        subject: `Recebemos seu agendamento — ${d.companyName}`,
        html: layout("Agendamento recebido", `
          <p>Olá, ${customer}!</p>
          <p>Recebemos seu pedido de agendamento em <strong>${company}</strong>. Ele está aguardando confirmação.</p>
          <table style="width:100%;margin:16px 0;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;">Serviço</td><td style="text-align:right;"><strong>${service}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Profissional</td><td style="text-align:right;"><strong>${professional}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Data</td><td style="text-align:right;"><strong>${date} às ${time}</strong></td></tr>
          </table>
          <p>Você receberá uma nova mensagem assim que for confirmado.</p>`),
      };
    case "booking_new_company":
      return {
        subject: `Novo agendamento — ${d.customerName} (${d.date} ${d.time})`,
        html: layout("Novo agendamento recebido", `
          <p>Um novo agendamento aguarda sua confirmação.</p>
          <table style="width:100%;margin:16px 0;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;">Cliente</td><td style="text-align:right;"><strong>${customer}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Contato</td><td style="text-align:right;">${esc(d.customerContact)}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Serviço</td><td style="text-align:right;"><strong>${service}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Profissional</td><td style="text-align:right;"><strong>${professional}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Quando</td><td style="text-align:right;"><strong>${date} ${time}</strong></td></tr>
          </table>
          <p>Acesse o painel para confirmar ou recusar.</p>`),
      };
    case "booking_confirmed_customer":
      return {
        subject: `Agendamento confirmado — ${d.companyName}`,
        html: layout("Agendamento confirmado ✅", `
          <p>Olá, ${customer}! Seu agendamento foi confirmado.</p>
          <table style="width:100%;margin:16px 0;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;">Serviço</td><td style="text-align:right;"><strong>${service}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Profissional</td><td style="text-align:right;"><strong>${professional}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Quando</td><td style="text-align:right;"><strong>${date} às ${time}</strong></td></tr>
          </table>
          <p>Te esperamos!</p>`),
      };
    case "booking_cancelled_customer":
      return {
        subject: `Agendamento cancelado — ${d.companyName}`,
        html: layout("Agendamento cancelado", `
          <p>Olá, ${customer}.</p>
          <p>Seu agendamento de <strong>${service}</strong> com ${professional} em <strong>${date} às ${time}</strong> foi cancelado.</p>
          <p>Se desejar, agende um novo horário pelo nosso site.</p>`),
      };
    case "booking_reminder_customer":
      return {
        subject: `Lembrete: ${d.serviceName} em ${d.date}`,
        html: layout("Seu horário está chegando", `
          <p>Olá, ${customer}! Passando para lembrar do seu agendamento:</p>
          <table style="width:100%;margin:16px 0;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;">Serviço</td><td style="text-align:right;"><strong>${service}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Profissional</td><td style="text-align:right;"><strong>${professional}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Quando</td><td style="text-align:right;"><strong>${date} às ${time}</strong></td></tr>
          </table>`),
      };
    default:
      return null;
  }
}
