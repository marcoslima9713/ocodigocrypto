import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Trophy, 
  TrendingUp, 
  DollarSign, 
  Target,
  Users,
  Calendar,
  Zap,
  Star,
  Award,
  TrendingDown
} from 'lucide-react';
import { PortfolioRanking } from '@/components/PortfolioRanking';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PortfolioRankingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<'7_days' | '30_days'>('7_days');

  // Estatísticas baseadas em dados reais (inicialmente zeradas)
  const stats = {
    totalUsers: 0,
    averageReturn: 0,
    topReturn: 0,
    activeUsers: 0,
    totalInvested: 0,
    averageDCA: 0
  };

  const handleBackToPortfolio = () => {
    navigate('/portfolio');
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToPortfolio}
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Portfólio
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Ranking de Performance
              </h1>
              <p className="text-zinc-400 text-sm">
                Descubra os melhores traders da comunidade
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              Atualizado diariamente
            </Badge>
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Total de Usuários</p>
                  <p className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Retorno Médio</p>
                  <p className="text-2xl font-bold text-zinc-400">{stats.averageReturn > 0 ? `+${stats.averageReturn}%` : '0%'}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-zinc-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Melhor Retorno</p>
                  <p className="text-2xl font-bold text-zinc-400">{stats.topReturn > 0 ? `+${stats.topReturn}%` : '0%'}</p>
                </div>
                <Star className="w-8 h-8 text-zinc-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Total Investido</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalInvested > 0 ? `$${(stats.totalInvested / 1000000).toFixed(1)}M` : '$0'}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-zinc-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Informações sobre Elegibilidade */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Award className="w-5 h-5 text-yellow-500" />
                Critérios de Elegibilidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Conta Ativa</p>
                    <p className="text-zinc-400 text-sm">Mínimo 7 dias</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Investimento Mínimo</p>
                    <p className="text-zinc-400 text-sm">$100 ou equivalente</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Perfil Público</p>
                    <p className="text-zinc-400 text-sm">Configuração ativada</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Componente Principal de Ranking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <PortfolioRanking />
        </motion.div>

        {/* Informações Adicionais */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6"
        >
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Zap className="w-5 h-5 text-blue-500" />
                Como Funciona o Ranking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    Retorno Percentual
                  </h4>
                  <p className="text-zinc-400 text-sm">
                    Calculado com base no valor total investido vs. valor atual do portfólio, 
                    considerando todas as criptomoedas.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    Melhor Ativo
                  </h4>
                  <p className="text-zinc-400 text-sm">
                    Identifica a criptomoeda individual com maior valorização percentual 
                    no portfólio de cada usuário.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-purple-500" />
                    Estratégia DCA
                  </h4>
                  <p className="text-zinc-400 text-sm">
                    Avalia a consistência e eficiência do Dollar-Cost Averaging, 
                    considerando número de compras e preço médio.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-zinc-500 text-sm">
            Os rankings são atualizados automaticamente todos os dias às 00:00 UTC. 
            Dados baseados em transações reais dos usuários.
          </p>
        </motion.div>
      </div>
    </div>
  );
} 