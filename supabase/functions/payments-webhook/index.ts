import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyWebhook, EventName, type PaddleEnv } from "../_shared/paddle.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

async function resolvePlanIdByPriceExternalId(priceExternalId: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from("subscription_plans")
    .select("id")
    .eq("paddle_price_id", priceExternalId)
    .maybeSingle();
  return (data as any)?.id ?? null;
}

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const companyId: string | undefined = data?.customData?.companyId;
  if (!companyId) {
    console.warn("No companyId in customData; skipping");
    return;
  }
  const item = data.items?.[0];
  const priceExternalId: string | undefined = item?.price?.importMeta?.externalId;
  if (!priceExternalId) {
    console.warn("Missing importMeta.externalId on price; skipping");
    return;
  }
  const planId = await resolvePlanIdByPriceExternalId(priceExternalId);
  if (!planId) {
    console.warn("No plan matched price", priceExternalId);
    return;
  }

  await getSupabase()
    .from("company_subscriptions")
    .upsert(
      {
        company_id: companyId,
        plan_id: planId,
        paddle_subscription_id: data.id,
        paddle_customer_id: data.customerId,
        status: data.status,
        environment: env,
        current_period_start: data.currentBillingPeriod?.startsAt,
        current_period_end: data.currentBillingPeriod?.endsAt,
        trial_ends_at: data.status === "trialing" ? data.currentBillingPeriod?.endsAt : null,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id" },
    );
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const item = data.items?.[0];
  const priceExternalId: string | undefined = item?.price?.importMeta?.externalId;
  const planId = priceExternalId ? await resolvePlanIdByPriceExternalId(priceExternalId) : null;

  const patch: Record<string, unknown> = {
    status: data.status,
    current_period_start: data.currentBillingPeriod?.startsAt,
    current_period_end: data.currentBillingPeriod?.endsAt,
    cancel_at_period_end: data.scheduledChange?.action === "cancel",
    environment: env,
    updated_at: new Date().toISOString(),
  };
  if (planId) patch.plan_id = planId;

  await getSupabase()
    .from("company_subscriptions")
    .update(patch)
    .eq("paddle_subscription_id", data.id);
}

async function handleSubscriptionCanceled(data: any) {
  // Downgrade to Free plan
  const { data: freePlan } = await getSupabase()
    .from("subscription_plans")
    .select("id")
    .eq("slug", "free")
    .maybeSingle();

  await getSupabase()
    .from("company_subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
      plan_id: (freePlan as any)?.id ?? undefined,
      paddle_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", data.id);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const url = new URL(req.url);
  const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
  try {
    const event = await verifyWebhook(req, env);
    switch (event.eventType) {
      case EventName.SubscriptionCreated:
        await handleSubscriptionCreated(event.data, env);
        break;
      case EventName.SubscriptionUpdated:
        await handleSubscriptionUpdated(event.data, env);
        break;
      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(event.data);
        break;
      default:
        console.log("Unhandled event:", event.eventType);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
