// Edge function: invite a professional (team member) by email.
//
// Two cases are handled:
//  1) The e-mail has no account yet -> auth invite is sent and
//     professionals.email is pre-filled so the handle_new_user trigger links
//     the new user to the right company on sign-up.
//  2) The e-mail already has an account -> we link it to the company right
//     away (professionals.user_id, company_members, user_roles, profiles) and
//     send a magic-link e-mail so she can jump straight into the app.

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

const ALLOWED_ORIGINS = [
  "https://bellenailsapp.com",
  "https://www.bellenailsapp.com",
  "https://bellenailsorigin.lovable.app",
  "https://id-preview--8011af2c-9eff-47f8-bbdd-af8a9c4a5689.lovable.app",
];

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
    if (!authHeader) return json({ error: "Missing Authorization" }, 401);

    // 1) Identify the caller
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Not authenticated" }, 401);
    const callerId = userData.user.id;

    const body = (await req.json()) as InviteBody;
    if (!body?.professionalId || !body?.email) {
      return json({ error: "professionalId and email are required" }, 400);
    }
    const email = body.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: "E-mail inválido" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 2) Load professional
    const { data: prof, error: profErr } = await admin
      .from("professionals")
      .select("id, company_id, name, user_id")
      .eq("id", body.professionalId)
      .maybeSingle();
    if (profErr || !prof) return json({ error: "Profissional não encontrada" }, 404);
    if (prof.user_id) {
      return json({ error: "Esta profissional já tem acesso vinculado" }, 400);
    }

    // 3) Caller must be owner or company_admin of that company
    const { data: company } = await admin
      .from("companies")
      .select("id, name, owner_user_id")
      .eq("id", prof.company_id)
      .maybeSingle();
    if (!company) return json({ error: "Empresa não encontrada" }, 404);

    let allowed = company.owner_user_id === callerId;
    if (!allowed) {
      const { data: member } = await admin
        .from("company_members")
        .select("role")
        .eq("company_id", company.id)
        .eq("user_id", callerId)
        .maybeSingle();
      allowed = member?.role === "company_admin";
    }
    if (!allowed) {
      return json({ error: "Apenas a administradora do salão pode convidar" }, 403);
    }

    // 4) Store pending e-mail on the professional record
    const { error: updErr } = await admin
      .from("professionals")
      .update({ email })
      .eq("id", prof.id);
    if (updErr) return json({ error: updErr.message }, 500);

    const origin = req.headers.get("origin") ?? "";
    const safeOrigin = ALLOWED_ORIGINS.includes(origin)
      ? origin
      : "https://bellenailsapp.com";
    const redirectTo = `${safeOrigin}/auth`;

    // 5) Does the e-mail already have an account?
    const existing = await findUserByEmail(admin, email);

    if (existing) {
      // Link immediately so she lands inside the salon workspace.
      const link = await linkExistingUser(admin, {
        userId: existing.id,
        professionalId: prof.id,
        companyId: company.id,
        displayName: prof.name,
      });
      if (link) return json({ error: link }, 500);

      const { error: otpErr } = await userClient.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
      });
      if (otpErr) {
        console.error("magic link error", otpErr.message);
        return json({
          ok: true,
          linked: true,
          emailSent: false,
          message:
            "Conta vinculada ao salão, mas não conseguimos enviar o e-mail agora. Peça para ela entrar normalmente.",
        });
      }
      return json({ ok: true, linked: true, emailSent: true });
    }

    // 6) Brand new user -> send auth invite
    const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: prof.name,
        invited_company: company.name,
        invited_professional_id: prof.id,
      },
      redirectTo,
    });
    if (inviteErr) {
      console.error("invite error", inviteErr.message);
      return json({ error: `Não foi possível enviar o convite: ${inviteErr.message}` }, 500);
    }

    return json({ ok: true, linked: false, emailSent: true });
  } catch (e) {
    console.error("invite-professional error", e);
    return json({ error: "Falha inesperada ao enviar o convite" }, 500);
  }
});

async function findUserByEmail(
  admin: ReturnType<typeof createClient>,
  email: string,
): Promise<{ id: string } | null> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (hit) return { id: hit.id };
    if (data.users.length < 200) return null;
  }
  return null;
}

async function linkExistingUser(
  admin: ReturnType<typeof createClient>,
  args: { userId: string; professionalId: string; companyId: string; displayName: string },
): Promise<string | null> {
  const { userId, professionalId, companyId, displayName } = args;

  const { error: e1 } = await admin
    .from("professionals")
    .update({ user_id: userId, email: null })
    .eq("id", professionalId);
  if (e1) return e1.message;

  const { error: e2 } = await admin
    .from("company_members")
    .upsert(
      { company_id: companyId, user_id: userId, role: "professional" },
      { onConflict: "company_id,user_id", ignoreDuplicates: true },
    );
  if (e2) return e2.message;

  const { error: e3 } = await admin
    .from("user_roles")
    .upsert(
      { user_id: userId, role: "professional" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );
  if (e3) return e3.message;

  const { error: e4 } = await admin
    .from("profiles")
    .upsert(
      { user_id: userId, display_name: displayName, company_id: companyId },
      { onConflict: "user_id" },
    );
  if (e4) return e4.message;

  return null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
