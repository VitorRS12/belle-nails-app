import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const { companyId } = await req.json().catch(() => ({}));
    if (!companyId || typeof companyId !== "string") {
      return json({ error: "companyId required" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Verify caller is an owner or company_admin of the target company
    const { data: company } = await admin
      .from("companies")
      .select("id, owner_user_id")
      .eq("id", companyId)
      .maybeSingle();
    if (!company) return json({ error: "Company not found" }, 404);

    let authorized = company.owner_user_id === userId;
    if (!authorized) {
      const { data: member } = await admin
        .from("company_members")
        .select("role")
        .eq("company_id", companyId)
        .eq("user_id", userId)
        .in("role", ["company_admin"])
        .maybeSingle();
      authorized = !!member;
    }
    if (!authorized) return json({ error: "Forbidden" }, 403);

    const { data: session, error: insErr } = await admin
      .from("checkout_sessions")
      .insert({ user_id: userId, company_id: companyId })
      .select("id")
      .single();
    if (insErr || !session) return json({ error: "Could not create session" }, 500);

    return json({ sessionId: session.id });
  } catch (e) {
    console.error("create-checkout-session error", e);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
