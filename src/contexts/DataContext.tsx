import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppData, User, Member, Transaction, Category, Fee, SystemData } from '../types';
import { getInitialData } from '../utils/initialData';

interface DataContextType extends AppData {
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addMember: (member: Omit<Member, 'id'>) => void;
  updateMember: (id: string, member: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addFee: (fee: Omit<Fee, 'id'>) => void;
  updateFee: (id: string, fee: Partial<Fee>) => void;
  deleteFee: (id: string) => void;
  updateSystemData: (data: Partial<SystemData>) => void;
  resetAllData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  users: 'clubfinance_users',
  members: 'clubfinance_members',
  transactions: 'clubfinance_transactions',
  categories: 'clubfinance_categories',
  fees: 'clubfinance_fees',
  systemData: 'clubfinance_systemData',
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => {
    try {
      const users = localStorage.getItem(STORAGE_KEYS.users);
      const members = localStorage.getItem(STORAGE_KEYS.members);
      const transactions = localStorage.getItem(STORAGE_KEYS.transactions);
      const categories = localStorage.getItem(STORAGE_KEYS.categories);
      const fees = localStorage.getItem(STORAGE_KEYS.fees);
      const systemData = localStorage.getItem(STORAGE_KEYS.systemData);

      const initialData = getInitialData();

      return {
        users: users ? JSON.parse(users) : initialData.users,
        members: members ? JSON.parse(members) : initialData.members,
        transactions: transactions ? JSON.parse(transactions) : initialData.transactions,
        categories: categories ? JSON.parse(categories) : initialData.categories,
        fees: fees ? JSON.parse(fees) : initialData.fees,
        systemData: systemData ? JSON.parse(systemData) : initialData.systemData,
      };
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      return getInitialData();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(data.users));
  }, [data.users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.members, JSON.stringify(data.members));
  }, [data.members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(data.transactions));
  }, [data.transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(data.categories));
  }, [data.categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.fees, JSON.stringify(data.fees));
  }, [data.fees]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.systemData, JSON.stringify(data.systemData));
  }, [data.systemData]);

  const addUser = (user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...user,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({
      ...prev,
      users: [...prev.users, newUser],
    }));
  };

  const updateUser = (id: string, updatedUser: Partial<User>) => {
    setData(prev => ({
      ...prev,
      users: prev.users.map(user =>
        user.id === id ? { ...user, ...updatedUser } : user
      ),
    }));
  };

  const deleteUser = (id: string) => {
    setData(prev => ({
      ...prev,
      users: prev.users.filter(user => user.id !== id),
    }));
  };

  const addMember = (member: Omit<Member, 'id'>) => {
    const newMember: Member = {
      ...member,
      id: generateId(),
    };
    setData(prev => ({
      ...prev,
      members: [...prev.members, newMember],
    }));
  };

  const updateMember = (id: string, updatedMember: Partial<Member>) => {
    setData(prev => ({
      ...prev,
      members: prev.members.map(member =>
        member.id === id ? { ...member, ...updatedMember } : member
      ),
    }));
  };

  const deleteMember = (id: string) => {
    setData(prev => ({
      ...prev,
      members: prev.members.filter(member => member.id !== id),
    }));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
    };
    setData(prev => ({
      ...prev,
      transactions: [...prev.transactions, newTransaction],
    }));
  };

  const updateTransaction = (id: string, updatedTransaction: Partial<Transaction>) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(transaction =>
        transaction.id === id ? { ...transaction, ...updatedTransaction } : transaction
      ),
    }));
  };

  const deleteTransaction = (id: string) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(transaction => transaction.id !== id),
    }));
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: generateId(),
    };
    setData(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }));
  };

  const updateCategory = (id: string, updatedCategory: Partial<Category>) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(category =>
        category.id === id ? { ...category, ...updatedCategory } : category
      ),
    }));
  };

  const deleteCategory = (id: string) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.filter(category => category.id !== id),
    }));
  };

  const addFee = (fee: Omit<Fee, 'id'>) => {
    const newFee: Fee = {
      ...fee,
      id: generateId(),
    };
    setData(prev => ({
      ...prev,
      fees: [...prev.fees, newFee],
    }));
  };

  const updateFee = (id: string, updatedFee: Partial<Fee>) => {
    setData(prev => ({
      ...prev,
      fees: prev.fees.map(fee =>
        fee.id === id ? { ...fee, ...updatedFee } : fee
      ),
    }));
  };

  const deleteFee = (id: string) => {
    setData(prev => ({
      ...prev,
      fees: prev.fees.filter(fee => fee.id !== id),
    }));
  };

  const updateSystemData = (updatedData: Partial<SystemData>) => {
    setData(prev => ({
      ...prev,
      systemData: { ...prev.systemData, ...updatedData },
    }));
  };

  const resetAllData = () => {
    const initialData = getInitialData();
    setData(initialData);
  };

  return (
    <DataContext.Provider
      value={{
        ...data,
        addUser,
        updateUser,
        deleteUser,
        addMember,
        updateMember,
        deleteMember,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        addFee,
        updateFee,
        deleteFee,
        updateSystemData,
        resetAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData debe usarse dentro de DataProvider');
  }
  return context;
}
