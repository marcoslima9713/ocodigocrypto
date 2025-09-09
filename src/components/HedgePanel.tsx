import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calculator, Shield, AlertTriangle, RefreshCw, Target, Zap } from 'lucide-react';
import { HedgeRatio, HedgePosition } from '@/services/hedgeService';

interface HedgePanelProps {
  hedgeRatio: HedgeRatio;
  onCalculatePosition: (btcPosition: number) => HedgePosition;
}

export default function HedgePanel({ hedgeRatio, onCalculatePosition }: HedgePanelProps) {
  const [btcPosition, setBtcPosition] = useState<number>(10000);
  const [calculatedPosition, setCalculatedPosition] = useState<HedgePosition | null>(null);

  const handleCalculate = () => {
    const position = onCalculatePosition(btcPosition);
    setCalculatedPosition(position);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getConfidenceColor = (rSquared: number) => {
    if (rSquared > 0.7) return 'bg-green-600';
    if (rSquared > 0.5) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getConfidenceText = (rSquared: number) => {
    if (rSquared > 0.7) return 'Alta';
    if (rSquared > 0.5) return 'Média';
    return 'Baixa';
  };

  const getCorrelationColor = (correlation: number) => {
    if (correlation > 0.7) return 'text-green-400';
    if (correlation > 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Painel de Hedge Ratio Dinâmico
          <Badge variant="outline" className="ml-2">
            <RefreshCw className="w-3 h-3 mr-1" />
            Atualizado
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <div className="text-purple-300 text-sm font-semibold">Hedge Ratio (β)</div>
            </div>
            <div className="text-white font-bold text-2xl">{hedgeRatio.beta.toFixed(3)}</div>
            <div className="text-purple-200 text-xs mt-1">
              Para cada $1.000 em BTC, shorte ${(hedgeRatio.beta * 1000).toFixed(0)} em ETH
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <div className="text-blue-300 text-sm font-semibold">Confiabilidade (R²)</div>
            </div>
            <div className="text-white font-bold text-2xl">{(hedgeRatio.rSquared * 100).toFixed(1)}%</div>
            <Badge className={`${getConfidenceColor(hedgeRatio.rSquared)} text-white mt-1`}>
              {getConfidenceText(hedgeRatio.rSquared)}
            </Badge>
          </div>

          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-green-400" />
              <div className="text-green-300 text-sm font-semibold">Correlação</div>
            </div>
            <div className={`font-bold text-2xl ${getCorrelationColor(hedgeRatio.correlation)}`}>
              {(hedgeRatio.correlation * 100).toFixed(1)}%
            </div>
            <div className="text-green-200 text-xs mt-1">
              {hedgeRatio.correlation > 0.7 ? 'Alta correlação' : 
               hedgeRatio.correlation > 0.4 ? 'Correlação moderada' : 'Baixa correlação'}
            </div>
          </div>
        </div>

        {/* Calculadora de posição */}
        <div className="bg-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-orange-400" />
            <div className="text-white font-semibold">Calculadora de Posição</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label className="text-zinc-300 text-sm">Posição BTC (USD)</Label>
              <Input
                type="number"
                value={btcPosition}
                onChange={(e) => setBtcPosition(Number(e.target.value))}
                className="bg-zinc-700 border-zinc-600 text-white mt-1"
                placeholder="10000"
              />
            </div>
            
            <div>
              <Button 
                onClick={handleCalculate}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calcular Hedge
              </Button>
            </div>
            
            <div className="text-right">
              <div className="text-zinc-400 text-sm">Última atualização</div>
              <div className="text-white text-sm">
                {new Date(hedgeRatio.lastUpdate).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>

          {/* Resultado do cálculo */}
          {calculatedPosition && (
            <div className="mt-4 bg-orange-900/20 border border-orange-800 rounded-lg p-4">
              <div className="text-orange-300 text-sm font-semibold mb-3">📊 Resultado do Cálculo:</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-zinc-400 text-sm">Posição BTC</div>
                  <div className="text-white font-semibold">{formatCurrency(calculatedPosition.btcPosition)}</div>
                </div>
                <div>
                  <div className="text-zinc-400 text-sm">Posição ETH (hedgeada)</div>
                  <div className="text-white font-semibold">{formatCurrency(calculatedPosition.ethPosition)}</div>
                </div>
                <div>
                  <div className="text-zinc-400 text-sm">Valor Total</div>
                  <div className="text-white font-semibold">{formatCurrency(calculatedPosition.totalValue)}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-orange-200">
                💡 Para neutralizar a exposição direcional, mantenha a proporção BTC:ETH = 1:{calculatedPosition.hedgeRatio.toFixed(3)}
              </div>
            </div>
          )}
        </div>

        {/* Alertas e recomendações */}
        <div className="space-y-3">
          {hedgeRatio.rSquared < 0.5 && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <div className="text-red-300 text-sm font-semibold">Baixa Confiabilidade</div>
              </div>
              <div className="text-red-200 text-xs mt-1">
                O modelo tem baixa confiabilidade (R² = {(hedgeRatio.rSquared * 100).toFixed(1)}%). 
                Considere usar um período mais longo ou verificar a qualidade dos dados.
              </div>
            </div>
          )}

          {hedgeRatio.correlation < 0.4 && (
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <div className="text-yellow-300 text-sm font-semibold">Baixa Correlação</div>
              </div>
              <div className="text-yellow-200 text-xs mt-1">
                A correlação entre BTC e ETH é baixa ({(hedgeRatio.correlation * 100).toFixed(1)}%). 
                O hedge pode não ser eficaz neste período.
              </div>
            </div>
          )}

          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
            <div className="text-blue-300 text-sm font-semibold mb-2">🎯 Estratégia de Hedge:</div>
            <div className="text-blue-200 text-xs space-y-1">
              <div>• <strong>Posição Long:</strong> Mantenha sua posição em BTC</div>
              <div>• <strong>Posição Short:</strong> Abra posição short em ETH proporcional ao hedge ratio</div>
              <div>• <strong>Rebalanceamento:</strong> Ajuste as posições quando o hedge ratio mudar significativamente</div>
              <div>• <strong>Monitoramento:</strong> Acompanhe a eficácia do hedge diariamente</div>
            </div>
          </div>
        </div>

        {/* Informações técnicas */}
        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="text-zinc-300 text-xs space-y-1">
            <div><strong>Método:</strong> Regressão linear simples (Y = βX + ε)</div>
            <div><strong>Período:</strong> Últimos 30 dias de dados históricos</div>
            <div><strong>Frequência:</strong> Atualização automática a cada 5 minutos</div>
            <div><strong>Fonte:</strong> Dados simulados para demonstração</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
