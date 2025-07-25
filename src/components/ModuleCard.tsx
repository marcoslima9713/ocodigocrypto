// Card de Módulo - Componente reutilizável para exibir módulos
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Play, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  image?: string;
  color: string;
  estimatedTime: string;
}

interface ModuleCardProps {
  module: Module;
  isCompleted: boolean;
  onComplete: () => void;
}

export const ModuleCard = ({ module, isCompleted, onComplete }: ModuleCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { markModuleComplete } = useAuth();
  const IconComponent = module.icon;

  const handleStartModule = async () => {
    setIsLoading(true);
    
    // Simula abertura do módulo (aqui você pode implementar navegação ou modal)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Marca como completo após "assistir"
    if (!isCompleted) {
      await markModuleComplete(module.id);
    }
    
    setIsLoading(false);
    onComplete();
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <div className="card-premium h-full relative overflow-hidden">
        {/* Imagem de capa se disponível */}
        {module.image && (
          <div className="relative h-48 overflow-hidden rounded-t-lg mb-4">
            <img 
              src={module.image} 
              alt={module.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )}
        
        {/* Fundo gradiente sutil */}
        <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-50`} />
        
        {/* Conteúdo */}
        <div className="relative z-10">
          {/* Header do card */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary/20 rounded-xl">
                <IconComponent className="w-6 h-6 text-primary" />
              </div>
              
              <div>
                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                  {module.title}
                </h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  {module.estimatedTime}
                </div>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex-shrink-0">
              {isCompleted ? (
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Descrição */}
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            {module.description}
          </p>

          {/* Botão de ação */}
          <Button
            onClick={handleStartModule}
            disabled={isLoading}
            className={`w-full ${
              isCompleted 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'btn-gold'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Carregando...
              </div>
            ) : isCompleted ? (
              <div className="flex items-center">
                <Check className="w-4 h-4 mr-2" />
                Revisitar
              </div>
            ) : (
              <div className="flex items-center">
                <Play className="w-4 h-4 mr-2" />
                Iniciar Módulo
              </div>
            )}
          </Button>

          {/* Badge de conclusão */}
          {isCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-2 right-2"
            >
              <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Concluído
              </div>
            </motion.div>
          )}
        </div>

        {/* Efeito hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </motion.div>
  );
};