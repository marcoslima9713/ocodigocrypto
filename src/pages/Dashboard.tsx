// Dashboard Principal - Painel com 5 módulos premium
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Target, 
  Cog, 
  TestTube, 
  TrendingUp, 
  LogOut, 
  User,
  Award,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ModuleCard } from '@/components/ModuleCard';
import { ProgressStats } from '@/components/ProgressStats';

// PERSONALIZE: Altere os módulos conforme seu projeto
const modules = [
  {
    id: 'modulo-1',
    title: 'Introdução',
    description: 'Fundamentos do mercado financeiro e conceitos básicos para iniciantes',
    icon: BookOpen,
    color: 'from-blue-500/20 to-blue-600/20',
    estimatedTime: '30 min'
  },
  {
    id: 'modulo-2', 
    title: 'Estratégias',
    description: 'Estratégias avançadas de investimento e análise de mercado',
    icon: Target,
    color: 'from-green-500/20 to-green-600/20',
    estimatedTime: '45 min'
  },
  {
    id: 'modulo-3',
    title: 'Implementação',
    description: 'Como colocar as estratégias em prática no mercado real',
    icon: Cog,
    color: 'from-purple-500/20 to-purple-600/20',
    estimatedTime: '60 min'
  },
  {
    id: 'modulo-4',
    title: 'Testes',
    description: 'Backtesting e validação das suas estratégias de investimento',
    icon: TestTube,
    color: 'from-orange-500/20 to-orange-600/20',
    estimatedTime: '40 min'
  },
  {
    id: 'modulo-5',
    title: 'Escala',
    description: 'Como escalar seus investimentos e maximizar os retornos',
    icon: TrendingUp,
    color: 'from-red-500/20 to-red-600/20',
    estimatedTime: '50 min'
  }
];

export default function Dashboard() {
  const { currentUser, userProgress, logout } = useAuth();

  const completedCount = userProgress?.completedModules.length || 0;
  const progressPercentage = (completedCount / modules.length) * 100;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen">
      {/* Header com gradient e backdrop blur */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/90 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Título */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gradient-gold">
                {/* PERSONALIZE: Altere o nome da sua plataforma */}
                Academia Premium
              </h1>
            </div>

            {/* Menu do usuário */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {currentUser?.email}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Conteúdo principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Seção de boas-vindas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="card-premium text-center">
            <h2 className="text-3xl font-bold text-gradient-gold mb-2">
              {/* PERSONALIZE: Altere a mensagem de boas-vindas */}
              Bem-vindo à Elite dos Investidores
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              {/* PERSONALIZE: Altere a descrição da plataforma */}
              Descubra os segredos que apenas 1% dos investidores conhecem
            </p>
            
            {/* Estatísticas de progresso */}
            <ProgressStats 
              totalModules={modules.length}
              completedModules={completedCount}
              progressPercentage={progressPercentage}
            />
          </div>
        </motion.div>

        {/* Grid de módulos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center mb-6">
            <Award className="w-6 h-6 text-primary mr-2" />
            <h3 className="text-2xl font-bold">Módulos Exclusivos</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <ModuleCard
                  module={module}
                  isCompleted={userProgress?.completedModules.includes(module.id) || false}
                  onComplete={() => {
                    // Implementação será feita no componente
                  }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Seção de suporte/contato */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="card-premium text-center bg-gradient-to-r from-primary/10 to-accent/10"
        >
          <h3 className="text-xl font-bold mb-2">Precisa de Ajuda?</h3>
          <p className="text-muted-foreground mb-4">
            {/* PERSONALIZE: Altere as informações de contato */}
            Nossa equipe de especialistas está aqui para ajudá-lo a maximizar seus resultados.
          </p>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            Entrar em Contato
          </Button>
        </motion.div>
      </main>
    </div>
  );
}