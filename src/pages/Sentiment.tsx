import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceArea,
  Area,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Gauge, Bitcoin, Newspaper, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

type FearGreedItem = { value: string; value_classification: string; timestamp: string };
type MarketChart = { prices: [number, number][]; total_volumes: [number, number][] };

const bg = "#0d1117";

export default function Sentiment() {
  const navigate = useNavigate();
  const [fgData, setFgData] = useState<FearGreedItem[]>([]);
  const [btcData, setBtcData] = useState<MarketChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [range, setRange] = useState<"30" | "365">("365");
  const [news, setNews] = useState<any[]>([]);

  // Fetch Fear & Greed + BTC price/volume
  const fetchAll = async (days: string) => {
    setErr(null);
    setLoading(true);
    try {
      // Fear & Greed (via Supabase Function se existir; fallback API pública)
      let items: FearGreedItem[] | null = null;
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        const { data, error } = await supabase.functions.invoke("feargreed", {
          body: { limit: days === "30" ? 30 : days === "365" ? 365 : 730 },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!error && data?.data) {
          items = (data.data as FearGreedItem[]) ?? null;
          console.log("Dados obtidos via Supabase Function:", items?.length);
        }
      } catch (supabaseError) {
        console.warn("Erro na Supabase Function, tentando API direta:", supabaseError);
      }
      
      if (!items) {
        try {
          const lim = days === "30" ? 30 : days === "365" ? 365 : 730;
          const r = await fetch(`https://api.alternative.me/fng/?limit=${lim}&format=json`);
          if (!r.ok) throw new Error(`API F&G retornou ${r.status}`);
          const json = await r.json();
          items = (json?.data as FearGreedItem[]) ?? [];
          console.log("Dados obtidos via API direta:", items?.length);
        } catch (apiError) {
          console.error("Erro na API direta:", apiError);
          throw new Error("Não foi possível carregar dados do índice de medo e ganância. Verifique sua conexão com a internet.");
        }
      }

      // BTC Market Chart (usando proxy do Vite para evitar CORS)
      let market: MarketChart | null = null;
      try {
        const coingeckoDays = days === "all" ? "max" : days;
        console.log("Carregando dados do Bitcoin com days:", coingeckoDays);
        
        const url = `/api/coingecko/coins/bitcoin/market_chart?vs_currency=usd&days=${coingeckoDays}`;
        console.log("Fazendo requisição para:", url);
        
        const rb = await fetch(url);
        console.log("Status da resposta:", rb.status, rb.statusText);
        
        if (!rb.ok) {
          const errorText = await rb.text();
          console.error("Erro na resposta:", errorText);
          throw new Error(`Erro ao carregar dados do Bitcoin: ${rb.status} ${rb.statusText}`);
        }
        
        market = (await rb.json()) as MarketChart;
        console.log("Dados do Bitcoin carregados com sucesso");
      } catch (btcError) {
        console.error("Erro ao carregar dados do Bitcoin:", btcError);
        // Continuar sem dados do Bitcoin se houver erro
        market = null;
      }

      setFgData(items || []);
      setBtcData(market);
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(range);
    const id = setInterval(() => fetchAll(range), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [range]);

  // Notícias (tenta Supabase Function; fallback em API pública do CoinGecko status_updates)
  useEffect(() => {
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        const { data, error } = await supabase.functions.invoke("cryptonews", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!error && data?.results) {
          setNews(
            (data.results as any[])
              .filter(Boolean)
              .slice(0, 10)
              .map((n) => ({
                title: n.title,
                link: n.link || n.url,
                pubDate: n.pubDate || n.published_at,
                source: n.source_id || n.source,
              }))
          );
          console.log("Notícias carregadas via Supabase Function:", data.results?.length);
          return;
        }
      } catch (supabaseError) {
        console.warn("Erro na Supabase Function de notícias:", supabaseError);
      }

      // Fallback: CoinGecko status updates (sem chave, CORS ok)
      try {
        const r = await fetch(
          "https://api.coingecko.com/api/v3/status_updates?category=general&per_page=20&page=1"
        );
        if (r.ok) {
          const j = await r.json();
          const items = (j?.status_updates || []).map((it: any) => ({
            title: `${it.project?.name || it.user_title || 'Atualização'}${it.category ? ' – ' + it.category : ''}`,
            link: it.article_url || it.project?.homepage || undefined,
            pubDate: it.created_at,
            source: it.project?.name || it.user,
          }));
          setNews(items.slice(0, 10));
          console.log("Notícias carregadas via API direta:", items.length);
        } else {
          console.warn("Erro na API de notícias:", r.status);
        }
      } catch (apiError) {
        console.warn("Erro ao carregar notícias:", apiError);
        // Manter array vazio se não conseguir carregar
      }
    })();
  }, []);

  const latest = fgData?.[0];
  const yesterday = fgData?.[1];
  const week = fgData?.[7];
  const month = fgData?.[29];

  // Monta série mesclando por data (usa timestamp do F&G)
  const merged = useMemo(() => {
    const f = (fgData || []).slice().reverse();
    const prices = btcData?.prices || [];
    const volumes = btcData?.total_volumes || [];
    // indexar BTC por dia (yyyy-mm-dd)
    const byDay = (arr: [number, number][]) =>
      arr.reduce<Record<string, number>>((acc, [ts, val]) => {
        const d = new Date(ts).toISOString().slice(0, 10);
        acc[d] = val;
        return acc;
      }, {});
    const pIdx = byDay(prices);
    const vIdx = byDay(volumes);
    return f.map((d) => {
      const day = new Date(Number(d.timestamp) * 1000).toISOString().slice(0, 10);
      return {
        date: new Date(day).toLocaleDateString(),
        index: Number(d.value),
        price: pIdx[day] ?? null,
        volume: vIdx[day] ?? null,
      };
    });
  }, [fgData, btcData]);

  const zones = [
    { y1: 0, y2: 25, color: "#7f1d1d33" },
    { y1: 25, y2: 50, color: "#854d0e33" },
    { y1: 50, y2: 75, color: "#14532d33" },
    { y1: 75, y2: 100, color: "#064e3b33" },
  ];

  const classificationColor = (val: number) =>
    val <= 25 ? "text-red-400" : val <= 50 ? "text-yellow-400" : val <= 75 ? "text-green-400" : "text-emerald-400";

  const valueToLabel = (val: number) =>
    val <= 25
      ? "Medo Extremo"
      : val <= 50
      ? "Medo/Neutro"
      : val <= 75
      ? "Ganância"
      : "Ganância Extrema";

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-zinc-300 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Dashboard
          </Button>
          <div className="flex gap-2">
            <Button variant={range === "30" ? "default" : "outline"} onClick={() => setRange("30")}>30 dias</Button>
            <Button variant={range === "365" ? "default" : "outline"} onClick={() => setRange("365")}>1 ano</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Card Índice de Medo e Ganância */}
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-[0_0_0_1px_rgba(39,39,42,0.6)]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-emerald-500/10 ring-1 ring-emerald-500/30">
                  <Gauge className="w-5 h-5 text-emerald-400" />
                </span>
                Índice de Medo e Ganância de Criptomoedas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-zinc-400">Carregando…</div>
              ) : err ? (
                <div className="text-red-400 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
                  <div className="font-medium mb-2">⚠️ Erro de Conexão</div>
                  <div className="text-sm">{err}</div>
                  <div className="text-xs mt-2 text-red-300">
                    Verifique sua conexão com a internet e tente novamente.
                  </div>
                </div>
                             ) : latest ? (
                 <div className="flex flex-col lg:flex-row items-center gap-8">
                   {/* Gauge Centralizado */}
                   <div className="flex flex-col items-center justify-center flex-1">
                     <div className="relative w-48 h-48 lg:w-56 lg:h-56 mb-4">
                       <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                         {/* Círculo de fundo */}
                         <circle cx="50" cy="50" r="45" fill="#0b0f14" stroke="#1f2937" strokeWidth="2" />
                         {/* Arco de progresso */}
                         <circle
                           cx="50"
                           cy="50"
                           r="40"
                           fill="none"
                           stroke="#10b981"
                           strokeWidth="10"
                           strokeLinecap="round"
                           strokeDasharray={`${(Number(latest.value) / 100) * 251.2} 251.2`}
                           transform="rotate(-90 50 50)"
                           className="drop-shadow-md"
                         />
                         {/* Número principal */}
                         <text 
                           x="50" 
                           y="50" 
                           dominantBaseline="middle" 
                           textAnchor="middle" 
                           fill="white" 
                           fontSize="32" 
                           fontWeight="bold"
                           className="drop-shadow-lg"
                         >
                           {Number(latest.value)}
                         </text>
                       </svg>
                     </div>
                     {/* Texto de classificação */}
                     <div className={`text-center text-xl font-bold ${classificationColor(Number(latest.value))} drop-shadow-sm`}>
                       {valueToLabel(Number(latest.value))}
                     </div>
                   </div>

                   {/* Valores comparativos em grid */}
                   <div className="flex-1 max-w-xs">
                     <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                       <h4 className="text-sm font-medium text-zinc-300 mb-3 uppercase tracking-wide">Histórico</h4>
                       <div className="space-y-3">
                         <div className="flex items-center justify-between py-2 border-b border-zinc-700/30 last:border-b-0">
                           <span className="text-sm text-zinc-400">Ontem</span>
                           <div className="text-right">
                             <div className="text-white font-medium">
                               {yesterday ? yesterday.value : "–"}
                             </div>
                             <div className="text-xs text-zinc-500">
                               {yesterday ? yesterday.value_classification : "–"}
                             </div>
                           </div>
                         </div>
                         <div className="flex items-center justify-between py-2 border-b border-zinc-700/30 last:border-b-0">
                           <span className="text-sm text-zinc-400">Semana passada</span>
                           <div className="text-right">
                             <div className="text-white font-medium">
                               {week ? week.value : "–"}
                             </div>
                             <div className="text-xs text-zinc-500">
                               {week ? week.value_classification : "–"}
                             </div>
                           </div>
                         </div>
                         <div className="flex items-center justify-between py-2 border-b border-zinc-700/30 last:border-b-0">
                           <span className="text-sm text-zinc-400">Mês passado</span>
                           <div className="text-right">
                             <div className="text-white font-medium">
                               {month ? month.value : "–"}
                             </div>
                             <div className="text-xs text-zinc-500">
                               {month ? month.value_classification : "–"}
                             </div>
                           </div>
                         </div>
                         <div className="flex items-center justify-between py-2">
                           <span className="text-sm text-zinc-400">Máxima anual</span>
                           <div className="text-right">
                             <div className="text-white font-medium">–</div>
                             <div className="text-xs text-zinc-500">–</div>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
              ) : (
                <div className="text-zinc-400">Sem dados</div>
              )}
            </CardContent>
          </Card>

          {/* Card Notícias */}
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800/80 shadow-[0_0_0_1px_rgba(39,39,42,0.6)]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-500/10 ring-1 ring-blue-500/30">
                  <Newspaper className="w-5 h-5 text-blue-400" />
                </span>
                Últimas notícias de cripto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {news.length === 0 ? (
                <div className="text-zinc-400 text-sm">Sem notícias no momento.</div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {news.map((n, i) => (
                    <a
                      key={i}
                      href={n.link || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="block p-3 rounded-md border border-zinc-800/80 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/70 transition group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-blue-500/10 ring-1 ring-blue-500/30">
                            <Newspaper className="w-4 h-4 text-blue-400" />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-zinc-400 flex items-center gap-2">
                            <span>{new Date(n.pubDate || Date.now()).toLocaleString('pt-BR')}</span>
                            {n.source ? <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">{n.source}</span> : null}
                          </div>
                          <div className="text-white font-medium text-sm mt-1 line-clamp-2">
                            {n.title}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráfico em linha separada */}
        <div className="mt-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bitcoin className="w-5 h-5 text-yellow-400" /> Gráfico do Índice de Medo e Ganância
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-zinc-400">Carregando…</div>
              ) : err ? (
                <div className="text-red-400 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
                  <div className="font-medium mb-2">⚠️ Erro de Conexão</div>
                  <div className="text-sm">{err}</div>
                  <div className="text-xs mt-2 text-red-300">
                    Verifique sua conexão com a internet e tente novamente.
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={merged} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                    {/* Faixas de zona no eixo do índice (direita) */}
                    {zones.map((z, i) => (
                      <ReferenceArea key={i} y1={z.y1} y2={z.y2} yAxisId="right" fill={z.color} ifOverflow="extendDomain" />
                    ))}
                    <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 12 }} minTickGap={24} />
                    <YAxis yAxisId="left" orientation="left" tick={{ fill: "#a1a1aa", fontSize: 12 }} width={60} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: "#a1a1aa", fontSize: 12 }} width={50} />
                    <Tooltip contentStyle={{ background: "#0b0f14", border: "1px solid #27272a" }} formatter={(v: any, n: any) => [n === "index" ? `${v}` : `$${Number(v).toLocaleString()}`, n]} />
                    <Legend wrapperStyle={{ color: "#e5e7eb" }} />
                    {/* Volume como área (usa eixo esquerdo, mas valores são bem maiores que preço; para simplificar, normalizamos) */}
                    <Area
                      type="monotone"
                      dataKey={(d: any) => (d.volume ? Math.log(d.volume) : null)}
                      name="Volume BTC (log)"
                      yAxisId="left"
                      stroke="#60a5fa"
                      fill="#60a5fa33"
                      dot={false}
                    />
                    {/* Preço BTC */}
                    <Line type="monotone" dataKey="price" name="Preço BTC (USD)" yAxisId="left" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    {/* Índice F&G */}
                    <Line type="monotone" dataKey="index" name="Índice F&G" yAxisId="right" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


