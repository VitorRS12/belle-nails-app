// Scheduled job: sends advance-notice billing emails.
// - Trial ending: 7 days and 1 day before `trial_ends_at`
// - Renewal: 3 days before `current_period_end`
// Runs daily via pg_cron. Each notice is marked on company_subscriptions so it
// is only sent once per cycle.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { sendTemplateEmailLogged } from "../_shared/send-email-logged.ts";

const DAY_MS = 86_400_000;
const SITE_URL = "https://bellenailsapp.com";

type Notice = "trial7" | "trial1" | "renewal";

function formatAmount(cents: number | null, currency: string | null) {
  const value = (cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(value);
  } catch {
    return `R$ ${value.toFixed(2)}`;
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Bahia" });
}

// Accepts either the exact service-role key or any JWT carrying the
// service_role claim (covers rotated/alternate service keys used by cron).
function isServiceRoleToken(token: string, serviceRole: string): boolean {
  if (!token) return false;
  if (token === serviceRole) return true;
  try {
    const [, payload] = token.split(".");
    if (!payload) return false;
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { role?: string };
    return json.role === "service_role";
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!isServiceRoleToken(token, SERVICE_ROLE)) {
      console.warn("unauthorized call to send-billing-notices");
      return json({ error: "Unauthorized" }, 401);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const now = Date.now();

    const { data: subs, error } = await admin
      .from("company_subscriptions")
      .select(
        "id, company_id, status, trial_ends_at, current_period_end, cancel_at_period_end, trial_notice_7d_sent_at, trial_notice_1d_sent_at, renewal_notice_for_period_end, plan_id",
      )
      .in("status", ["trialing", "active"])
      .limit(500);

    if (error) {
      console.error("subscriptions query failed", error);
      return json({ error: error.message }, 500);
    }
    if (!subs?.length) return json({ ok: true, evaluated: 0, sent: 0 });

    const planIds = Array.from(new Set(subs.map((s) => s.plan_id)));
    const companyIds = Array.from(new Set(subs.map((s) => s.company_id)));

    const [{ data: plans }, { data: companies }] = await Promise.all([
      admin
        .from("subscription_plans")
        .select("id, name, price_cents, currency")
        .in("id", planIds),
      admin.from("companies").select("id, name, owner_user_id").in("id", companyIds),
    ]);

    const planById = new Map((plans ?? []).map((p) => [p.id, p]));
    const companyById = new Map((companies ?? []).map((c) => [c.id, c]));

    // Resolve owner emails/names via the auth admin API.
    const ownerCache = new Map<string, { email: string | null; name: string }>();
    async function owner(userId: string) {
      if (ownerCache.has(userId)) return ownerCache.get(userId)!;
      const { data } = await admin.auth.admin.getUserById(userId);
      const meta = (data?.user?.user_metadata ?? {}) as Record<string, unknown>;
      const info = {
        email: data?.user?.email ?? null,
        name:
          (meta.full_name as string) ||
          (meta.name as string) ||
          (data?.user?.email?.split("@")[0] ?? ""),
      };
      ownerCache.set(userId, info);
      return info;
    }

    let sent = 0;
    let evaluated = 0;

    for (const s of subs) {
      const company = companyById.get(s.company_id);
      const plan = planById.get(s.plan_id);
      if (!company || !plan) continue;

      const notices: Array<{ kind: Notice; days: number; chargeDate: string | null }> = [];

      if (s.status === "trialing" && s.trial_ends_at) {
        const daysLeft = Math.ceil((new Date(s.trial_ends_at).getTime() - now) / DAY_MS);
        if (daysLeft === 7 && !s.trial_notice_7d_sent_at) {
          notices.push({ kind: "trial7", days: 7, chargeDate: s.trial_ends_at });
        } else if (daysLeft === 1 && !s.trial_notice_1d_sent_at) {
          notices.push({ kind: "trial1", days: 1, chargeDate: s.trial_ends_at });
        }
      }

      if (
        s.status === "active" &&
        s.current_period_end &&
        !s.cancel_at_period_end &&
        s.renewal_notice_for_period_end !== s.current_period_end
      ) {
        const daysLeft = Math.ceil((new Date(s.current_period_end).getTime() - now) / DAY_MS);
        if (daysLeft === 3) {
          notices.push({ kind: "renewal", days: 3, chargeDate: s.current_period_end });
        }
      }

      if (!notices.length) continue;
      console.log('notice candidate', s.id, notices.map((n) => n.kind).join(','));

      const info = await owner(company.owner_user_id);
      if (!info.email) { console.warn('owner email missing', company.owner_user_id); continue; }

      for (const n of notices) {
        evaluated++;
        const templateName =
          n.kind === "renewal" ? "billing-renewal-upcoming" : "billing-trial-ending";
        const cycleKey = (n.chargeDate ?? "").slice(0, 10);
        try {
          const result = await sendTemplateEmailLogged(admin, templateName, info.email, {
            idempotencyKey: `${templateName}-${s.id}-${n.days}d-${cycleKey}`,
            templateData: {
              ownerName: info.name,
              companyName: company.name,
              planName: plan.name,
              amount: formatAmount(plan.price_cents, plan.currency),
              chargeDate: formatDate(n.chargeDate),
              daysLeft: n.days,
              manageUrl: `${SITE_URL}/planos`,
            },
          });

          if (!result.sent) {
            console.warn("billing notice recipient suppressed", s.id, n.kind);
          }

          const patch: Record<string, unknown> = {};
          if (n.kind === "trial7") patch.trial_notice_7d_sent_at = new Date().toISOString();
          if (n.kind === "trial1") patch.trial_notice_1d_sent_at = new Date().toISOString();
          if (n.kind === "renewal") patch.renewal_notice_for_period_end = s.current_period_end;
          await admin.from("company_subscriptions").update(patch).eq("id", s.id);
          sent++;
        } catch (e) {
          console.error("billing notice loop error", s.id, n.kind, e);
        }
      }
    }

    console.log('billing notices summary', { subscriptions: subs.length, evaluated, sent });
    return json({ ok: true, subscriptions: subs.length, evaluated, sent });
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
