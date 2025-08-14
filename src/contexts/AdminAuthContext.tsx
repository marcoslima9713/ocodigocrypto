import { createContext, useContext, useState, ReactNode } from 'react';

interface AdminAuthContextType {
  isAdminLoggedIn: boolean;
  loginAdmin: () => void;
  logoutAdmin: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth deve ser usado dentro de um AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider = ({ children }: AdminAuthProviderProps) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const loginAdmin = () => {
    setIsAdminLoggedIn(true);
    try {
      localStorage.setItem('admin_logged', '1');
    } catch {}
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    try {
      localStorage.removeItem('admin_logged');
    } catch {}
  };

  // restaurar estado após reload
  if (!isAdminLoggedIn) {
    try {
      const v = localStorage.getItem('admin_logged');
      if (v === '1' && !isAdminLoggedIn) {
        setIsAdminLoggedIn(true);
      }
    } catch {}
  }

  return (
    <AdminAuthContext.Provider value={{ isAdminLoggedIn, loginAdmin, logoutAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}; 