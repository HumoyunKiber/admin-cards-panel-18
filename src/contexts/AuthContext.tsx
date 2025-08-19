import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiClient.login({ username, password });
      
      if (response.success && response.token) {
        setIsAuthenticated(true);
        localStorage.setItem('adminToken', response.token);
        localStorage.setItem('adminAuth', 'true');
        
        toast({
          title: "Muvaffaqiyatli!",
          description: "Tizimga muvaffaqiyatli kirdingiz",
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Xato!",
        description: "Login parolda xatolik. Qaytadan urinib ko'ring.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminAuth');
      setIsLoading(false);
      
      toast({
        title: "Chiqish",
        description: "Tizimdan muvaffaqiyatli chiqdingiz",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};