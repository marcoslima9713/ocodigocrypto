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
    let endpoint: string | null = null;
    let coinId: string | null = null;
    let vsCurrency: string | null = null;
    let days: string | null = null;

    // Tenta ler parâmetros do body primeiro (POST)
    if (req.method === "POST") {
      try {
        const body = await req.json();
        endpoint = body.endpoint;
        coinId = body.coin_id;
        vsCurrency = body.vs_currency;
        days = body.days;
      } catch (e) {
        console.log("Erro ao ler body:", e);
      }
    }

    // Se não há parâmetros no body, tenta URL params
    if (!endpoint) {
      const url = new URL(req.url);
      endpoint = url.searchParams.get("endpoint");
      coinId = url.searchParams.get("coin_id");
      vsCurrency = url.searchParams.get("vs_currency");
      days = url.searchParams.get("days");
    }

    if (endpoint === "market_chart") {
      // API de market_chart para gráficos
      coinId = coinId || "bitcoin";
      vsCurrency = vsCurrency || "usd";
      days = days || "30";

      const coingeckoUrl = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${vsCurrency}&days=${days}`;
      console.log("Chamando market_chart URL:", coingeckoUrl);

      const response = await fetch(coingeckoUrl, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "CryptoLuxePortal/1.0",
        },
      });

      if (!response.ok) {
        console.error("CoinGecko API error:", response.status, response.statusText);
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Dados recebidos com sucesso");

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      return new Response(
        JSON.stringify({ error: "Endpoint não suportado. Use 'market_chart'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
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