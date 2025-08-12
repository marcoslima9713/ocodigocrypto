import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";

type FearGreedItem = { value: string; value_classification: string; timestamp: string };

export default function Sentiment() {
  const [data, setData] = useState<FearGreedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        // Tenta via Supabase Function (produção)
        let items: FearGreedItem[] | null = null;
        try {
          const { data, error } = await supabase.functions.invoke("feargreed");
          if (!error) {
            items = (data?.data as FearGreedItem[]) ?? null;
          }
        } catch (_) {
          // ignora, tenta fallback
        }

        // Fallback direto na API pública (para dev local)
        if (!items) {
          const r = await fetch("https://api.alternative.me/fng/?limit=30&format=json");
          if (!r.ok) throw new Error(`upstream ${r.status}`);
          const json = await r.json();
          items = (json?.data as FearGreedItem[]) ?? [];
        }

        setData(items || []);
      } catch (e: any) {
        setErr(e?.message ?? "Erro ao carregar índice");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const latest = data?.[0];
  const chartData = useMemo(
    () =>
      (data || [])
        .slice()
        .reverse()
        .map((d) => ({ x: new Date(Number(d.timestamp) * 1000).toLocaleDateString(), value: Number(d.value) })),
    [data]
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Índice de Medo e Ganância (Cripto)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Carregando…</div>
          ) : err ? (
            <div className="text-red-400">{err}</div>
          ) : latest ? (
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-zinc-400">Valor Atual</div>
                <div className="text-4xl font-bold">{latest.value}</div>
                <div className="text-zinc-300">{latest.value_classification}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-zinc-400 mb-2">Histórico (últimos 30)</div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="x" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a" }} />
                    <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div>Nenhum dado disponível.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


