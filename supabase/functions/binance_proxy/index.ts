import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const url = new URL(req.url);
    const symbols = url.searchParams.get("symbols") ||
      '["BTCUSDT","ETHUSDT","ADAUSDT","DOTUSDT","SOLUSDT","MATICUSDT","AVAXUSDT","ATOMUSDT","LINKUSDT","UNIUSDT"]';

    const r = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${symbols}`);

    if (!r.ok) throw new Error(`Binance ${r.status}`);

    const text = await r.text();
    return new Response(text, {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});