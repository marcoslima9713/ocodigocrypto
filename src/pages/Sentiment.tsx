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
import { ArrowLeft, Gauge, Bitcoin } from "lucide-react";
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
  const [range, setRange] = useState<"30" | "365" | "all">("30");

  // Fetch Fear & Greed + BTC price/volume
  const fetchAll = async (days: string) => {
    setErr(null);
    setLoading(true);
    try {
      // Fear & Greed (via Supabase Function se existir; fallback API pública)
      let items: FearGreedItem[] | null = null;
      try {
        const { data, error } = await supabase.functions.invoke("feargreed", {
          body: { limit: days === "30" ? 30 : days === "365" ? 365 : 730 },
        });
        if (!error) items = (data?.data as FearGreedItem[]) ?? null;
      } catch {}
      if (!items) {
        const lim = days === "30" ? 30 : days === "365" ? 365 : 730;
        const r = await fetch(`https://api.alternative.me/fng/?limit=${lim}&format=json`);
        if (!r.ok) throw new Error(`upstream F&G ${r.status}`);
        const json = await r.json();
        items = (json?.data as FearGreedItem[]) ?? [];
      }

      // BTC Market Chart (CoinGecko)
      const coingeckoDays = days === "all" ? "max" : days;
      const rb = await fetch(
        `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${coingeckoDays}`
      );
      if (!rb.ok) throw new Error(`upstream BTC ${rb.status}`);
      const market = (await rb.json()) as MarketChart;

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
            <Button variant={range === "all" ? "default" : "outline"} onClick={() => setRange("all")}>Todos</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-emerald-400" /> Índice de Medo e Ganância de Criptomoedas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-zinc-400">Carregando…</div>
                ) : err ? (
                  <div className="text-red-400">{err}</div>
                ) : latest ? (
                  <div className="space-y-6">
                    {/* Gauge */}
                    <div className="flex items-center justify-center">
                      <div className="relative w-40 h-40">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <circle cx="50" cy="50" r="45" fill="#0b0f14" stroke="#1f2937" strokeWidth="2" />
                          {/* arco preenchido */}
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="8"
                            strokeDasharray={`${(Number(latest.value) / 100) * 251.2} 251.2`}
                            transform="rotate(-90 50 50)"
                          />
                          <text x="50" y="50" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">
                            {Number(latest.value)}
                          </text>
                        </svg>
                      </div>
                    </div>
                    <div className={`text-center font-semibold ${classificationColor(Number(latest.value))}`}>
                      {valueToLabel(Number(latest.value))}
                    </div>

                    {/* Valores históricos */}
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Ontem</span>
                        <span className="text-white">
                          {yesterday ? `${yesterday.value_classification} – ${yesterday.value}` : "–"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Semana passada</span>
                        <span className="text-white">{week ? `${week.value_classification} – ${week.value}` : "–"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Mês passado</span>
                        <span className="text-white">{month ? `${month.value_classification} – ${month.value}` : "–"}</span>
                      </div>
                    </div>

                    {/* Máx/Mín anuais – placeholders (depende de série completa) */}
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Máxima anual</span>
                        <span className="text-white">–</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Baixa anual</span>
                        <span className="text-white">–</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-zinc-400">Sem dados</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita */}
          <div className="lg:col-span-2">
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
                  <div className="text-red-400">{err}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={360}>
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
    </div>
  );
}


