import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// NewsData.io (ou similar) – espera NEWS_API_KEY no ambiente do projeto Supabase
const API_URL = "https://newsdata.io/api/1/news";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "crypto OR bitcoin OR ethereum";
    const lang = searchParams.get("language") ?? "pt";
    const country = searchParams.get("country") ?? "br";

    const apiKey = Deno.env.get("NEWS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "NEWS_API_KEY not configured" }), {
        status: 500,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    // cache diário
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date();
    const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
      .toISOString()
      .slice(0, 10);

    const { data: cached } = await supabase
      .from("crypto_news_cache")
      .select("articles")
      .eq("date", day)
      .maybeSingle();
    if (cached?.articles) {
      return new Response(JSON.stringify(cached.articles), { headers: { "content-type": "application/json", ...corsHeaders } });
    }

    const url = `${API_URL}?apikey=${apiKey}&q=${encodeURIComponent(q)}&language=${lang}&country=${country}`;
    const r = await fetch(url);
    if (!r.ok) {
      return new Response(JSON.stringify({ error: `upstream ${r.status}` }), {
        status: 502,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }
    const json = await r.json();

    // salvar no cache (permitido via service role)
    await supabase
      .from("crypto_news_cache")
      .upsert({ date: day, articles: json })
      .select()
      .maybeSingle();

    return new Response(JSON.stringify(json), { headers: { "content-type": "application/json", ...corsHeaders } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  }
});


