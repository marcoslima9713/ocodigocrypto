// Página do Módulo "Pool de Liquidez"
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

export default function PoolLiquidezModule() {
  const navigate = useNavigate();
  const { '*': moduleId } = useParams();
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [moduleData, setModuleData] = useState<any>(null);
  const [moduleCover, setModuleCover] = useState<string>('');
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
        
        // Buscar capa do módulo
        try {
          const { data: coverData, error: coverError } = await supabase
            .from('module_covers')
            .select('cover_url')
            .eq('slug', currentModuleId)
            .single();
          
          if (!coverError && coverData) {
            setModuleCover(coverData.cover_url);
          }
        } catch (error) {
          console.log('Capa personalizada não encontrada, usando padrão');
        }
        
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
        channel.unsubscribe();
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
        <div className="px-4 sm:px-8 lg:px-16">
          <div className="flex justify-between items-center h-16">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="text-white hover:text-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-[60vh] flex items-center"
      >
        <div className="absolute inset-0">
          <img 
            src={moduleCover || "/pool-liquidez-cover.jpg"} 
            alt="Pool de Liquidez"
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        <div className="relative z-10 px-4 sm:px-8 lg:px-16 max-w-3xl mt-16">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
              {moduleData?.name || 'Pool de Liquidez'}
            </h1>
            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
              {moduleData?.description || 'Domine os conceitos fundamentais de pools de liquidez e yield farming no ecossistema DeFi. Aprenda sobre AMMs, impermanent loss, yield farming e estratégias avançadas de investimento em DeFi.'}
            </p>
            <div className="flex items-center space-x-6 text-gray-300">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
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
      <div className="px-4 sm:px-8 lg:px-16 pb-16">
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-8">Aulas do Módulo</h2>
          
          <div className="space-y-4">
            {lessons.length > 0 ? (
              lessons.map((lesson, index) => {
                const isCompleted = completedLessons.includes(lesson.id);
                
                return (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="bg-gray-900/50 rounded-lg p-6 hover:bg-gray-800/50 transition-colors cursor-pointer group"
                    onClick={() => handleWatchLesson(lesson)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {isLoadingVideo && currentLesson?.id === lesson.id ? (
                            <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : isCompleted ? (
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors">
                              <Play className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            Aula {index + 1}: {lesson.title}
                          </h3>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            {lesson.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-gray-400 text-sm">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {lesson.duration}
                        </div>
                        
                        {isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-green-500 text-xs font-medium bg-green-500/20 px-2 py-1 rounded-full"
                          >
                            Concluída
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              // Aulas padrão do módulo Pool de Liquidez
              [
                {
                  id: '1',
                  title: 'Introdução às Pools de Liquidez',
                  description: 'Conceitos fundamentais de pools de liquidez e como funcionam no ecossistema DeFi.',
                  duration: '8 min',
                  order_index: 1,
                  isCompleted: false
                },
                {
                  id: '2',
                  title: 'Automated Market Makers (AMMs)',
                  description: 'Entenda como os AMMs funcionam e revolucionaram o trading descentralizado.',
                  duration: '10 min',
                  order_index: 2,
                  isCompleted: false
                },
                {
                  id: '3',
                  title: 'Impermanent Loss',
                  description: 'O que é impermanent loss e como minimizar seus impactos nos investimentos.',
                  duration: '12 min',
                  order_index: 3,
                  isCompleted: false
                },
                {
                  id: '4',
                  title: 'Yield Farming',
                  description: 'Estratégias de yield farming e como maximizar seus rendimentos.',
                  duration: '15 min',
                  order_index: 4,
                  isCompleted: false
                },
                {
                  id: '5',
                  title: 'Estratégias Avançadas',
                  description: 'Técnicas avançadas para otimizar seus investimentos em DeFi.',
                  duration: '18 min',
                  order_index: 5,
                  isCompleted: false
                },
                {
                  id: '6',
                  title: 'Análise de Riscos',
                  description: 'Como identificar e mitigar riscos no ecossistema DeFi.',
                  duration: '10 min',
                  order_index: 6,
                  isCompleted: false
                },
                {
                  id: '7',
                  title: 'Exercícios Práticos',
                  description: 'Aplicação prática dos conceitos aprendidos com exemplos reais.',
                  duration: '20 min',
                  order_index: 7,
                  isCompleted: false
                },
                {
                  id: '8',
                  title: 'Avaliação Final',
                  description: 'Teste seus conhecimentos e receba seu certificado de conclusão.',
                  duration: '15 min',
                  order_index: 8,
                  isCompleted: false
                }
              ].map((lesson, index) => {
                const isCompleted = completedLessons.includes(lesson.id);
                
                return (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="bg-gray-900/50 rounded-lg p-6 hover:bg-gray-800/50 transition-colors cursor-pointer group"
                    onClick={() => handleWatchLesson(lesson)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {isLoadingVideo && currentLesson?.id === lesson.id ? (
                            <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : isCompleted ? (
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors">
                              <Play className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            Aula {index + 1}: {lesson.title}
                          </h3>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            {lesson.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-gray-400 text-sm">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {lesson.duration}
                        </div>
                        
                        {isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-green-500 text-xs font-medium bg-green-500/20 px-2 py-1 rounded-full"
                          >
                            Concluída
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.section>

        {/* Progress Summary */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-12 bg-gray-900/50 rounded-lg p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">Progresso do Módulo</h3>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">Progresso Geral</span>
            <span className="text-white font-semibold">
              {Math.round((completedLessons.length / Math.max(lessons.length, 8)) * 100)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completedLessons.length / Math.max(lessons.length, 8)) * 100}%` }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="bg-red-600 h-2 rounded-full"
            />
          </div>
          
          {completedLessons.length === Math.max(lessons.length, 8) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="text-2xl font-bold text-green-500 mb-2">
                🎉 Parabéns! Módulo Concluído
              </div>
              <p className="text-gray-400">
                Você completou todas as aulas do módulo "Pool de Liquidez"
              </p>
            </motion.div>
          )}
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