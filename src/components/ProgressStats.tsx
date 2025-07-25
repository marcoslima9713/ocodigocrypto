// Componente de Estatísticas de Progresso - Mostra progresso do usuário
import { motion } from 'framer-motion';
import { Award, Target, TrendingUp } from 'lucide-react';

interface ProgressStatsProps {
  totalModules: number;
  completedModules: number;
  progressPercentage: number;
}

export const ProgressStats = ({ 
  totalModules, 
  completedModules, 
  progressPercentage 
}: ProgressStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Progresso total */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center"
      >
        <div className="relative inline-flex items-center justify-center w-20 h-20 mb-3">
          {/* Círculo de progresso */}
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
            {/* Fundo do círculo */}
            <circle
              cx="40"
              cy="40"
              r="30"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="6"
            />
            {/* Progresso */}
            <motion.circle
              cx="40"
              cy="40"
              r="30"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 30}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
              animate={{ 
                strokeDashoffset: 2 * Math.PI * 30 * (1 - progressPercentage / 100)
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          
          {/* Percentual no centro */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">
              {Math.round(progressPercentage)}%
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-center text-muted-foreground">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span className="text-sm">Progresso Geral</span>
        </div>
      </motion.div>

      {/* Módulos completados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-3">
          <Award className="w-8 h-8 text-primary" />
        </div>
        
        <div className="text-2xl font-bold text-gradient-gold mb-1">
          {completedModules}
        </div>
        
        <div className="flex items-center justify-center text-muted-foreground">
          <span className="text-sm">Módulos Concluídos</span>
        </div>
      </motion.div>

      {/* Módulos restantes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 rounded-full mb-3">
          <Target className="w-8 h-8 text-accent" />
        </div>
        
        <div className="text-2xl font-bold text-gradient-gold mb-1">
          {totalModules - completedModules}
        </div>
        
        <div className="flex items-center justify-center text-muted-foreground">
          <span className="text-sm">Módulos Restantes</span>
        </div>
      </motion.div>
    </div>
  );
};