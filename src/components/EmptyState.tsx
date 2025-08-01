import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  details?: string;
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  details, 
  className = "" 
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="text-zinc-400 mb-4">
        <Icon className="w-16 h-16 mx-auto mb-4 opacity-50" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {title}
      </h3>
      <p className="text-zinc-400 text-sm max-w-md mx-auto mb-4">
        {description}
      </p>
      {details && (
        <div className="text-xs text-zinc-500">
          <p>{details}</p>
        </div>
      )}
    </div>
  );
} 