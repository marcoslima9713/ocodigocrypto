import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

// NewsData.io (ou similar) – espera NEWS_API_KEY no ambiente do projeto Supabase
const API_URL = "https://newsdata.io/api/1/news";

serve(async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "crypto OR bitcoin OR ethereum";
    const lang = searchParams.get("language") ?? "pt";
    const country = searchParams.get("country") ?? "br";

    const apiKey = Deno.env.get("NEWS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "NEWS_API_KEY not configured" }), { status: 500 });
    }

    const r = await fetch(`${API_URL}?apikey=${apiKey}&q=${encodeURIComponent(q)}&language=${lang}&country=${country}`);
    if (!r.ok) {
      return new Response(JSON.stringify({ error: `upstream ${r.status}` }), { status: 502 });
    }
    const json = await r.json();
    return new Response(JSON.stringify(json), { headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});


