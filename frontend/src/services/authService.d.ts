import { User } from '../types';

interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
    user: User;
  };
  message?: string;
}

interface RegisterResponse {
  success: boolean;
  data?: {
    token: string;
    user: User;
  };
  message?: string;
}

interface VerifyResponse {
  success: boolean;
  data?: {
    user: User;
  };
  message?: string;
}

export declare const authService: {
  login: (username: string, password: string) => Promise<LoginResponse>;
  register: (userData: Partial<User>) => Promise<RegisterResponse>;
  verify: () => Promise<VerifyResponse | null>;
  logout: () => void;
  getCurrentUser: () => User | null;
  isAuthenticated: () => boolean;
};
