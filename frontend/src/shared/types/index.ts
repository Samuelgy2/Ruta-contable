// Tipos y interfaces centralizados del sistema

export type UserRole = 'user' | 'admin';

export interface User {
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
  currentUser: User | null;
}

export interface AppData {
  users: User[];
  members: Member[];
  transactions: Transaction[];
  categories: Category[];
  fees: Fee[];
  systemData: SystemData;
}
