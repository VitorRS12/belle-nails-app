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
  | "booking_cancelled_company"
  | "booking_reminder_customer";

interface Body {
  template: Template;
  to: string;
  data: Record<string, string | number | undefined>;
  companyId?: string;
  appointmentId?: string;
}

const FROM = Deno.env.get("NOTIFICATION_FROM") ?? "Belle Nails <onboarding@resend.dev>";
const LOGO_URL =
  Deno.env.get("NOTIFICATION_LOGO_URL") ?? "https://bellenailsorigin.lovable.app/favicon.png";
const BRAND_NAME = "Belle Nails";

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

function layout(opts: { eyebrow?: string; title: string; body: string; footerNote?: string }) {
  const { eyebrow, title, body, footerNote } = opts;
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:24px 0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#3B2028;">
  <div style="max-width:580px;margin:0 auto;padding:0 16px;">
    <!-- Hero -->
    <div style="background:linear-gradient(135deg,#FFF1F4 0%,#FCE4EC 45%,#F8BBD0 100%);border-radius:24px 24px 0 0;padding:36px 24px 28px;text-align:center;">
      <img src="${LOGO_URL}" alt="${esc(BRAND_NAME)}" width="52" height="52"
        style="width:52px;height:52px;border-radius:50%;display:inline-block;object-fit:cover;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(199,77,108,0.18);" />
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:bold;color:#8E2E4A;margin:12px 0 4px;letter-spacing:0.6px;">${esc(BRAND_NAME)}</div>
      <div style="font-size:12px;color:#B76B82;letter-spacing:2px;text-transform:uppercase;">Beleza que cuida de você</div>
    </div>
    <!-- Card -->
    <div style="background:#FFFAFB;border:1px solid #F5D9E0;border-top:none;border-radius:0 0 24px 24px;padding:36px 32px 32px;">
      ${eyebrow ? `<div style="font-size:11px;font-weight:bold;color:#C74D6C;letter-spacing:2.5px;text-transform:uppercase;text-align:center;margin-bottom:8px;">${esc(eyebrow)}</div>` : ""}
      <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:#3B2028;margin:0 0 20px;text-align:center;line-height:1.25;">${esc(title)}</h1>
      ${body}
    </div>
    <!-- Footer -->
    <div style="padding:24px 16px 8px;text-align:center;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:#8E2E4A;font-style:italic;margin-bottom:8px;">Com carinho, equipe ${esc(BRAND_NAME)} 💗</div>
      ${footerNote ? `<div style="font-size:12px;color:#9B8A90;margin-bottom:4px;">${footerNote}</div>` : ""}
      <div style="font-size:11px;color:#B7A9AE;margin-top:12px;">Enviado automaticamente — não responda este email.</div>
    </div>
  </div></body></html>`;
}

function ctaButton(label: string, url: string, variant: "primary" | "danger" = "primary") {
  const bg = variant === "danger"
    ? "linear-gradient(135deg,#DC2626 0%,#991B1B 100%)"
    : "linear-gradient(135deg,#C74D6C 0%,#9E3556 100%)";
  const shadow = variant === "danger"
    ? "0 6px 16px rgba(220,38,38,0.28)"
    : "0 6px 16px rgba(199,77,108,0.28)";
  return `<div style="text-align:center;margin:28px 0 12px;">
    <a href="${esc(url)}"
      style="display:inline-block;background:${bg};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:bold;font-size:15px;letter-spacing:0.3px;box-shadow:${shadow};">
      ${esc(label)}
    </a>
  </div>`;
}

function detailsTable(rows: Array<[string, string]>) {
  return `<div style="background:#FDF0F3;border:1px solid #F5D9E0;border-radius:14px;padding:8px 20px;margin:20px 0;">
    <table style="width:100%;border-collapse:collapse;">
      ${rows.map(([k, v], i) => `
        <tr>
          <td style="padding:12px 0;color:#8B6F78;font-size:13px;letter-spacing:0.3px;${i > 0 ? "border-top:1px solid #F5D9E0;" : ""}">${esc(k)}</td>
          <td style="padding:12px 0;text-align:right;color:#3B2028;font-weight:bold;font-size:14px;${i > 0 ? "border-top:1px solid #F5D9E0;" : ""}">${v}</td>
        </tr>`).join("")}
    </table>
  </div>`;
}

function lead(text: string) {
  return `<p style="font-size:15px;color:#5A404A;line-height:1.65;margin:0 0 16px;">${text}</p>`;
}

function renderTemplate(t: Template, d: Record<string, unknown>) {
  const customer = esc(d.customerName);
  const company = esc(d.companyName);
  const service = esc(d.serviceName);
  const professional = esc(d.professionalName);
  const date = esc(d.date);
  const time = esc(d.time);
  const cancelUrl = typeof d.cancelUrl === "string" ? d.cancelUrl : "";

  const details = detailsTable([
    ["Serviço", `<strong>${service}</strong>`],
    ["Profissional", professional],
    ["Data & horário", `${date} · ${time}`],
  ]);

  switch (t) {
    case "booking_confirmation_customer":
      return {
        subject: `Recebemos seu agendamento — ${d.companyName}`,
        html: layout({
          eyebrow: "Agendamento recebido",
          title: `Olá, ${customer} ✨`,
          body: `
            ${lead(`Recebemos seu pedido em <strong>${company}</strong>. Ele já entrou na agenda e está aguardando a confirmação da profissional.`)}
            ${details}
            ${lead("Assim que for confirmado você recebe um novo email — pode deixar com a gente.")}
            ${cancelUrl ? `<div style="border-top:1px solid #F3E1E4;margin-top:24px;padding-top:16px;"><p style="font-size:13px;color:#7A6970;text-align:center;margin:0 0 4px;">Precisa cancelar?</p>${ctaButton("Cancelar agendamento", cancelUrl, "danger")}</div>` : ""}
          `,
        }),
      };
    case "booking_new_company":
      return {
        subject: `Novo agendamento — ${d.customerName} (${d.date} ${d.time})`,
        html: layout({
          eyebrow: "Novo pedido",
          title: "Um novo agendamento chegou",
          body: `
            ${lead(`<strong>${customer}</strong> pediu um horário e está aguardando sua confirmação.`)}
            ${detailsTable([
              ["Cliente", `<strong>${customer}</strong>`],
              ["Contato", esc(d.customerContact)],
              ["Serviço", service],
              ["Profissional", professional],
              ["Quando", `${date} · ${time}`],
            ])}
            ${lead("Abra o painel do Belle Nails para confirmar, remarcar ou recusar.")}
          `,
          footerNote: "Você recebe estes avisos porque é membro desta empresa.",
        }),
      };
    case "booking_confirmed_customer":
      return {
        subject: `Agendamento confirmado — ${d.companyName}`,
        html: layout({
          eyebrow: "Está confirmado",
          title: `Tudo certo, ${customer} 💗`,
          body: `
            ${lead(`Sua profissional confirmou seu agendamento em <strong>${company}</strong>. Já pode marcar na agenda!`)}
            ${details}
            ${lead("Te esperamos com muito carinho.")}
            ${cancelUrl ? `<div style="border-top:1px solid #F3E1E4;margin-top:24px;padding-top:16px;"><p style="font-size:13px;color:#7A6970;text-align:center;margin:0 0 4px;">Imprevisto de última hora?</p>${ctaButton("Preciso cancelar", cancelUrl, "danger")}</div>` : ""}
          `,
        }),
      };
    case "booking_cancelled_customer":
      return {
        subject: `Agendamento cancelado — ${d.companyName}`,
        html: layout({
          eyebrow: "Agendamento cancelado",
          title: `Olá, ${customer}`,
          body: `
            ${lead(`Seu agendamento em <strong>${company}</strong> foi cancelado.`)}
            ${details}
            ${lead("Sempre que quiser voltar, é só acessar nossa página de agendamentos para escolher um novo horário. Vamos adorar te receber. ✨")}
          `,
        }),
      };
    case "booking_cancelled_company":
      return {
        subject: `Cancelamento — ${d.customerName} (${d.date} ${d.time})`,
        html: layout({
          eyebrow: "Cancelamento de cliente",
          title: "Um horário foi liberado",
          body: `
            ${lead(`A cliente <strong>${customer}</strong> cancelou o agendamento abaixo. O horário voltou a ficar disponível na sua agenda.`)}
            ${details}
          `,
          footerNote: "Você recebe estes avisos porque é membro desta empresa.",
        }),
      };
    case "booking_reminder_customer":
      return {
        subject: `Lembrete: ${d.serviceName} em ${d.date}`,
        html: layout({
          eyebrow: "Seu horário está chegando",
          title: `Amanhã tem ${d.serviceName ? esc(d.serviceName) : "atendimento"} ✨`,
          body: `
            ${lead(`Olá, ${customer}! Passamos rapidinho para lembrar do seu agendamento em <strong>${company}</strong>.`)}
            ${details}
            ${lead("Nos vemos em breve. Se precisar remarcar, é só usar o botão abaixo.")}
            ${cancelUrl ? ctaButton("Preciso cancelar", cancelUrl, "danger") : ""}
          `,
        }),
      };
    default:
      return null;
  }
}

