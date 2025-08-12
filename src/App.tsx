import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import PriceUpdateNotification from "@/components/PriceUpdateNotification";

import ErrorBoundary from "@/components/ErrorBoundary";
import { useState, useEffect } from "react";
// import './lib/errorHandler'; // Inicializar manipulador de erros global

// Páginas de autenticação
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Páginas protegidas
import Dashboard from "./pages/Dashboard";
import OrigensModule from "./pages/OrigensModule";
import CicloJurosModule from "./pages/CicloJurosModule";
import PoolLiquidezModule from "./pages/PoolLiquidezModule";
import DCAModule from "./pages/DCAModule";
import CryptoPortfolio from "./pages/CryptoPortfolio";
import AdminPanel from "./pages/AdminPanel";
import PortfolioRankingPage from "./pages/PortfolioRankingPage";
import DCACalculator from "./pages/DCACalculator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente de Error Boundary Global (para erros não capturados pelo React)
const GlobalErrorHandler = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setError(event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Não quebrar a aplicação para erros de rede
      if (event.reason && typeof event.reason === 'object') {
        const reason = event.reason;
        if (reason.message && (
          reason.message.includes('Failed to fetch') || 
          reason.message.includes('net::ERR_INTERNET_DISCONNECTED') ||
          reason.message.includes('NetworkError') ||
          reason.message.includes('timeout')
        )) {
          console.warn('Erro de rede ignorado:', reason.message);
          event.preventDefault();
          return;
        }
      }
      
      // Para outros erros, mostrar o erro mas não quebrar a aplicação
      console.warn('Promise rejection capturada:', event.reason);
      event.preventDefault();
    });

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">Erro na Aplicação</h1>
          <p className="text-gray-300 mb-4">
            Ocorreu um erro inesperado. Por favor, recarregue a página.
          </p>
          {error && (
            <details className="text-left text-xs text-gray-400 bg-gray-800 p-3 rounded">
              <summary className="cursor-pointer mb-2">Detalhes do erro</summary>
              <pre className="whitespace-pre-wrap">{error.message}</pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const App = () => {
  // Teste para confirmar que não há integração Web3
  // Evitar console.assert que gera erro visual nos bundles
  // Silenciar aviso em produção para evitar ruído em usuários com wallets instaladas
  if (typeof window !== 'undefined') {
    try {
      const isProd = import.meta && import.meta.env && import.meta.env.PROD
      if (!isProd && typeof (window as any).ethereum !== 'undefined') {
        console.warn('Ethereum provider detectado. Integrações Web3 devem permanecer desativadas.');
      }
    } catch {
      // ignore
    }
  }

  return (
    <GlobalErrorHandler>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
                          <AdminAuthProvider>
              <PriceUpdateNotification />
              <Toaster />
              <Sonner />
              <BrowserRouter>
              <Routes>
                {/* Rota raiz redireciona para dashboard se logado, senão para login */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* Rotas de autenticação */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Register />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Rotas protegidas */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/modulo/origens-bitcoin" 
                  element={
                    <ProtectedRoute>
                      <OrigensModule />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/modulo/ciclo-de-juros-e-spx500" 
                  element={
                    <ProtectedRoute>
                      <CicloJurosModule />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/modulo/pool-de-liquidez" 
                  element={
                    <ProtectedRoute>
                      <PoolLiquidezModule />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/modulo/dca" 
                  element={
                    <ProtectedRoute>
                      <DCAModule />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/portfolio" 
                  element={
                    <ProtectedRoute>
                      <CryptoPortfolio />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/ranking" 
                  element={
                    <ProtectedRoute>
                      <PortfolioRankingPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/dca-calculator" 
                  element={
                    <ProtectedRoute>
                      <DCACalculator />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Rota administrativa */}
                <Route 
                  path="/admin" 
                  element={
                    <AdminRoute>
                      <AdminPanel />
                    </AdminRoute>
                  } 
                />
                
                {/* Rota 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </BrowserRouter>
            </AdminAuthProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </GlobalErrorHandler>
  );
};

export default App;
