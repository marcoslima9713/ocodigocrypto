import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";

// Páginas de autenticação
import Login from "./pages/Login";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            {/* Rota raiz redireciona para dashboard se logado, senão para login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Rotas de autenticação */}
            <Route path="/login" element={<Login />} />
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
);

export default App;
