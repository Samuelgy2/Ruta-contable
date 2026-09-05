import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../../../types';
import { authService } from '../../../services/authService.js';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    currentUser: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const verified = await authService.verify();

      if (verified?.success && verified.data?.user) {
        setAuthState({
          isAuthenticated: true,
          currentUser: verified.data.user,
        });
        return;
      }

      authService.logout();
      setAuthState({
        isAuthenticated: false,
        currentUser: null,
      });
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login(username, password);
      
      if (response.success && response.data) {
        const user = response.data.user as User;
        setAuthState({
          isAuthenticated: true,
          currentUser: user,
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      return false;
    }
  };

  const logout = () => {
    authService.logout();
    setAuthState({
      isAuthenticated: false,
      currentUser: null,
    });
  };

  // El registro no inicia sesión: sólo confirma si la cuenta se creó (201).
  // La sesión actual se deja intacta y el formulario redirige al login.
  const register = async (userData: Partial<User>): Promise<boolean> => {
    try {
      const response = await authService.register(userData);

      return Boolean(response?.success && response.data?.user);
    } catch (error) {
      console.error('Register error in AuthContext:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
