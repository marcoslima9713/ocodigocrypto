import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { RefreshCw, Clock, CheckCircle, AlertCircle, Play, Pause } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { 
  forceUpdate, 
  startAutoUpdate, 
  stopAutoUpdate, 
  getUpdateStatus,
  clearPriceCache,
  getCacheStats
} from '@/services/cryptoPriceService'

interface UpdateLog {
  timestamp: Date
  coins: string[]
  status: 'success' | 'error'
  message: string
  duration?: number
}

const defaultCoins = ['bitcoin', 'ethereum', 'cardano', 'solana', 'polkadot']

const CoinGeckoManager: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [logs, setLogs] = useState<UpdateLog[]>([])
  const [cacheStats, setCacheStats] = useState({ size: 0, entries: [] as string[] })
  const [updateStatus, setUpdateStatus] = useState({
    isUpdating: false,
    lastUpdateTime: null as Date | null,
    isAutoUpdateActive: false
  })

  const { toast } = useToast()

  // Função para adicionar log
  const addLog = (log: UpdateLog) => {
    setLogs(prev => [log, ...prev.slice(0, 9)]) // Manter apenas os últimos 10 logs
  }

  // Função para atualizar estatísticas do cache
  const updateCacheStats = () => {
    const stats = getCacheStats()
    setCacheStats(stats)
  }

  // Função para atualizar status do sistema
  const updateSystemStatus = () => {
    const status = getUpdateStatus()
    setUpdateStatus(status)
  }

  // Função para forçar atualização manual
  const handleForceUpdate = async () => {
    setIsUpdating(true)
    const startTime = Date.now()

    try {
      addLog({
        timestamp: new Date(),
        coins: defaultCoins,
        status: 'success',
        message: 'Iniciando atualização manual...',
      })

      const data = await forceUpdate(defaultCoins)
      const duration = Date.now() - startTime

      addLog({
        timestamp: new Date(),
        coins: defaultCoins,
        status: 'success',
        message: `Atualização manual concluída. ${Object.keys(data).length} moedas atualizadas.`,
        duration,
      })

      toast({
        title: "Sucesso!",
        description: `Preços atualizados para ${Object.keys(data).length} moedas. Dashboard será atualizado automaticamente.`,
      })

    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

      addLog({
        timestamp: new Date(),
        coins: defaultCoins,
        status: 'error',
        message: `Erro na atualização: ${errorMessage}`,
        duration,
      })

      toast({
        title: "Erro!",
        description: `Falha na atualização: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
      updateCacheStats()
      updateSystemStatus()
    }
  }

  // Função para iniciar auto-update
  const handleStartAutoUpdate = () => {
    startAutoUpdate(defaultCoins)
    updateSystemStatus()
    toast({
      title: "Auto-update iniciado",
      description: "Os preços serão atualizados automaticamente a cada 2 minutos.",
    })
  }

  // Função para parar auto-update
  const handleStopAutoUpdate = () => {
    stopAutoUpdate()
    updateSystemStatus()
    toast({
      title: "Auto-update parado",
      description: "As atualizações automáticas foram interrompidas.",
    })
  }

  // Função para limpar cache
  const handleClearCache = () => {
    clearPriceCache()
    updateCacheStats()
    toast({
      title: "Cache limpo",
      description: "Todos os dados em cache foram removidos.",
    })
  }

  // Atualizar status periodicamente
  useEffect(() => {
    updateCacheStats()
    updateSystemStatus()

    const interval = setInterval(() => {
      updateSystemStatus()
    }, 5000) // Atualizar a cada 5 segundos

    return () => clearInterval(interval)
  }, [])

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Agora mesmo'
    if (diffInMinutes === 1) return '1 minuto atrás'
    if (diffInMinutes < 60) return `${diffInMinutes} minutos atrás`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours === 1) return '1 hora atrás'
    return `${diffInHours} horas atrás`
  }

  return (
    <div className="space-y-6">
      {/* Status do Sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Auto-update:</span>
                <Badge variant={updateStatus.isAutoUpdateActive ? "default" : "secondary"}>
                  {updateStatus.isAutoUpdateActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Atualizando:</span>
                <Badge variant={updateStatus.isUpdating ? "default" : "secondary"}>
                  {updateStatus.isUpdating ? "Sim" : "Não"}
                </Badge>
              </div>
              {updateStatus.lastUpdateTime && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Última atualização:</span>
                  <span className="text-sm">{formatTimeAgo(updateStatus.lastUpdateTime)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Cache de Preços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Entradas:</span>
                <span className="text-sm font-medium">{cacheStats.size}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Moedas em cache:</span>
                <span className="text-sm font-medium">{cacheStats.entries.length}</span>
              </div>
              <Button
                onClick={handleClearCache}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Limpar Cache
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Controles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                onClick={handleForceUpdate}
                disabled={isUpdating}
                className="w-full"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                {isUpdating ? 'Atualizando...' : 'Forçar Atualização'}
              </Button>
              
              {updateStatus.isAutoUpdateActive ? (
                <Button
                  onClick={handleStopAutoUpdate}
                  variant="outline"
                  className="w-full"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Parar Auto-update
                </Button>
              ) : (
                <Button
                  onClick={handleStartAutoUpdate}
                  variant="outline"
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Auto-update
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs de Atualização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Logs de Atualização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhum log de atualização disponível
              </p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    log.status === 'success' 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {log.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium">
                        {log.timestamp.toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    {log.duration && (
                      <span className="text-xs text-gray-500">
                        {log.duration}ms
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1">{log.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Moedas: {log.coins.join(', ')}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informações da API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Informações da API CoinGecko
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  <strong>Endpoint:</strong> https://api.coingecko.com/api/v3/simple/price
                </p>
                <p>
                  <strong>Intervalo de atualização:</strong> 2 minutos
                </p>
                <p>
                  <strong>Moedas padrão:</strong> {defaultCoins.join(', ')}
                </p>
                <p>
                  <strong>Moedas suportadas:</strong> Bitcoin, Ethereum, Cardano, Solana, Polkadot e outras
                </p>
                <p className="text-sm text-gray-600">
                  Os preços são atualizados automaticamente e sincronizados com o dashboard do usuário.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

export default CoinGeckoManager 