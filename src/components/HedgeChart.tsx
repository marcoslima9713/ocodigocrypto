import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HedgeData, HedgeRatio } from '@/services/hedgeService';

interface HedgeChartProps {
  data: HedgeData[];
  hedgeRatio: HedgeRatio;
}

export default function HedgeChart({ data, hedgeRatio }: HedgeChartProps) {
  // Filtrar dados válidos para o gráfico
  const validData = data.filter(d => !isNaN(d.btcReturn) && !isNaN(d.ethReturn));
  
  if (validData.length < 2) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Gráfico de Dispersão BTC vs ETH</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-zinc-400 text-center py-8">
            Dados insuficientes para gerar o gráfico
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular pontos para a linha de regressão
  const btcReturns = validData.map(d => d.btcReturn);
  const ethReturns = validData.map(d => d.ethReturn);
  
  const minBtc = Math.min(...btcReturns);
  const maxBtc = Math.max(...btcReturns);
  const range = maxBtc - minBtc;
  
  // Pontos da linha de regressão
  const regressionPoints = [
    { x: minBtc - range * 0.1, y: (minBtc - range * 0.1) * hedgeRatio.beta },
    { x: maxBtc + range * 0.1, y: (maxBtc + range * 0.1) * hedgeRatio.beta }
  ];

  // Configurações do gráfico
  const width = 600;
  const height = 400;
  const padding = 60;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  // Função para converter valores para coordenadas do gráfico
  const scaleX = (value: number) => {
    const min = Math.min(...btcReturns) - range * 0.1;
    const max = Math.max(...btcReturns) + range * 0.1;
    return padding + ((value - min) / (max - min)) * chartWidth;
  };

  const scaleY = (value: number) => {
    const min = Math.min(...ethReturns) - range * 0.1;
    const max = Math.max(...ethReturns) + range * 0.1;
    return height - padding - ((value - min) / (max - min)) * chartHeight;
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          📊 Gráfico de Dispersão BTC vs ETH
          <span className="text-sm text-zinc-400">
            β = {hedgeRatio.beta.toFixed(3)} | R² = {(hedgeRatio.rSquared * 100).toFixed(1)}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <svg width={width} height={height} className="mx-auto">
            {/* Fundo */}
            <rect width={width} height={height} fill="#18181b" />
            
            {/* Grade */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#3f3f46" strokeWidth="1" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width={width} height={height} fill="url(#grid)" />
            
            {/* Eixos */}
            <line 
              x1={padding} y1={padding} x2={padding} y2={height - padding} 
              stroke="#71717a" strokeWidth="2" 
            />
            <line 
              x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} 
              stroke="#71717a" strokeWidth="2" 
            />
            
            {/* Linha de regressão */}
            <line 
              x1={scaleX(regressionPoints[0].x)} 
              y1={scaleY(regressionPoints[0].y)} 
              x2={scaleX(regressionPoints[1].x)} 
              y2={scaleY(regressionPoints[1].y)} 
              stroke="#3b82f6" 
              strokeWidth="3" 
              opacity="0.8"
            />
            
            {/* Pontos de dados */}
            {validData.map((point, index) => (
              <circle
                key={index}
                cx={scaleX(point.btcReturn)}
                cy={scaleY(point.ethReturn)}
                r="4"
                fill="#10b981"
                opacity="0.7"
              />
            ))}
            
            {/* Labels dos eixos */}
            <text x={width / 2} y={height - 10} textAnchor="middle" fill="#a1a1aa" fontSize="14">
              Retorno BTC (%)
            </text>
            <text x={10} y={height / 2} textAnchor="middle" fill="#a1a1aa" fontSize="14" transform={`rotate(-90, 10, ${height / 2})`}>
              Retorno ETH (%)
            </text>
            
            {/* Título do gráfico */}
            <text x={width / 2} y={25} textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="bold">
              Correlação BTC/ETH - Hedge Ratio
            </text>
            
            {/* Legenda */}
            <g transform={`translate(${width - 150}, 50)`}>
              <rect x="0" y="0" width="140" height="80" fill="#27272a" stroke="#52525b" strokeWidth="1" rx="4" />
              <text x="10" y="20" fill="#ffffff" fontSize="12" fontWeight="bold">Legenda</text>
              <circle cx="15" cy="35" r="3" fill="#10b981" />
              <text x="25" y="40" fill="#a1a1aa" fontSize="11">Dados históricos</text>
              <line x1="10" y1="55" x2="25" y2="55" stroke="#3b82f6" strokeWidth="2" />
              <text x="30" y="60" fill="#a1a1aa" fontSize="11">Linha de regressão</text>
            </g>
          </svg>
        </div>
        
        {/* Estatísticas do gráfico */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-800 rounded-lg p-3">
            <div className="text-zinc-400 text-sm">Hedge Ratio (β)</div>
            <div className="text-white font-semibold text-lg">{hedgeRatio.beta.toFixed(3)}</div>
            <div className="text-xs text-zinc-500">
              Para cada $1.000 em BTC, shorte ${(hedgeRatio.beta * 1000).toFixed(0)} em ETH
            </div>
          </div>
          
          <div className="bg-zinc-800 rounded-lg p-3">
            <div className="text-zinc-400 text-sm">Correlação</div>
            <div className="text-white font-semibold text-lg">{(hedgeRatio.correlation * 100).toFixed(1)}%</div>
            <div className="text-xs text-zinc-500">
              {hedgeRatio.correlation > 0.7 ? 'Alta correlação' : 
               hedgeRatio.correlation > 0.4 ? 'Correlação moderada' : 'Baixa correlação'}
            </div>
          </div>
          
          <div className="bg-zinc-800 rounded-lg p-3">
            <div className="text-zinc-400 text-sm">R² (Confiabilidade)</div>
            <div className="text-white font-semibold text-lg">{(hedgeRatio.rSquared * 100).toFixed(1)}%</div>
            <div className="text-xs text-zinc-500">
              {hedgeRatio.rSquared > 0.5 ? 'Modelo confiável' : 'Modelo com baixa confiabilidade'}
            </div>
          </div>
        </div>
        
        {/* Nota explicativa */}
        <div className="mt-4 bg-blue-900/20 border border-blue-800 rounded-lg p-3">
          <div className="text-blue-300 text-sm font-semibold mb-2">📈 Interpretação do Gráfico:</div>
          <div className="text-zinc-300 text-xs space-y-1">
            <div>• <strong>Pontos verdes:</strong> Retornos históricos BTC vs ETH</div>
            <div>• <strong>Linha azul:</strong> Linha de regressão linear (y = βx)</div>
            <div>• <strong>β (beta):</strong> Inclinação da linha = hedge ratio</div>
            <div>• <strong>R²:</strong> Qualidade do ajuste da linha aos dados</div>
            <div>• <strong>Correlação:</strong> Força da relação entre BTC e ETH</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
