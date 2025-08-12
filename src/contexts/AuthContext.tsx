// Supabase-only AuthContext – substitui a antiga dependência de Firebase
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  currentUser: User | null;
  userProgress: { completedModules: string[]; lastAccess: Date } | null;
  loading: boolean;
  // Controle de acesso
  isMember: boolean;
  isFreeUser: boolean;
  allowedModules: string[];
  freeAllowDashboard?: boolean;
  freeAllowDCACalc?: boolean;
  freeAllowPortfolio?: boolean;
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
  const [isMember, setIsMember] = useState<boolean>(false);
  const [isFreeUser, setIsFreeUser] = useState<boolean>(false);
  const [allowedModules, setAllowedModules] = useState<string[]>([]);
  const [freeAllowDashboard, setFreeAllowDashboard] = useState<boolean>(false);
  const [freeAllowDCACalc, setFreeAllowDCACalc] = useState<boolean>(false);
  const [freeAllowPortfolio, setFreeAllowPortfolio] = useState<boolean>(false);

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

  // Carrega e garante o status de acesso (membro x gratuito)
  useEffect(() => {
    const loadAccess = async () => {
      if (!session?.user) {
        setIsMember(false);
        setIsFreeUser(false);
        setAllowedModules([]);
        return;
      }
      setLoading(true);
      try {
        // Verifica papel de membro consultando diretamente user_roles
        let paid = false;
        const { data: roles, error: rolesErr } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);
        if (!rolesErr && Array.isArray(roles)) {
          paid = roles.some((r: any) => r.role === 'member' || r.role === 'admin');
        }

        // Fallback: verifica se existe registro em members vinculado ao auth_user_id
        if (!paid) {
          const { data: memberByAuth } = await supabase
            .from('members')
            .select('id')
            .eq('auth_user_id', session.user.id)
            .maybeSingle();
          paid = !!memberByAuth;
        }

        setIsMember(!!paid);

        if (!paid) {
          // Garante que o usuário gratuito exista e obtenha allowed_modules
          try {
            const { data: freeRow } = await supabase
              .from('free_users')
              .select('allowed_modules')
              .eq('user_id', session.user.id)
              .maybeSingle();

            if (!freeRow) {
              const defaultModules = ['ciclo-de-juros-e-spx500'];
              const { error: insertErr } = await supabase
                .from('free_users')
                .insert({ 
                  user_id: session.user.id, 
                  email: session.user.email ?? '', 
                  full_name: (session.user.user_metadata as any)?.full_name ?? null, 
                  allowed_modules: defaultModules 
                });
              if (insertErr) {
                // Se tabela não existe (42P01) ou outra falha, aplica fallback
                setIsFreeUser(true);
                setAllowedModules(['ciclo-de-juros-e-spx500']);
              } else {
                setIsFreeUser(true);
                setAllowedModules(defaultModules);
              }
            } else {
              setIsFreeUser(true);
              setAllowedModules(freeRow.allowed_modules ?? ['ciclo-de-juros-e-spx500']);
            }
          } catch {
            // Fallback completo caso a tabela não exista
            setIsFreeUser(true);
            setAllowedModules(['ciclo-de-juros-e-spx500']);
          }

          // Carrega configurações globais do acesso gratuito
          try {
            const { data: globalCfg } = await supabase
              .from('free_access_settings')
              .select('allowed_modules, allow_dashboard, allow_dca_calculator, allow_portfolio')
              .eq('id', 'global')
              .maybeSingle();
            if (globalCfg) {
              const merged = Array.from(new Set([...(allowedModules || []), ...(globalCfg.allowed_modules || [])]));
              setAllowedModules(merged.length ? merged : ['ciclo-de-juros-e-spx500']);
              setFreeAllowDashboard(!!globalCfg.allow_dashboard);
              setFreeAllowDCACalc(!!globalCfg.allow_dca_calculator);
              setFreeAllowPortfolio(!!globalCfg.allow_portfolio);
            }
          } catch {
            // Mantém defaults
          }
        } else {
          // Membro pagante tem acesso completo
          setIsFreeUser(false);
          setAllowedModules(['*']);
          setFreeAllowDashboard(true);
          setFreeAllowDCACalc(true);
        }
      } finally {
        setLoading(false);
      }
    };

    loadAccess();
  }, [session?.user]);

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
    isMember,
    isFreeUser,
    allowedModules,
    freeAllowDashboard,
    freeAllowDCACalc,
    freeAllowPortfolio,
    login,
    register,
    logout,
    resetPassword,
    markModuleComplete,
    userProgress,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
