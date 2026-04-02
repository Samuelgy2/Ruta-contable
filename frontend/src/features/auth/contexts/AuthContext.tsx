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
    // Check if user is already logged in on mount
    const checkAuth = async () => {
      const token = localStorage.getItem('clubfinance_token');
      const userStr = localStorage.getItem('clubfinance_user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr) as User;
          setAuthState({
            isAuthenticated: true,
            currentUser: user,
          });
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
          authService.logout();
        }
      }
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

  const register = async (userData: Partial<User>): Promise<boolean> => {
    try {
      const response = await authService.register(userData);
      
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
