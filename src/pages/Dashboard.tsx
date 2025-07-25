// Dashboard Principal - Layout estilo Netflix
import { motion } from 'framer-motion';
import { Bitcoin, Globe, Timer, Eye, Wallet, FileText, LogOut, User, Play, Info, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ModuleCard } from '@/components/ModuleCard';

// PERSONALIZE: Altere os módulos conforme seu projeto
const modules = [{
  id: 'modulo-1',
  title: 'Origens do Bitcoin',
  description: 'A verdadeira história por trás da criação do Bitcoin, os players envolvidos e como isso moldou o mercado que conhecemos hoje. Informações que poucos sabem e que são fundamentais para entender os ciclos.',
  icon: Bitcoin,
  image: 'https://i.imgur.com/aNUqdaq.png',
  color: 'from-orange-500/20 to-orange-600/20',
  estimatedTime: '45 min'
}, {
  id: 'modulo-2',
  title: 'Ciclos Macroeconômicos',
  description: 'Como políticas monetárias globais, decisões do FED e eventos geopolíticos criam ondas no mercado crypto. Aprenda a surfar essas ondas em vez de ser engolido por elas.',
  icon: Globe,
  image: 'https://i.imgur.com/6P43lCR.png',
  color: 'from-blue-500/20 to-blue-600/20',
  estimatedTime: '60 min'
}, {
  id: 'modulo-3',
  title: 'Timing de Mercado',
  description: 'Os sinais que antecedem grandes movimentos do Bitcoin. Como identificar topos e fundos usando dados macroeconômicos. O timing que faz a diferença entre lucro e prejuízo.',
  icon: Timer,
  image: 'https://i.imgur.com/IFSgCCY.png',
  color: 'from-green-500/20 to-green-600/20',
  estimatedTime: '50 min'
}, {
  id: 'modulo-4',
  title: 'Análise de Fluxos',
  description: 'Como rastrear o dinheiro das instituições e whales. Onde eles colocam capital e como você pode acompanhar esses movimentos para se posicionar antes da massa.',
  icon: Eye,
  image: '/src/assets/analise-fluxos.jpg',
  color: 'from-purple-500/20 to-purple-600/20',
  estimatedTime: '55 min'
}, {
  id: 'modulo-5',
  title: 'Gestão de Capital',
  description: 'Como alocar capital de forma inteligente, quando aumentar posições e quando reduzir exposição. A diferença entre trading e investimento estratégico de longo prazo.',
  icon: Wallet,
  image: 'https://i.imgur.com/aNUqdaq.png',
  color: 'from-indigo-500/20 to-indigo-600/20',
  estimatedTime: '40 min'
}, {
  id: 'modulo-6',
  title: 'Casos Reais',
  description: 'Análise detalhada dos grandes movimentos do Bitcoin desde 2017. O que causou cada movimento e como você poderia ter identificado essas oportunidades usando macroeconomia.',
  icon: FileText,
  image: '/src/assets/casos-reais.jpg',
  color: 'from-red-500/20 to-red-600/20',
  estimatedTime: '70 min'
}];
export default function Dashboard() {
  const {
    currentUser,
    userProgress,
    logout
  } = useAuth();
  const completedCount = userProgress?.completedModules.length || 0;
  const featuredModule = modules[0]; // Módulo em destaque

  const handleLogout = async () => {
    await logout();
  };
  return <div className="min-h-screen bg-black">
      {/* Header Netflix Style */}
      <motion.header initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="px-4 sm:px-8 lg:px-16">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-red-600">Acesso Premium</h1>
              
              {/* Navigation Menu */}
              
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm hidden sm:block">
                {currentUser?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:text-gray-300">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} className="relative h-screen flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src={featuredModule.image} alt={featuredModule.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-4 sm:px-8 lg:px-16 max-w-2xl">
          <motion.div initial={{
          opacity: 0,
          y: 50
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.3
        }}>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
              {featuredModule.title}
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              {featuredModule.description}
            </p>
            
            <div className="flex space-x-4">
              <Button className="bg-white text-black hover:bg-gray-200 px-8 py-3 text-lg font-semibold">
                <Play className="w-5 h-5 mr-2" />
                Assistir Agora
              </Button>
              <Button variant="secondary" className="bg-gray-600/70 text-white hover:bg-gray-600 px-8 py-3 text-lg">
                <Info className="w-5 h-5 mr-2" />
                Mais Informações
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Content Sections */}
      <div className="px-4 sm:px-8 lg:px-16 pb-16 space-y-12">
        {/* Minha Lista */}
        <motion.section initial={{
        opacity: 0,
        y: 50
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.5
      }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Continuar Assistindo</h2>
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              Ver Todos <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {modules.slice(0, 4).map((module, index) => <motion.div key={module.id} initial={{
            opacity: 0,
            x: 50
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            delay: 0.6 + index * 0.1
          }} className="flex-shrink-0 w-80">
                <div className="relative group cursor-pointer">
                  <img src={module.image} alt={module.title} className="w-full h-44 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 rounded-lg flex items-center justify-center">
                    <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  {/* Progress Bar */}
                  {userProgress?.completedModules.includes(module.id) && <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-b-lg" />}
                </div>
                
                <div className="mt-2">
                  <h3 className="text-white font-semibold">{module.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{module.estimatedTime}</p>
                </div>
              </motion.div>)}
          </div>
        </motion.section>

        {/* Módulos Exclusivos */}
        <motion.section initial={{
        opacity: 0,
        y: 50
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.7
      }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Módulos Exclusivos</h2>
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              Ver Todos <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {modules.map((module, index) => <motion.div key={module.id} initial={{
            opacity: 0,
            y: 50
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.8 + index * 0.1
          }} className="relative group cursor-pointer">
                <img src={module.image} alt={module.title} className="w-full h-32 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 rounded-lg flex items-center justify-center">
                  <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Completion Badge */}
                {userProgress?.completedModules.includes(module.id) && <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>}
                
                <h3 className="text-white text-sm font-medium mt-2 group-hover:text-gray-300">
                  {module.title}
                </h3>
              </motion.div>)}
          </div>
        </motion.section>

        {/* Status do Progresso */}
        <motion.section initial={{
        opacity: 0,
        y: 50
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.9
      }} className="bg-gray-900/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Seu Progresso</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">
                {completedCount}
              </div>
              <div className="text-gray-400">Módulos Concluídos</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">
                {modules.length - completedCount}
              </div>
              <div className="text-gray-400">Módulos Restantes</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">
                {Math.round(completedCount / modules.length * 100)}%
              </div>
              <div className="text-gray-400">Progresso Total</div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>;
}