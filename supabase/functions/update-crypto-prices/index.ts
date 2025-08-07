import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔄 Iniciando atualização de preços e ranking...')

    // Lista de criptomoedas para buscar preços
    const cryptoIds = ['bitcoin', 'ethereum', 'cardano', 'solana', 'polkadot', 'chainlink', 'matic-network', 'avalanche-2']
    const symbols = ['BTC', 'ETH', 'ADA', 'SOL', 'DOT', 'LINK', 'MATIC', 'AVAX']

    // Buscar preços da API CoinGecko
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(',')}&vs_currencies=usd`
    )

    if (!response.ok) {
      throw new Error(`Erro na API CoinGecko: ${response.status}`)
    }

    const prices = await response.json()
    console.log('✅ Preços obtidos da API CoinGecko:', Object.keys(prices))

    // Preparar dados para inserção
    const priceData = symbols.map((symbol, index) => ({
      crypto_symbol: symbol,
      price_usd: prices[cryptoIds[index]]?.usd || 0
    })).filter(item => item.price_usd > 0)

    if (priceData.length === 0) {
      throw new Error('Nenhum preço válido obtido')
    }

    console.log('💰 Atualizando preços no banco...')

    // Inserir/atualizar preços no banco
    const { error: upsertError } = await supabase
      .from('crypto_prices')
      .upsert(priceData, {
        onConflict: 'crypto_symbol',
        ignoreDuplicates: false
      })

    if (upsertError) {
      throw new Error(`Erro ao atualizar preços: ${upsertError.message}`)
    }

    console.log('✅ Preços atualizados com sucesso')

    // Atualizar o ranking com logging
    console.log('🔄 Atualizando ranking...')
    const { data: rankingResult, error: refreshError } = await supabase
      .rpc('refresh_portfolio_rankings_v2_with_log')

    if (refreshError) {
      console.warn('⚠️ Aviso: Não foi possível atualizar o ranking:', refreshError.message)
    } else {
      console.log('✅ Ranking atualizado:', rankingResult)
    }

    // Verificar última atualização
    const { data: lastUpdate } = await supabase
      .from('ranking_update_log')
      .select('last_update, records_updated, execution_time_ms')
      .order('last_update', { ascending: false })
      .limit(1)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Atualização concluída - ${priceData.length} preços atualizados`,
        prices: priceData,
        ranking: rankingResult,
        last_update: lastUpdate?.[0] || null,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Erro na função:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
