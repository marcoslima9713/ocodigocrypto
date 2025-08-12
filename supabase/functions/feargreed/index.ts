import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

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
    let limit = 30;
    try {
      const body = await req.json().catch(() => ({}));
      if (body?.limit && typeof body.limit === "number") limit = body.limit;
    } catch {}
    const url = `https://api.alternative.me/fng/?limit=${limit}&format=json`;
    const r = await fetch(url, { headers: { accept: "application/json" } });
    if (!r.ok) {
      return new Response(JSON.stringify({ error: `upstream ${r.status}` }), {
        status: 502,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }
    const json = await r.json();
    return new Response(JSON.stringify(json), { headers: { "content-type": "application/json", ...corsHeaders } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  }
});


