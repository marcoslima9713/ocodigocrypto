// Context de Autenticação - Gerencia estado do usuário logado
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, checkFirestoreConnection, executeFirestoreOperation } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// Interface para o progresso do usuário nos módulos
interface UserProgress {
  completedModules: string[];
  lastAccess: Date;
}

// Interface do contexto de autenticação
interface AuthContextType {
  currentUser: User | null;
  userProgress: UserProgress | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  markModuleComplete: (moduleId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Provider do contexto de autenticação
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Função para registrar novo usuário
  const register = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Cria documento inicial do usuário no Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        completedModules: [],
        lastAccess: new Date(),
        createdAt: new Date()
      });
      
      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo à nossa plataforma premium.",
      });
    } catch (error: any) {
      console.error('Erro no registro:', error);
      toast({
        title: "Erro no registro",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Função para fazer login
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta.",
      });
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast({
        title: "Erro no login",
        description: "Email ou senha incorretos.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Função para fazer logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUserProgress(null);
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
    } catch (error: any) {
      console.error('Erro no logout:', error);
      toast({
        title: "Erro no logout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Função para resetar senha usando AWS SES
  const resetPassword = async (email: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/password-reset`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para redefinir a senha.",
        });
      } else {
        throw new Error(data.error || 'Erro ao enviar email de recuperação');
      }
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Carrega progresso do usuário do Firestore
  const loadUserProgress = async (userId: string) => {
    const defaultProgress = {
      completedModules: [],
      lastAccess: new Date()
    };

    const result = await executeFirestoreOperation(
      async () => {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          return {
            completedModules: data.completedModules || [],
            lastAccess: data.lastAccess?.toDate() || new Date()
          };
        } else {
          // Se o documento não existe, criar um novo
          return defaultProgress;
        }
      },
      defaultProgress
    );

    setUserProgress(result);
  };

  // Função para marcar módulo como completo com melhor tratamento de erro
  const markModuleComplete = async (moduleId: string) => {
    if (!currentUser || !userProgress) return;

    const updatedModules = [...userProgress.completedModules];
    if (!updatedModules.includes(moduleId)) {
      updatedModules.push(moduleId);
    }

    const updatedProgress = {
      ...userProgress,
      completedModules: updatedModules,
      lastAccess: new Date()
    };

    // Atualizar estado local imediatamente
    setUserProgress(updatedProgress);

    const success = await executeFirestoreOperation(
      async () => {
        await setDoc(doc(db, 'users', currentUser.uid), updatedProgress, { merge: true });
        return true;
      },
      false
    );

    if (success) {
      toast({
        title: "Módulo concluído!",
        description: "Parabéns pelo seu progresso.",
      });
    } else {
      toast({
        title: "Módulo concluído!",
        description: "Progresso salvo localmente (sem conexão com servidor).",
      });
    }
  };

  // Observer do estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserProgress(user.uid);
      } else {
        setUserProgress(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProgress,
    loading,
    login,
    register,
    logout,
    resetPassword,
    markModuleComplete
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};