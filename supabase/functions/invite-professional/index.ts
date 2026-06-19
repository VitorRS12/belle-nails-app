// Edge function: invite a professional by email.
// Creates (or updates) the auth invite and pre-fills professionals.email so
// the handle_new_user trigger links the new user to the right company.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteBody {
  professionalId: string;
  email: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return json({ error: "Missing Authorization" }, 401);
    }

    // 1) Identify the caller using the anon client + their JWT
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "Not authenticated" }, 401);
    }
    const callerId = userData.user.id;

    const body = (await req.json()) as InviteBody;
    if (!body.professionalId || !body.email) {
      return json({ error: "professionalId and email are required" }, 400);
    }
    const email = body.email.trim().toLowerCase();

    // 2) Service-role client for privileged actions
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 3) Load professional + check caller is the company owner
    const { data: prof, error: profErr } = await admin
      .from("professionals")
      .select("id, company_id, name, user_id")
      .eq("id", body.professionalId)
      .maybeSingle();
    if (profErr || !prof) {
      return json({ error: "Professional not found" }, 404);
    }
    if (prof.user_id) {
      return json({ error: "Professional already linked to an account" }, 400);
    }

    const { data: company } = await admin
      .from("companies")
      .select("id, name, owner_user_id")
      .eq("id", prof.company_id)
      .maybeSingle();
    if (!company || company.owner_user_id !== callerId) {
      return json({ error: "Only the company owner can invite" }, 403);
    }

    // 4) Persist pending email on professional
    const { error: updErr } = await admin
      .from("professionals")
      .update({ email })
      .eq("id", prof.id);
    if (updErr) return json({ error: updErr.message }, 500);

    // 5) Send the invitation email
    const redirectTo = req.headers.get("origin")
      ? `${req.headers.get("origin")}/auth`
      : undefined;

    const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: prof.name,
        invited_company: company.name,
        invited_professional_id: prof.id,
      },
      redirectTo,
    });

    if (inviteErr) {
      // If user already exists, fall back to magic link
      const { error: linkErr } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });
      if (linkErr) return json({ error: inviteErr.message }, 500);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("invite-professional error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
