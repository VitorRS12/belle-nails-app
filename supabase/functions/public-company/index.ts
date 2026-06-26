// Public endpoint: returns company info + active services + active professionals by slug.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const slug = (url.searchParams.get("slug") ?? "").trim().toLowerCase();
    if (!slug || slug.length > 80) return json({ error: "Invalid slug" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: company, error: cErr } = await admin
      .from("companies")
      .select("id, name, slug, timezone, appointment_interval_minutes")
      .eq("slug", slug)
      .maybeSingle();
    if (cErr || !company) return json({ error: "Empresa não encontrada" }, 404);

    const [servicesRes, profsRes, linksRes] = await Promise.all([
      admin
        .from("services")
        .select("id, name, description, category, duration_minutes, price, color")
        .eq("company_id", company.id)
        .eq("active", true)
        .order("name"),
      admin
        .from("professionals")
        .select("id, name, photo_url, bio, specialties")
        .eq("company_id", company.id)
        .eq("active", true)
        .order("name"),
      admin
        .from("professional_services")
        .select("professional_id, service_id")
        .eq("company_id", company.id),
    ]);

    return json({
      company,
      services: servicesRes.data ?? [],
      professionals: profsRes.data ?? [],
      links: linksRes.data ?? [],
    });
  } catch (e) {
    console.error(e);
    return json({ error: "Internal server error" }, 500);
  }
}); 

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
