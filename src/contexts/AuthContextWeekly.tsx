import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase, clearAuthSession } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  currentUser: User | null;
  session: Session | null;
  loading: boolean;
  isMember: boolean;
  isFreeUser: boolean;
  allowedModules: string[];
  freeAllowDashboard: boolean;
  freeAllowDCACalc: boolean;
  freeAllowPortfolio: boolean;
  freeAllowSentiment: boolean;
  subscriptionStatus: {
    isActive: boolean;
    endDate: string | null;
    daysRemaining: number;
    isExpired: boolean;
  };
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isFreeUser, setIsFreeUser] = useState(false);
  const [allowedModules, setAllowedModules] = useState<string[]>([]);
  const [freeAllowDashboard, setFreeAllowDashboard] = useState(false);
  const [freeAllowDCACalc, setFreeAllowDCACalc] = useState(false);
  const [freeAllowPortfolio, setFreeAllowPortfolio] = useState(false);
  const [freeAllowSentiment, setFreeAllowSentiment] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    isActive: false,
    endDate: null as string | null,
    daysRemaining: 0,
    isExpired: false
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setCurrentUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Função para verificar e expirar assinaturas automaticamente
  const checkAndExpireSubscriptions = async () => {
    try {
      const { data, error } = await supabase.rpc('check_and_expire_subscriptions');
      if (error) {
        console.error('Erro ao verificar expirações:', error);
      } else {
        console.log(`Assinaturas expiradas: ${data}`);
      }
    } catch (error) {
      console.error('Erro ao verificar expirações:', error);
    }
  };

  // Carrega e garante o status de acesso (membro x gratuito) com verificação de expiração
  useEffect(() => {
    const loadAccess = async () => {
      if (!session?.user) {
        setIsMember(false);
        setIsFreeUser(false);
        setAllowedModules([]);
        setSubscriptionStatus({
          isActive: false,
          endDate: null,
          daysRemaining: 0,
          isExpired: false
        });
        return;
      }

      setLoading(true);
      
      try {
        // Primeiro, verificar e expirar assinaturas vencidas
        await checkAndExpireSubscriptions();

        // Verificar se usuário tem assinatura ativa
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select(`
            id,
            subscription_status,
            subscription_end_date,
            subscription_start_date,
            payment_count
          `)
          .eq('auth_user_id', session.user.id)
          .maybeSingle();

        if (memberError) {
          console.error('Erro ao buscar dados do membro:', memberError);
        }

        let hasActiveSubscription = false;
        let subscriptionEndDate = null;
        let daysRemaining = 0;
        let isExpired = false;

        if (memberData) {
          const endDate = new Date(memberData.subscription_end_date);
          const now = new Date();
          const timeDiff = endDate.getTime() - now.getTime();
          daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
          
          hasActiveSubscription = memberData.subscription_status === 'active' && daysRemaining > 0;
          subscriptionEndDate = memberData.subscription_end_date;
          isExpired = memberData.subscription_status === 'expired' || daysRemaining <= 0;

          console.log(`📅 Status da assinatura para ${session.user.email}:`, {
            status: memberData.subscription_status,
            endDate: subscriptionEndDate,
            daysRemaining,
            isActive: hasActiveSubscription,
            isExpired
          });
        }

        setSubscriptionStatus({
          isActive: hasActiveSubscription,
          endDate: subscriptionEndDate,
          daysRemaining: Math.max(0, daysRemaining),
          isExpired
        });

        // Verificar papel de membro (admin sempre tem acesso)
        let isAdmin = false;
        const { data: roles, error: rolesErr } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);
        
        if (!rolesErr && Array.isArray(roles)) {
          isAdmin = roles.some((r: any) => r.role === 'admin');
        }

        // Lógica de acesso: Admin OU (Membro com assinatura ativa)
        const hasAccess = isAdmin || (memberData && hasActiveSubscription);
        
        setIsMember(hasAccess);

        if (!hasAccess) {
          // Usuário sem acesso ativo - configurar como usuário gratuito
          setIsFreeUser(true);
          
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
                console.error('Erro ao criar usuário gratuito:', insertErr);
                setAllowedModules(['ciclo-de-juros-e-spx500']);
              } else {
                setAllowedModules(defaultModules);
              }
            } else {
              setAllowedModules(freeRow.allowed_modules || ['ciclo-de-juros-e-spx500']);
            }

            // Carrega configurações globais do acesso gratuito
            try {
              const { data: globalCfg } = await supabase
                .from('free_access_settings')
                .select('allowed_modules, allow_dashboard, allow_dca_calculator, allow_portfolio, allow_sentiment')
                .eq('id', 'global')
                .maybeSingle();
              
              if (globalCfg) {
                const merged = Array.from(new Set([...(allowedModules || []), ...(globalCfg.allowed_modules || [])]));
                setAllowedModules(merged.length ? merged : ['ciclo-de-juros-e-spx500']);
                setFreeAllowDashboard(!!globalCfg.allow_dashboard);
                setFreeAllowDCACalc(!!globalCfg.allow_dca_calculator);
                setFreeAllowPortfolio(!!globalCfg.allow_portfolio);
                setFreeAllowSentiment(!!globalCfg.allow_sentiment);
              }
            } catch (error) {
              console.error('Erro ao carregar configurações gratuitas:', error);
            }
          } catch (error) {
            console.error('Erro ao configurar usuário gratuito:', error);
            setAllowedModules(['ciclo-de-juros-e-spx500']);
          }
        } else {
          // Membro pagante com assinatura ativa tem acesso completo
          setIsFreeUser(false);
          setAllowedModules(['*']);
          setFreeAllowDashboard(true);
          setFreeAllowDCACalc(true);
          setFreeAllowPortfolio(true);
          setFreeAllowSentiment(true);
        }

        // Mostrar notificação se assinatura está próxima do vencimento
        if (hasActiveSubscription && daysRemaining <= 2 && daysRemaining > 0) {
          toast({
            title: "⚠️ Assinatura expirando em breve",
            description: `Sua assinatura expira em ${daysRemaining} dia(s). Renove para continuar o acesso.`,
            variant: "destructive"
          });
        }

        // Mostrar notificação se assinatura expirou
        if (isExpired) {
          toast({
            title: "❌ Assinatura expirada",
            description: "Sua assinatura expirou. Renove o pagamento para continuar o acesso completo.",
            variant: "destructive"
          });
        }

      } catch (error) {
        console.error('Erro ao carregar acesso:', error);
        setIsMember(false);
        setIsFreeUser(false);
        setAllowedModules([]);
      } finally {
        setLoading(false);
      }
    };

    loadAccess();
  }, [session?.user, toast]);

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
    try {
      // Limpar estado local primeiro
      setCurrentUser(null);
      setSession(null);
      setIsMember(false);
      setIsFreeUser(false);
      setAllowedModules([]);
      setSubscriptionStatus({
        isActive: false,
        endDate: null,
        daysRemaining: 0,
        isExpired: false
      });
      
      // Usar a função utilitária para limpar completamente a sessão
      await clearAuthSession();
      
      // Redirecionar para login
      window.location.href = '/login';
      
    } catch (error) {
      console.error('Erro no logout:', error);
      // Mesmo com erro, redirecionar para login
      window.location.href = '/login';
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

  const value: AuthContextType = {
    currentUser,
    session,
    loading,
    isMember,
    isFreeUser,
    allowedModules,
    freeAllowDashboard,
    freeAllowDCACalc,
    freeAllowPortfolio,
    freeAllowSentiment,
    subscriptionStatus,
    login,
    register,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
