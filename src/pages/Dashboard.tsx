// Dashboard Principal - Layout estilo Netflix
import { motion } from 'framer-motion';
import { Bitcoin, Globe, Timer, Eye, Wallet, FileText, LogOut, User, Play, Info, ChevronRight, Calculator, Gauge, TrendingUp, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ModuleCard } from '@/components/ModuleCard';
import { LogoutButton } from '@/components/LogoutButton';

import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// URLs das imagens enviadas pelo usuário
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
  const { currentUser } = useUserAuth();
  const { userProgress, logout, markModuleComplete } = useAuth();
  
  // Email do administrador autorizado
  const ADMIN_EMAIL = 'marcoslima9713@gmail.com';
  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [videoLessons, setVideoLessons] = useState<VideoLesson[]>([]);
  const [moduleCovers, setModuleCovers] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const completedCount = userProgress?.completedModules.length || 0;
  
  const fetchModulesAndVideos = useCallback(async () => {
    if (!currentUser) return;
    
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

      // Buscar capas dos módulos
      try {
        const {
          data: coversData,
          error: coversError
        } = await supabase.from('module_covers').select('*');
        
        if (!coversError && coversData) {
          const coversMap: {[key: string]: string} = {};
          coversData.forEach(cover => {
            coversMap[cover.slug] = cover.cover_url;
          });
          setModuleCovers(coversMap);
        }
      } catch (error) {
        console.log('Tabela module_covers não existe ainda ou erro ao buscar capas');
      }

      setModules(modulesData || []);
      setVideoLessons(videosData || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    
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
  }, [currentUser, fetchModulesAndVideos]);

  // Transformar módulos em formato compatível com o layout
  const displayModules = modules.map((module, index) => ({
    id: module.id,
    title: module.name,
    description: module.description,
    icon: moduleIcons[index % moduleIcons.length],
    image: moduleCovers[module.id] || moduleImages[index % moduleImages.length], // Usar capa personalizada se disponível
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
    try {
      await logout();
    } catch (error) {
      console.error('Erro no logout:', error);
      // Mesmo com erro, forçar redirecionamento
      window.location.href = '/login';
    }
  };
  
  const handleWatchNow = () => {
    if (displayModules.length > 0) {
      navigate(`/modulo/${displayModules[0].id}`);
    }
  };

  const handleModuleClick = (moduleId: string) => {
    navigate(`/modulo/${moduleId}`);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % displayModules.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + displayModules.length) % displayModules.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-play do carrossel (posicionado após a definição de displayModules)
  useEffect(() => {
    if (displayModules.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % displayModules.length);
    }, 5000); // Muda a cada 5 segundos

    return () => clearInterval(interval);
  }, [displayModules.length]);
  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>;
  }
  return <div className="min-h-screen bg-black">
      {/* Header */}
      <motion.header initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="px-4 sm:px-8 lg:px-16 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-white">Academia Premium</h1>
                <p className="text-xs sm:text-sm text-gray-400">Área de Membros</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-sm font-bold text-white">Academia Premium</h1>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-white text-xs sm:text-sm hidden sm:block">
                {currentUser?.email}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/portfolio')} 
                className="text-white hover:text-gray-300 text-xs sm:text-sm px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Portfólio</span>
                <span className="sm:hidden">📊</span>
              </Button>
              <LogoutButton 
                variant="ghost" 
                size="sm" 
                className="text-white hover:text-gray-300"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              </LogoutButton>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section - Carrossel Netflix */}
      <motion.section initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} className="relative min-h-[70vh] sm:min-h-[80vh] lg:h-screen flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <motion.img 
            key={currentSlide}
            src={displayModules[currentSlide]?.image || featuredModule.image} 
            alt={displayModules[currentSlide]?.title || featuredModule.title} 
            className="w-full h-full object-cover"
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-4 sm:px-8 lg:px-16 max-w-2xl mt-16 sm:mt-0">
          <motion.div 
            key={currentSlide}
            initial={{
              opacity: 0,
              y: 50
            }} 
            animate={{
              opacity: 1,
              y: 0
            }} 
            transition={{
              delay: 0.2,
              duration: 0.6
            }}
          >
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-3 sm:mb-4 leading-tight">
              {displayModules[currentSlide]?.title || featuredModule.title}
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 mb-4 sm:mb-6 lg:mb-8 leading-relaxed">
              {displayModules[currentSlide]?.description || featuredModule.description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
              <Button 
                onClick={() => handleModuleClick(displayModules[currentSlide]?.id || featuredModule.id)} 
                className="bg-white text-black hover:bg-gray-200 px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base lg:text-lg font-semibold"
              >
                <Play className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
                Assistir Agora
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="bg-gray-600/70 text-white hover:bg-gray-600 px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base lg:text-lg">
                    <Info className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
                    Mais
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700 max-w-sm sm:max-w-md lg:max-w-lg mx-4">
                  <DialogHeader>
                    <DialogTitle className="text-white text-lg sm:text-xl mb-2">Sobre o Curso</DialogTitle>
                    <DialogDescription className="text-gray-300 space-y-3 text-sm sm:text-base">
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

        {/* Navigation Arrows */}
        {displayModules.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300 opacity-0 hover:opacity-100 group"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300 opacity-0 hover:opacity-100 group"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {displayModules.length > 1 && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
            {displayModules.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        )}
      </motion.section>

      {/* Content Sections */}
      <div className="px-3 sm:px-4 lg:px-8 xl:px-16 pb-8 sm:pb-12 lg:pb-16 space-y-8 sm:space-y-12">
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
          <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
            <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-white">Continuar Assistindo</h2>
            <Button variant="ghost" className="text-gray-400 hover:text-white text-xs sm:text-sm lg:text-base hidden sm:flex">
              Ver Todos <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
            </Button>
          </div>
          
          <div className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-2 sm:pb-4 scrollbar-hide">
            {displayModules.slice(0, 4).map((module, index) => (
              <motion.div key={module.id} initial={{
                opacity: 0,
                x: 50
              }} animate={{
                opacity: 1,
                x: 0
              }} transition={{
                delay: 0.6 + index * 0.1
              }} className="flex-shrink-0 w-48 sm:w-64 lg:w-80">
                <div className="relative group cursor-pointer" onClick={() => handleModuleClick(module.id)}>
                  <img src={module.image} alt={module.title} className="w-full h-28 sm:h-36 lg:h-44 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 rounded-lg flex items-center justify-center">
                    <Play className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  {/* Progress Bar */}
                  {userProgress?.completedModules.includes(module.id) && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-b-lg" />
                  )}
                </div>
                
                <div className="mt-2">
                  <h3 className="text-white font-semibold text-xs sm:text-sm lg:text-base line-clamp-2">{module.title}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">{module.estimatedTime}</p>
                </div>
              </motion.div>
            ))}
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
          <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
            <h2 className="text-base sm:text-lg lg:text-2xl font-bold text-white">Módulos Exclusivos</h2>
            <Button variant="ghost" className="text-gray-400 hover:text-white text-xs sm:text-sm lg:text-base hidden sm:flex">
              Ver Todos <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
            {displayModules.map((module, index) => (
              <motion.div key={module.id} initial={{
                opacity: 0,
                y: 50
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                delay: 0.8 + index * 0.1
              }} className="relative group cursor-pointer" onClick={() => handleModuleClick(module.id)}>
                <img src={module.image} alt={module.title} className="w-full h-20 sm:h-24 lg:h-32 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 rounded-lg flex items-center justify-center">
                  <Play className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Completion Badge */}
                {userProgress?.completedModules.includes(module.id) && (
                  <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
                
                <h3 className="text-white text-xs sm:text-sm lg:text-base font-medium mt-1 sm:mt-2 group-hover:text-gray-300 line-clamp-2">
                  {module.title}
                </h3>
              </motion.div>
            ))}
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
        }} className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">
                Seu Progresso
              </h3>
              <p className="text-gray-300 text-sm sm:text-base">
                {completedCount} de {displayModules.length} módulos concluídos
              </p>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                  {Math.round((completedCount / displayModules.length) * 100)}%
                </div>
                <div className="text-xs sm:text-sm text-gray-400">Concluído</div>
              </div>
              
              <div className="w-16 sm:w-20 lg:w-24 h-16 sm:h-20 lg:h-24 relative">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(completedCount / displayModules.length) * 251.2} 251.2`}
                    className="text-red-500 transition-all duration-1000"
                  />
                </svg>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>;
}
