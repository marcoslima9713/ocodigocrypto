// Dashboard Principal - Layout estilo Netflix
import { motion } from 'framer-motion';
import { Bitcoin, Globe, Timer, Eye, Wallet, FileText, LogOut, User, Play, Info, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ModuleCard } from '@/components/ModuleCard';
import { useNavigate } from 'react-router-dom';

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
  image: 'https://i.imgur.com/wwWXpSw.png',
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
  image: 'https://i.imgur.com/gao1f1l.png',
  color: 'from-red-500/20 to-red-600/20',
  estimatedTime: '70 min'
}];
export default function Dashboard() {
  const {
    currentUser,
    userProgress,
    logout
  } = useAuth();
  const navigate = useNavigate();
  const completedCount = userProgress?.completedModules.length || 0;
  const featuredModule = modules[0]; // Módulo em destaque

  const handleLogout = async () => {
    await logout();
  };

  const handleWatchNow = () => {
    navigate('/modulo/origens-bitcoin');
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
    }} className="relative min-h-[80vh] sm:h-screen flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src={featuredModule.image} alt={featuredModule.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-4 sm:px-8 lg:px-16 max-w-2xl mt-16 sm:mt-0">
          <motion.div initial={{
          opacity: 0,
          y: 50
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.3
        }}>
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
              {featuredModule.title}
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              {featuredModule.description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button 
                onClick={handleWatchNow}
                className="bg-white text-black hover:bg-gray-200 px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-semibold"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Assistir Agora
              </Button>
              <Button variant="secondary" className="bg-gray-600/70 text-white hover:bg-gray-600 px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Mais
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
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-2xl font-bold text-white">Continuar Assistindo</h2>
            <Button variant="ghost" className="text-gray-400 hover:text-white text-sm sm:text-base hidden sm:flex">
              Ver Todos <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {modules.slice(0, 4).map((module, index) => <motion.div key={module.id} initial={{
            opacity: 0,
            x: 50
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            delay: 0.6 + index * 0.1
          }} className="flex-shrink-0 w-64 sm:w-80">
                <div className="relative group cursor-pointer">
                  <img src={module.image} alt={module.title} className="w-full h-36 sm:h-44 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 rounded-lg flex items-center justify-center">
                    <Play className="w-8 h-8 sm:w-12 sm:h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  {/* Progress Bar */}
                  {userProgress?.completedModules.includes(module.id) && <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-b-lg" />}
                </div>
                
                <div className="mt-2">
                  <h3 className="text-white font-semibold text-sm sm:text-base line-clamp-2">{module.title}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">{module.estimatedTime}</p>
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
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-2xl font-bold text-white">Módulos Exclusivos</h2>
            <Button variant="ghost" className="text-gray-400 hover:text-white text-sm sm:text-base hidden sm:flex">
              Ver Todos <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {modules.map((module, index) => <motion.div key={module.id} initial={{
            opacity: 0,
            y: 50
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.8 + index * 0.1
          }} className="relative group cursor-pointer">
                <img src={module.image} alt={module.title} className="w-full h-24 sm:h-32 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 rounded-lg flex items-center justify-center">
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Completion Badge */}
                {userProgress?.completedModules.includes(module.id) && <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>}
                
                <h3 className="text-white text-xs sm:text-sm font-medium mt-2 group-hover:text-gray-300 line-clamp-2">
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
      }} className="bg-gray-900/50 rounded-lg p-4 sm:p-6 lg:p-8">
          <h2 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6">Seu Progresso</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600 mb-2">
                {completedCount}
              </div>
              <div className="text-gray-400 text-sm sm:text-base">Módulos Concluídos</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600 mb-2">
                {modules.length - completedCount}
              </div>
              <div className="text-gray-400 text-sm sm:text-base">Módulos Restantes</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600 mb-2">
                {Math.round(completedCount / modules.length * 100)}%
              </div>
              <div className="text-gray-400 text-sm sm:text-base">Progresso Total</div>
            </div>
          </div>
        </motion.section>

      </div>
    </div>;
}