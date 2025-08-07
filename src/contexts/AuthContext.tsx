// Supabase-only AuthContext – substitui a antiga dependência de Firebase
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  currentUser: User | null;
  userProgress: { completedModules: string[]; lastAccess: Date } | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  // Por enquanto mantemos assinatura para compatibilidade; implementação futura
  markModuleComplete: (moduleId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Monitorar mudanças de sessão
  useEffect(() => {
    // Carrega sessão inicial
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Erro no login", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Login realizado", description: "Bem-vindo de volta!" });
  };

  const register = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast({ title: "Erro no registro", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Conta criada!", description: "Verifique seu email para confirmar." });
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Erro ao sair", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      toast({ title: "Erro ao enviar email", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Email enviado", description: "Verifique sua caixa de entrada." });
  };

  const [userProgress, setUserProgress] = useState<{ completedModules: string[]; lastAccess: Date } | null>(null);

  // Carrega progresso ao logar
  useEffect(() => {
    const loadProgress = async () => {
      if (!session?.user) return;
      const { data, error } = await supabase
        .from('users_progress')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      if (error && error.code !== 'PGRST116') console.error('Erro carregando progresso', error);
      if (data) {
        setUserProgress({
          completedModules: data.completed_modules ?? [],
          lastAccess: data.last_access ? new Date(data.last_access) : new Date(),
        });
      } else {
        // cria linha padrão
        await supabase.from('users_progress').insert({ user_id: session.user.id, completed_modules: [] });
        setUserProgress({ completedModules: [], lastAccess: new Date() });
      }
    };
    if (session?.user) loadProgress();
  }, [session?.user]);

  const markModuleComplete = async (moduleId: string) => {
    if (!session?.user) return;
    const progress = userProgress ?? { completedModules: [], lastAccess: new Date() };
    if (progress.completedModules.includes(moduleId)) return;
    const newModules = [...progress.completedModules, moduleId];
    setUserProgress({ ...progress, completedModules: newModules, lastAccess: new Date() });
    await supabase.from('users_progress').upsert({
      user_id: session.user.id,
      completed_modules: newModules,
      last_access: new Date().toISOString(),
    });
  };

  const value: AuthContextType = {
    currentUser: session?.user ?? null,
    loading,
    login,
    register,
    logout,
    resetPassword,
    markModuleComplete,
    userProgress,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
