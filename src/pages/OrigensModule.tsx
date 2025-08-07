// Página do Módulo "Origens do Bitcoin"
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration?: string;
  videoUrl?: string;
  order_index: number;
  isCompleted: boolean;
}

export default function OrigensModule() {
  const navigate = useNavigate();
  const { '*': moduleId } = useParams();
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [moduleData, setModuleData] = useState<any>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  // Carregar módulo e vídeos do Supabase
  useEffect(() => {
    const currentModuleId = window.location.pathname.split('/').pop();
    console.log('🔄 Carregando dados do módulo:', currentModuleId);
    
    const fetchModuleData = async () => {
      try {
        // Buscar dados do módulo
        const { data: moduleInfo, error: moduleError } = await supabase
          .from('modules')
          .select('*')
          .eq('id', currentModuleId)
          .single();
        
        if (moduleError) {
          console.error('❌ Erro ao carregar módulo:', moduleError);
          return;
        }
        
        setModuleData(moduleInfo);
        console.log('📊 Dados do módulo carregados:', moduleInfo);
        
        // Buscar vídeos do módulo
        const { data: videosData, error: videosError } = await supabase
          .from('video_lessons')
          .select('*')
          .eq('module_id', currentModuleId)
          .eq('status', 'publicado')
          .order('order_index');
        
        console.log('📊 Dados dos vídeos carregados:', { data: videosData, error: videosError });
        
        if (videosData && !videosError) {
          const convertedLessons: Lesson[] = videosData.map(video => ({
            id: video.id,
            title: video.title,
            description: video.description || '',
            duration: video.duration ? `${Math.ceil(video.duration / 60)} min` : '',
            order_index: video.order_index || 0,
            isCompleted: false
          }));
          
          console.log('✅ Lições convertidas:', convertedLessons);
          setLessons(convertedLessons);
        } else {
          console.error('❌ Erro ao carregar vídeos:', videosError);
        }
      } catch (error) {
        console.error('❌ Erro geral ao carregar dados:', error);
      }
    };

    if (currentModuleId) {
      fetchModuleData();
      
      // Listener para mudanças em tempo real
      const channel = supabase
        .channel('video_lessons_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'video_lessons',
            filter: `module_id=eq.${currentModuleId}`
          },
          (payload) => {
            console.log('🔔 Mudança detectada na tabela video_lessons:', payload);
            fetchModuleData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const handleWatchLesson = async (lesson: Lesson) => {
    setIsLoadingVideo(true);
    console.log('🎬 Iniciando carregamento da aula:', lesson.title);
    console.log('🔑 Lesson ID:', lesson.id);
    
    // Buscar dados completos do vídeo no Supabase
    const { data: videoData, error } = await supabase
      .from('video_lessons')
      .select('*')
      .eq('id', lesson.id)
      .single();
    
    console.log('📊 Resposta da query do vídeo:', { videoData, error });
    
    if (videoData && !error) {
      try {
        console.log('📁 Tentando criar URL assinada para:', videoData.file_path);
        console.log('🪣 Bucket: video-lessons');
        
        const { data: urlData, error: urlError } = await supabase.storage
          .from('video-lessons')
          .createSignedUrl(videoData.file_path, 3600); // URL válida por 1 hora
        
        console.log('🔗 Resposta da URL assinada:', { data: urlData, error: urlError });
        
        if (urlData?.signedUrl) {
          lesson.videoUrl = urlData.signedUrl;
          console.log('✅ URL do vídeo definida:', lesson.videoUrl);
        } else {
          console.error('❌ Erro: Não foi possível gerar URL assinada', urlError);
          console.log('📋 Detalhes do erro:', JSON.stringify(urlError, null, 2));
        }
      } catch (error) {
        console.error('❌ Erro ao carregar vídeo:', error);
      }
    } else {
      console.log('⚠️ Erro ao buscar dados do vídeo:', error);
      console.log('📋 Detalhes do erro da query:', JSON.stringify(error, null, 2));
    }
    
    setCurrentLesson(lesson);
    setIsLoadingVideo(false);
    
    // Simula conclusão da aula após "assistir"
    setTimeout(() => {
      if (!completedLessons.includes(lesson.id)) {
        setCompletedLessons(prev => [...prev, lesson.id]);
      }
    }, 1000);
  };

  // Calcular duração total estimada
  const totalDuration = lessons.length * 8; // Estimativa de 8 min por aula

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm"
      >
        <div className="px-3 sm:px-4 lg:px-8 xl:px-16">
          <div className="flex justify-between items-center h-12 sm:h-16">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="text-white hover:text-gray-300 text-xs sm:text-sm px-2 sm:px-3"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Voltar ao Dashboard</span>
              <span className="sm:hidden">Voltar</span>
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-[50vh] sm:h-[60vh] flex items-center"
      >
        <div className="absolute inset-0">
          <img 
            src="https://i.imgur.com/aNUqdaq.png" 
            alt="Origens do Bitcoin"
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        <div className="relative z-10 px-3 sm:px-4 lg:px-8 xl:px-16 max-w-2xl sm:max-w-3xl mt-12 sm:mt-16">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2 sm:mb-4">
              {moduleData?.name || 'Carregando...'}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-300 mb-3 sm:mb-6 leading-relaxed">
              {moduleData?.description || 'Carregando descrição do módulo...'}
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6 text-gray-300 text-xs sm:text-sm">
              <div className="flex items-center">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                {totalDuration} min total
              </div>
              <div>
                {lessons.length} aulas
              </div>
              <div>
                {completedLessons.length}/{lessons.length} concluídas
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Lessons List */}
      <div className="px-3 sm:px-4 lg:px-8 xl:px-16 pb-8 sm:pb-12 lg:pb-16">
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4 sm:mb-6 lg:mb-8">Aulas do Módulo</h2>
          
          <div className="space-y-3 sm:space-y-4">
            {lessons.map((lesson, index) => {
              const isCompleted = completedLessons.includes(lesson.id);
              
              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="bg-gray-900/50 rounded-lg p-3 sm:p-4 lg:p-6 hover:bg-gray-800/50 transition-colors cursor-pointer group"
                  onClick={() => handleWatchLesson(lesson)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gray-700 rounded-full flex items-center justify-center">
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-500" />
                          ) : (
                            <span className="text-white text-xs sm:text-sm lg:text-base font-semibold">
                              {index + 1}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white mb-1 group-hover:text-gray-300 line-clamp-2">
                          {lesson.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400 line-clamp-2">
                          {lesson.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 sm:space-x-3 ml-2 sm:ml-4">
                      {lesson.duration && (
                        <span className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                          {lesson.duration}
                        </span>
                      )}
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 rounded-full flex items-center justify-center group-hover:bg-red-700 transition-colors">
                        <Play className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      </div>

      {/* Video Player Modal (Simulado) */}
      {currentLesson && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setCurrentLesson(null)}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {currentLesson.title}
              </h3>
              <Button
                variant="ghost"
                onClick={() => setCurrentLesson(null)}
                className="text-white"
              >
                ✕
              </Button>
            </div>
            
            <div className="bg-black aspect-video rounded mb-4 flex items-center justify-center relative overflow-hidden">
              {currentLesson?.videoUrl ? (
                <video
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  onEnded={() => {
                    // Marcar como concluída quando o vídeo terminar
                    if (!completedLessons.includes(currentLesson.id)) {
                      setCompletedLessons(prev => [...prev, currentLesson.id]);
                    }
                  }}
                >
                  <source src={currentLesson.videoUrl} type="video/mp4" />
                  Seu navegador não suporta a reprodução de vídeo.
                </video>
              ) : (
                <div className="text-white text-center">
                  <Play className="w-16 h-16 mx-auto mb-4" />
                  <p>Carregando vídeo...</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {currentLesson.title}
                  </p>
                </div>
              )}
            </div>
            
            <p className="text-gray-400 text-sm">
              {currentLesson.description}
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}