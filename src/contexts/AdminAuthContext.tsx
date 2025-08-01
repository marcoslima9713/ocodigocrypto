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
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAdminLoggedIn, loginAdmin, logoutAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}; 