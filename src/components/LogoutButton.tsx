import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { clearAuthSession } from "@/integrations/supabase/client";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

export const LogoutButton = ({ 
  variant = "ghost", 
  size = "sm", 
  className = "",
  children 
}: LogoutButtonProps) => {
  const handleLogout = async () => {
    try {
      // Limpar completamente a sessão
      await clearAuthSession();
      
      // Redirecionar para login
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro no logout:', error);
      // Mesmo com erro, forçar redirecionamento
      window.location.href = '/login';
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleLogout}
      className={className}
    >
      {children || <LogOut className="w-4 h-4" />}
    </Button>
  );
};
