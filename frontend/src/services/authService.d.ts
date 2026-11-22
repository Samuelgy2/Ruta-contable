import { User } from '../types';

interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
    user: User;
  };
  message?: string;
}

// Respuesta común de los tres pasos del registro: el cuerpo del backend, también en errores.
interface RegistroResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  attemptsLeft?: number;
  invalidated?: boolean;
  codigo?: 'TOKEN_INVALIDO';
}

interface DatosRegistro {
  registroToken: string;
  username: string;
  password: string;
  socio: {
    nombre: string;
    tipo_documento: string;
    documento: string;
    fecha_nacimiento: string;
    telefono: string;
    direccion: string;
    nivel_aprendizaje: string | null;
  };
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
  solicitarCodigoRegistro: (email: string) => Promise<RegistroResponse>;
  verificarCodigoRegistro: (email: string, otp: string) => Promise<RegistroResponse<{ email: string; registroToken: string }>>;
  register: (datos: DatosRegistro) => Promise<RegistroResponse<{ user: User & { idSocio: number; estadoSocio: string } }>>;
  verify: () => Promise<VerifyResponse | null>;
  logout: () => void;
  getCurrentUser: () => User | null;
  isAuthenticated: () => boolean;
};
