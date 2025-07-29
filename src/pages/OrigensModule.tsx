// Página do Módulo "Origens do Bitcoin"
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl?: string;
  isCompleted: boolean;
}

const lessons: Lesson[] = [
  {
    id: 'aula-1',
    title: 'A Criação Misteriosa do Bitcoin',
    description: 'A verdadeira história por trás de Satoshi Nakamoto e os primeiros dias do Bitcoin. Quem realmente estava envolvido?',
    duration: '12 min',
    isCompleted: false
  },
  {
    id: 'aula-2', 
    title: 'Os Primeiros Adotantes',
    description: 'Como desenvolvedores e cypherpunks moldaram o Bitcoin nos primeiros anos. As decisões que definiram o futuro.',
    duration: '9 min',
    isCompleted: false
  },
  {
    id: 'aula-3',
    title: 'O Primeiro Ciclo de Alta',
    description: 'De centavos a dólares: como o primeiro bull run revelou o potencial disruptivo do Bitcoin.',
    duration: '11 min', 
    isCompleted: false
  },
  {
    id: 'aula-4',
    title: 'Instituições Entram em Cena',
    description: 'Como empresas e governos começaram a prestar atenção. O momento em que tudo mudou.',
    duration: '8 min',
    isCompleted: false
  },
  {
    id: 'aula-5',
    title: 'Lições para o Futuro',
    description: 'O que os primeiros ciclos nos ensinam sobre os próximos movimentos do Bitcoin.',
    duration: '5 min',
    isCompleted: false
  }
];

export default function OrigensModule() {
  const navigate = useNavigate();
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  const handleWatchLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    // Simula conclusão da aula após "assistir"
    setTimeout(() => {
      if (!completedLessons.includes(lesson.id)) {
        setCompletedLessons(prev => [...prev, lesson.id]);
      }
    }, 1000);
  };

  const totalDuration = lessons.reduce((acc, lesson) => {
    const mins = parseInt(lesson.duration.split(' ')[0]);
    return acc + mins;
  }, 0);

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
            src="https://i.imgur.com/aNUqdaq.png" 
            alt="Origens do Bitcoin"
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
              Origens do Bitcoin
            </h1>
            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
              A verdadeira história por trás da criação do Bitcoin, os players envolvidos e como isso moldou o mercado que conhecemos hoje.
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
            {lessons.map((lesson, index) => {
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
                        {isCompleted ? (
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
            })}
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
              {Math.round((completedLessons.length / lessons.length) * 100)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completedLessons.length / lessons.length) * 100}%` }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="bg-red-600 h-2 rounded-full"
            />
          </div>
          
          {completedLessons.length === lessons.length && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="text-2xl font-bold text-green-500 mb-2">
                🎉 Parabéns! Módulo Concluído
              </div>
              <p className="text-gray-400">
                Você completou todas as aulas do módulo "Origens do Bitcoin"
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
            
            <div className="bg-black aspect-video rounded mb-4 flex items-center justify-center">
              <div className="text-white text-center">
                <Play className="w-16 h-16 mx-auto mb-4" />
                <p>Simulação de Player de Vídeo</p>
                <p className="text-sm text-gray-400 mt-2">
                  Aqui seria exibido o vídeo da aula: {currentLesson.title}
                </p>
              </div>
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