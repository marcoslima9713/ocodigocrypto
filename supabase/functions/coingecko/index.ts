import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const ids = url.searchParams.get("ids");
    const vs = url.searchParams.get("vs") || "usd";

    if (!ids) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: ids" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // URL simples da API CoinGecko
    const coingeckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs}&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true&include_24hr_high=true&include_24hr_low=true`;

    const response = await fetch(coingeckoUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "CryptoLuxePortal/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in coingecko function:", error);

    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch data from CoinGecko", 
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});