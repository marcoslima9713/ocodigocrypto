import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Copy, FileSpreadsheet } from 'lucide-react';
import { HedgeData, HedgeRatio } from '@/services/hedgeService';

interface HedgeTableProps {
  data: HedgeData[];
  hedgeRatio: HedgeRatio;
}

export default function HedgeTable({ data, hedgeRatio }: HedgeTableProps) {
  // Função para formatar números
  const formatNumber = (value: number, decimals: number = 2) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  // Função para formatar porcentagem
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${formatNumber(value, 2)}%`;
  };

  // Função para exportar dados como CSV
  const exportToCSV = () => {
    const headers = ['Data', 'Preço BTC', 'Preço ETH', 'Retorno % BTC', 'Retorno % ETH', 'Tamanho ETH (hedgeado)'];
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.date,
        row.btcPrice,
        row.ethPrice,
        formatNumber(row.btcReturn, 2),
        formatNumber(row.ethReturn, 2),
        formatNumber(row.btcReturn * hedgeRatio.beta, 2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'BTC_ETH_HEDGE.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para copiar dados para clipboard
  const copyToClipboard = async () => {
    const tableData = data.map(row => ({
      data: row.date,
      precoBtc: row.btcPrice,
      precoEth: row.ethPrice,
      retornoBtc: row.btcReturn,
      retornoEth: row.ethReturn,
      tamanhoEth: row.btcReturn * hedgeRatio.beta
    }));

    const text = JSON.stringify(tableData, null, 2);
    
    try {
      await navigator.clipboard.writeText(text);
      alert('Dados copiados para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar dados:', error);
      alert('Erro ao copiar dados. Tente novamente.');
    }
  };

  // Calcular estatísticas
  const validData = data.filter(d => !isNaN(d.btcReturn) && !isNaN(d.ethReturn));
  const avgBtcReturn = validData.length > 0 ? validData.reduce((sum, d) => sum + d.btcReturn, 0) / validData.length : 0;
  const avgEthReturn = validData.length > 0 ? validData.reduce((sum, d) => sum + d.ethReturn, 0) / validData.length : 0;
  const avgHedgeSize = avgBtcReturn * hedgeRatio.beta;

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-400" />
            Planilha BTC_ETH_HEDGE
            <span className="text-sm text-zinc-400">
              β = {hedgeRatio.beta.toFixed(3)}
            </span>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={exportToCSV} 
              size="sm" 
              variant="outline"
              className="text-green-400 border-green-400 hover:bg-green-400 hover:text-black"
            >
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
            <Button 
              onClick={copyToClipboard} 
              size="sm" 
              variant="outline"
              className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-black"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copiar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Estatísticas resumidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-800 rounded-lg p-3">
            <div className="text-zinc-400 text-sm">Retorno Médio BTC</div>
            <div className={`text-lg font-semibold ${avgBtcReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercentage(avgBtcReturn)}
            </div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3">
            <div className="text-zinc-400 text-sm">Retorno Médio ETH</div>
            <div className={`text-lg font-semibold ${avgEthReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercentage(avgEthReturn)}
            </div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3">
            <div className="text-zinc-400 text-sm">Tamanho ETH (hedgeado)</div>
            <div className={`text-lg font-semibold ${avgHedgeSize >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPercentage(avgHedgeSize)}
            </div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3">
            <div className="text-zinc-400 text-sm">Período</div>
            <div className="text-white font-semibold text-lg">
              {data.length} dias
            </div>
          </div>
        </div>

        {/* Tabela de dados */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-white bg-green-900">Data</TableHead>
                <TableHead className="text-white bg-green-900">Preço BTC</TableHead>
                <TableHead className="text-white bg-green-900">Preço ETH</TableHead>
                <TableHead className="text-white bg-green-900">Retorno % BTC</TableHead>
                <TableHead className="text-white bg-green-900">Retorno % ETH</TableHead>
                <TableHead className="text-white bg-green-900">Tamanho ETH (hedgeado)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 20).map((row, index) => (
                <TableRow key={index} className="border-zinc-800 hover:bg-zinc-800">
                  <TableCell className="text-white font-mono text-sm">
                    {new Date(row.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-white font-mono">
                    ${formatNumber(row.btcPrice, 0)}
                  </TableCell>
                  <TableCell className="text-white font-mono">
                    ${formatNumber(row.ethPrice, 0)}
                  </TableCell>
                  <TableCell className={`font-mono ${row.btcReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercentage(row.btcReturn)}
                  </TableCell>
                  <TableCell className={`font-mono ${row.ethReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercentage(row.ethReturn)}
                  </TableCell>
                  <TableCell className={`font-mono ${(row.btcReturn * hedgeRatio.beta) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercentage(row.btcReturn * hedgeRatio.beta)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Notas explicativas */}
        <div className="mt-6 space-y-4">
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <div className="text-green-300 text-sm font-semibold mb-2">📋 Colunas da Planilha:</div>
            <div className="text-zinc-300 text-xs space-y-1">
              <div>• <strong>Data:</strong> Data do registro (formato DD/MM/AAAA)</div>
              <div>• <strong>Preço BTC:</strong> Preço de fechamento do Bitcoin em USD</div>
              <div>• <strong>Preço ETH:</strong> Preço de fechamento do Ethereum em USD</div>
              <div>• <strong>Retorno % BTC:</strong> Variação percentual diária do Bitcoin</div>
              <div>• <strong>Retorno % ETH:</strong> Variação percentual diária do Ethereum</div>
              <div>• <strong>Tamanho ETH (hedgeado):</strong> Posição ETH calculada = Retorno BTC × β</div>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <div className="text-blue-300 text-sm font-semibold mb-2">🎯 Fórmula do Hedge Ratio:</div>
            <div className="text-zinc-300 text-xs space-y-1">
              <div>• <strong>Regressão Linear:</strong> Y (ETH) = β × X (BTC) + ε</div>
              <div>• <strong>Hedge Ratio (β):</strong> {hedgeRatio.beta.toFixed(3)}</div>
              <div>• <strong>Interpretação:</strong> Para cada $1.000 em BTC, shorte ${(hedgeRatio.beta * 1000).toFixed(0)} em ETH</div>
              <div>• <strong>Objetivo:</strong> Neutralizar a exposição direcional do portfólio</div>
            </div>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
            <div className="text-yellow-300 text-sm font-semibold mb-2">⚠️ Notas Importantes:</div>
            <div className="text-zinc-300 text-xs space-y-1">
              <div>• Este hedge ratio busca neutralizar a exposição direcional</div>
              <div>• A cada rebalanceamento, use o valor de β para dimensionar a posição no ETH em relação ao BTC</div>
              <div>• O hedge ratio deve ser recalculado periodicamente (semanal/mensal)</div>
              <div>• Considere custos de transação e slippage ao executar as posições</div>
              <div>• Este é um modelo simplificado - sempre faça sua própria análise de risco</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
