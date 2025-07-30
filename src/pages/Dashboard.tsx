// Dashboard Principal - Layout estilo Netflix
import { motion } from 'framer-motion';
import { Bitcoin, Globe, Timer, Eye, Wallet, FileText, LogOut, User, Play, Info, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ModuleCard } from '@/components/ModuleCard';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// URLs das imagens enviadas pelo usuário
const bitcoinLogoUrl = '/lovable-uploads/210bfef1-70e7-47d1-852d-e3861dca17b2.png';
const origensUrl = '/lovable-uploads/4dfe53fa-27f3-4715-921d-e467cf2c5f75.png';
const ciclosUrl = '/lovable-uploads/4e9eee5a-5e64-42a8-bbc4-a937a029b016.png';
const oportunidadesUrl = '/lovable-uploads/5c736e41-daae-472c-87ed-70b134a91c9c.png';
const analiseUrl = '/lovable-uploads/2419164b-85e4-49b5-a8c6-02743a5196f7.png';
const lucroUrl = '/lovable-uploads/bc513e15-b1d6-46a7-9047-554b60f1f2d5.png';
const gestaoUrl = '/lovable-uploads/07a20695-9548-4c22-ab32-6933d3662a15.png';
interface Module {
  id: string;
  name: string;
  description: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
interface VideoLesson {
  id: string;
  title: string;
  description: string;
  module_id: string;
  estimated_minutes: number;
  thumbnail_path?: string;
  order_index: number;
  is_public: boolean;
  status: string;
}

// Ícones e imagens dos módulos
const moduleIcons = [Bitcoin, Globe, Timer, Eye, Wallet, FileText];
const moduleImages = [origensUrl, ciclosUrl, oportunidadesUrl, analiseUrl, lucroUrl, gestaoUrl];
const moduleColors = ['from-orange-500/20 to-orange-600/20', 'from-blue-500/20 to-blue-600/20', 'from-green-500/20 to-green-600/20', 'from-purple-500/20 to-purple-600/20', 'from-indigo-500/20 to-indigo-600/20', 'from-red-500/20 to-red-600/20'];
export default function Dashboard() {
  const {
    currentUser,
    userProgress,
    logout
  } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [videoLessons, setVideoLessons] = useState<VideoLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const completedCount = userProgress?.completedModules.length || 0;
  useEffect(() => {
    fetchModulesAndVideos();

    // Listener para atualizações em tempo real
    const moduleSubscription = supabase.channel('modules_changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'modules'
    }, () => {
      fetchModulesAndVideos();
    }).subscribe();
    const videosSubscription = supabase.channel('videos_changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'video_lessons'
    }, () => {
      fetchModulesAndVideos();
    }).subscribe();
    return () => {
      moduleSubscription.unsubscribe();
      videosSubscription.unsubscribe();
    };
  }, []);
  const fetchModulesAndVideos = async () => {
    try {
      // Buscar módulos ativos
      const {
        data: modulesData,
        error: modulesError
      } = await supabase.from('modules').select('*').eq('is_active', true).order('order_index');
      if (modulesError) throw modulesError;

      // Buscar vídeos públicos
      const {
        data: videosData,
        error: videosError
      } = await supabase.from('video_lessons').select('*').eq('is_public', true).eq('status', 'publicado').order('order_index');
      if (videosError) throw videosError;
      setModules(modulesData || []);
      setVideoLessons(videosData || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Transformar módulos em formato compatível com o layout
  const displayModules = modules.map((module, index) => ({
    id: module.id,
    title: module.name,
    description: module.description,
    icon: moduleIcons[index % moduleIcons.length],
    image: moduleImages[index % moduleImages.length],
    color: moduleColors[index % moduleColors.length],
    estimatedTime: `${Math.round(videoLessons.filter(v => v.module_id === module.id).reduce((total, video) => total + (video.estimated_minutes || 0), 0))} min`
  }));
  const featuredModule = displayModules[0] || {
    id: 'default',
    title: 'Bem-vindo!',
    description: 'Comece sua jornada de aprendizado com nossos módulos exclusivos.',
    icon: Bitcoin,
    image: origensUrl,
    // Usando a primeira imagem como hero
    color: 'from-orange-500/20 to-orange-600/20',
    estimatedTime: '0 min'
  };
  const handleLogout = async () => {
    await logout();
  };
  
  const handleWatchNow = () => {
    if (displayModules.length > 0) {
      navigate(`/modulo/${displayModules[0].id}`);
    }
  };

  const handleModuleClick = (moduleId: string) => {
    navigate(`/modulo/${moduleId}`);
  };
  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>;
  }
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
              <Button onClick={handleWatchNow} className="bg-white text-black hover:bg-gray-200 px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-semibold">
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Assistir Agora
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="bg-gray-600/70 text-white hover:bg-gray-600 px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg">
                    <Info className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Mais
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white text-xl mb-2">Sobre o Curso</DialogTitle>
                    <DialogDescription className="text-gray-300 space-y-3">
                      <p>
                        Este curso foi cuidadosamente desenvolvido e gravado por <span className="text-white font-semibold">Marcos Lima</span>, 
                        entusiasta em criptomoedas e investimentos digitais.
                      </p>
                      <p>
                        Com uma abordagem prática e didática, você aprenderá tudo sobre Bitcoin, desde os conceitos básicos 
                        até estratégias avançadas de investimento e gestão de portfólio.
                      </p>
                      <p>
                        Acesse conteúdo exclusivo, técnicas profissionais e insights valiosos para maximizar seus resultados 
                        no mercado de criptomoedas.
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
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
            {displayModules.slice(0, 4).map((module, index) => <motion.div key={module.id} initial={{
            opacity: 0,
            x: 50
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            delay: 0.6 + index * 0.1
          }} className="flex-shrink-0 w-64 sm:w-80">
                <div className="relative group cursor-pointer" onClick={() => handleModuleClick(module.id)}>
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
            {displayModules.map((module, index) => <motion.div key={module.id} initial={{
            opacity: 0,
            y: 50
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.8 + index * 0.1
          }} className="relative group cursor-pointer" onClick={() => handleModuleClick(module.id)}>
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
                {displayModules.length - completedCount}
              </div>
              <div className="text-gray-400 text-sm sm:text-base">Módulos Restantes</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600 mb-2">
                {displayModules.length > 0 ? Math.round(completedCount / displayModules.length * 100) : 0}%
              </div>
              <div className="text-gray-400 text-sm sm:text-base">Progresso Total</div>
            </div>
          </div>
        </motion.section>

      </div>
    </div>;
}