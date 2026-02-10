import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../../../types';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => boolean;
  register: (data: { firstName: string; lastName: string; email: string; password: string }) => boolean;
  logout: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'clubfinance_auth';
const USERS_KEY = 'clubfinance_users';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          isAuthenticated: false,
          currentUser: null,
        };
      }
    }
    return {
      isAuthenticated: false,
      currentUser: null,
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authState));
  }, [authState]);

  const login = (username: string, password: string): boolean => {
    const usersData = localStorage.getItem(USERS_KEY);
    if (!usersData) return false;

    try {
      const users: User[] = JSON.parse(usersData);
      const user = users.find(
        (u) => u.username === username && u.password === password && u.active
      );

      if (user) {
        const newAuthState = {
          isAuthenticated: true,
          currentUser: user,
        };
        setAuthState(newAuthState);
        return true;
      }
    } catch (error) {
      console.error('Error during login:', error);
    }

    return false;
  };

  const register = (data: { firstName: string; lastName: string; email: string; password: string }): boolean => {
    const usersData = localStorage.getItem(USERS_KEY);
    let users: User[] = [];
    
    if (usersData) {
      try {
        users = JSON.parse(usersData);
        // Verificar si el email ya está registrado
        if (users.some(u => u.email === data.email)) {
          return false;
        }
      } catch (error) {
        console.error('Error parsing users data:', error);
      }
    }

    // Crear nuevo usuario
    const newUser: User = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      username: data.email.split('@')[0], // Usar parte del email como username
      password: data.password,
      fullName: `${data.firstName} ${data.lastName}`,
      email: data.email,
      role: 'user',
      active: true,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      currentUser: null,
    });
  };

  const isAdmin = (): boolean => {
    return authState.currentUser?.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
