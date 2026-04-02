// Tipos y interfaces centralizados del sistema

export type UserRole = 'gestor' | 'admin' | 'user';

// Usuario para el backend (coincide con la respuesta de la API)
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  created_at?: string;
}

// Usuario legacy (para compatibilidad con código existente)
export interface gestor {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  fullName: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  active: boolean;
  membershipType: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdBy: string;
  memberId?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  description: string;
  active: boolean;
}

export interface Fee {
  id: string;
  memberId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  transactionId?: string;
}

export interface SystemData {
  clubName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  fiscalYear: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;  // Ahora usa el tipo User del backend
}

export interface AppData {
  users: gestor[];  // Para compatibilidad con datos existentes
  members: Member[];
  transactions: Transaction[];
  categories: Category[];
  fees: Fee[];
  systemData: SystemData;
}

// Función helper para convertir User de backend a gestor (si es necesario)
export function mapBackendUserToGestor(backendUser: User): gestor {
  return {
    id: backendUser.id.toString(),
    username: backendUser.email.split('@')[0],
    password: '', // No se guarda la contraseña
    role: backendUser.role,
    fullName: backendUser.name,
    email: backendUser.email,
    active: backendUser.active,
    createdAt: backendUser.created_at || new Date().toISOString(),
  };
}