import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AppData,
  User,
  Member,
  Transaction,
  Category,
  Fee,
  SystemData,
  Periodo,
  ConfigMensualidad,
  DetalleTransaccion,
  PagoMensual,
  Cartera,
  Attendance,
  JerseyOrder,
  InventarioJersey,
  Locker,
  HealthPolicy,
  Compra,
  Factura,
  DetalleFactura,
} from '../types';
import { getInitialData } from '../utils/initialData';

interface DataContextType extends AppData {
  // Users
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  // Members
  addMember: (member: Omit<Member, 'id'>) => void;
  updateMember: (id: string, member: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  // Transactions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  // Categories
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  // Fees (legacy)
  addFee: (fee: Omit<Fee, 'id'>) => void;
  updateFee: (id: string, fee: Partial<Fee>) => void;
  deleteFee: (id: string) => void;
  // System
  updateSystemData: (data: Partial<SystemData>) => void;
  // Periodos
  addPeriodo: (periodo: Omit<Periodo, 'id'>) => void;
  updatePeriodo: (id: string, periodo: Partial<Periodo>) => void;
  deletePeriodo: (id: string) => void;
  // Config Mensualidad
  addConfigMensualidad: (config: Omit<ConfigMensualidad, 'id'>) => void;
  updateConfigMensualidad: (id: string, config: Partial<ConfigMensualidad>) => void;
  deleteConfigMensualidad: (id: string) => void;
  // Detalle Transaccion
  addDetalleTransaccion: (detalle: Omit<DetalleTransaccion, 'id'>) => void;
  updateDetalleTransaccion: (id: string, detalle: Partial<DetalleTransaccion>) => void;
  deleteDetalleTransaccion: (id: string) => void;
  // Pago Mensual
  addPagoMensual: (pago: Omit<PagoMensual, 'id'>) => void;
  updatePagoMensual: (id: string, pago: Partial<PagoMensual>) => void;
  deletePagoMensual: (id: string) => void;
  // Cartera
  addCartera: (cartera: Omit<Cartera, 'id'>) => void;
  updateCartera: (id: string, cartera: Partial<Cartera>) => void;
  deleteCartera: (id: string) => void;
  // Attendance
  addAttendance: (attendance: Omit<Attendance, 'id'>) => void;
  updateAttendance: (id: string, attendance: Partial<Attendance>) => void;
  deleteAttendance: (id: string) => void;
  // Jersey Orders
  addJerseyOrder: (order: Omit<JerseyOrder, 'id'>) => void;
  updateJerseyOrder: (id: string, order: Partial<JerseyOrder>) => void;
  deleteJerseyOrder: (id: string) => void;
  // Jersey Inventory
  addInventarioJersey: (inventario: Omit<InventarioJersey, 'id'>) => void;
  updateInventarioJersey: (id: string, inventario: Partial<InventarioJersey>) => void;
  deleteInventarioJersey: (id: string) => void;
  // Lockers
  addLocker: (locker: Omit<Locker, 'id'>) => void;
  updateLocker: (id: string, locker: Partial<Locker>) => void;
  deleteLocker: (id: string) => void;
  // Health Policies
  addHealthPolicy: (policy: Omit<HealthPolicy, 'id'>) => void;
  updateHealthPolicy: (id: string, policy: Partial<HealthPolicy>) => void;
  deleteHealthPolicy: (id: string) => void;
  // Compras
  addCompra: (compra: Omit<Compra, 'id'>) => void;
  updateCompra: (id: string, compra: Partial<Compra>) => void;
  deleteCompra: (id: string) => void;
  // Facturas
  addFactura: (factura: Omit<Factura, 'id'>) => void;
  updateFactura: (id: string, factura: Partial<Factura>) => void;
  deleteFactura: (id: string) => void;
  // Detalle Factura
  addDetalleFactura: (detalle: Omit<DetalleFactura, 'idFactura' | 'nroLinea'>) => void;
  deleteDetalleFactura: (idFactura: string, nroLinea: number) => void;
  // Reset
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
  periodos: 'clubfinance_periodos',
  configMensualidad: 'clubfinance_configMensualidad',
  detalleTransacciones: 'clubfinance_detalleTransacciones',
  pagosMensuales: 'clubfinance_pagosMensuales',
  cartera: 'clubfinance_cartera',
  asistencia: 'clubfinance_asistencia',
  jerseyOrders: 'clubfinance_jerseyOrders',
  inventarioJersey: 'clubfinance_inventarioJersey',
  lockers: 'clubfinance_lockers',
  healthPolicies: 'clubfinance_healthPolicies',
  compras: 'clubfinance_compras',
  facturas: 'clubfinance_facturas',
  detalleFacturas: 'clubfinance_detalleFacturas',
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const getDefaultAppData = (): AppData => ({
  users: [],
  members: [],
  transactions: [],
  categories: [],
  fees: [],
  systemData: {
    clubName: 'Mi Club',
    taxId: '',
    address: '',
    phone: '',
    email: '',
    currency: 'COP',
    fiscalYear: new Date().getFullYear().toString(),
    diaVencimientoDefault: 15,
    porcentajeMora: 10,
  },
  periodos: [],
  configMensualidad: [],
  detalleTransacciones: [],
  pagosMensuales: [],
  cartera: [],
  asistencia: [],
  jerseyOrders: [],
  inventarioJersey: [],
  lockers: [],
  healthPolicies: [],
  compras: [],
  facturas: [],
  detalleFacturas: [],
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => {
    try {
      const initialData = getInitialData();
      const storedData = getDefaultAppData();

      // Load all data from localStorage
      for (const key of Object.keys(STORAGE_KEYS)) {
        const stored = localStorage.getItem(STORAGE_KEYS[key as keyof typeof STORAGE_KEYS]);
        if (stored) {
          try {
            (storedData as any)[key] = JSON.parse(stored);
          } catch {
            // Keep default if parse fails
          }
        }
      }

      // Merge with initial data if empty
      if (storedData.users.length === 0) storedData.users = initialData.users;
      if (storedData.members.length === 0) storedData.members = initialData.members;
      if (storedData.categories.length === 0) storedData.categories = initialData.categories;
      if (storedData.transactions.length === 0) storedData.transactions = initialData.transactions;
      if (storedData.fees.length === 0) storedData.fees = initialData.fees;
      if (!storedData.systemData.clubName) storedData.systemData = initialData.systemData;

      return storedData;
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      return getInitialData();
    }
  });

  // useEffects for persistence
  useEffect(() => localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(data.users)), [data.users]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.members, JSON.stringify(data.members)), [data.members]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(data.transactions)), [data.transactions]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(data.categories)), [data.categories]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.fees, JSON.stringify(data.fees)), [data.fees]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.systemData, JSON.stringify(data.systemData)), [data.systemData]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.periodos, JSON.stringify(data.periodos)), [data.periodos]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.configMensualidad, JSON.stringify(data.configMensualidad)), [data.configMensualidad]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.detalleTransacciones, JSON.stringify(data.detalleTransacciones)), [data.detalleTransacciones]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.pagosMensuales, JSON.stringify(data.pagosMensuales)), [data.pagosMensuales]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.cartera, JSON.stringify(data.cartera)), [data.cartera]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.asistencia, JSON.stringify(data.asistencia)), [data.asistencia]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.jerseyOrders, JSON.stringify(data.jerseyOrders)), [data.jerseyOrders]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.inventarioJersey, JSON.stringify(data.inventarioJersey)), [data.inventarioJersey]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.lockers, JSON.stringify(data.lockers)), [data.lockers]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.healthPolicies, JSON.stringify(data.healthPolicies)), [data.healthPolicies]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.compras, JSON.stringify(data.compras)), [data.compras]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.facturas, JSON.stringify(data.facturas)), [data.facturas]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.detalleFacturas, JSON.stringify(data.detalleFacturas)), [data.detalleFacturas]);

  // User operations
  const addUser = (user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = { ...user, id: generateId(), createdAt: new Date().toISOString() };
    setData(prev => ({ ...prev, users: [...prev.users, newUser] }));
  };
  const updateUser = (id: string, updatedUser: Partial<User>) => {
    setData(prev => ({ ...prev, users: prev.users.map(u => u.id === id ? { ...u, ...updatedUser } : u) }));
  };
  const deleteUser = (id: string) => {
    setData(prev => ({ ...prev, users: prev.users.filter(u => u.id !== id) }));
  };

  // Member operations
  const addMember = (member: Omit<Member, 'id'>) => {
    const newMember: Member = { ...member, id: generateId() };
    setData(prev => ({ ...prev, members: [...prev.members, newMember] }));
  };
  const updateMember = (id: string, updatedMember: Partial<Member>) => {
    setData(prev => ({ ...prev, members: prev.members.map(m => m.id === id ? { ...m, ...updatedMember } : m) }));
  };
  const deleteMember = (id: string) => {
    setData(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id) }));
  };

  // Transaction operations
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = { ...transaction, id: generateId() };
    setData(prev => ({ ...prev, transactions: [...prev.transactions, newTransaction] }));
  };
  const updateTransaction = (id: string, updatedTransaction: Partial<Transaction>) => {
    setData(prev => ({ ...prev, transactions: prev.transactions.map(t => t.id === id ? { ...t, ...updatedTransaction } : t) }));
  };
  const deleteTransaction = (id: string) => {
    setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
  };

  // Category operations
  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = { ...category, id: generateId() };
    setData(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
  };
  const updateCategory = (id: string, updatedCategory: Partial<Category>) => {
    setData(prev => ({ ...prev, categories: prev.categories.map(c => c.id === id ? { ...c, ...updatedCategory } : c) }));
  };
  const deleteCategory = (id: string) => {
    setData(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }));
  };

  // Fee operations (legacy)
  const addFee = (fee: Omit<Fee, 'id'>) => {
    const newFee: Fee = { ...fee, id: generateId() };
    setData(prev => ({ ...prev, fees: [...prev.fees, newFee] }));
  };
  const updateFee = (id: string, updatedFee: Partial<Fee>) => {
    setData(prev => ({ ...prev, fees: prev.fees.map(f => f.id === id ? { ...f, ...updatedFee } : f) }));
  };
  const deleteFee = (id: string) => {
    setData(prev => ({ ...prev, fees: prev.fees.filter(f => f.id !== id) }));
  };

  // System data
  const updateSystemData = (updatedData: Partial<SystemData>) => {
    setData(prev => ({ ...prev, systemData: { ...prev.systemData, ...updatedData } }));
  };

  // Periodo operations
  const addPeriodo = (periodo: Omit<Periodo, 'id'>) => {
    const newPeriodo: Periodo = { ...periodo, id: generateId() };
    setData(prev => ({ ...prev, periodos: [...prev.periodos, newPeriodo] }));
  };
  const updatePeriodo = (id: string, updated: Partial<Periodo>) => {
    setData(prev => ({ ...prev, periodos: prev.periodos.map(p => p.id === id ? { ...p, ...updated } : p) }));
  };
  const deletePeriodo = (id: string) => {
    setData(prev => ({ ...prev, periodos: prev.periodos.filter(p => p.id !== id) }));
  };

  // Config Mensualidad operations
  const addConfigMensualidad = (config: Omit<ConfigMensualidad, 'id'>) => {
    const newConfig: ConfigMensualidad = { ...config, id: generateId() };
    setData(prev => ({ ...prev, configMensualidad: [...prev.configMensualidad, newConfig] }));
  };
  const updateConfigMensualidad = (id: string, updated: Partial<ConfigMensualidad>) => {
    setData(prev => ({ ...prev, configMensualidad: prev.configMensualidad.map(c => c.id === id ? { ...c, ...updated } : c) }));
  };
  const deleteConfigMensualidad = (id: string) => {
    setData(prev => ({ ...prev, configMensualidad: prev.configMensualidad.filter(c => c.id !== id) }));
  };

  // Detalle Transaccion operations
  const addDetalleTransaccion = (detalle: Omit<DetalleTransaccion, 'id'>) => {
    const newDetalle: DetalleTransaccion = { ...detalle, id: generateId() };
    setData(prev => ({ ...prev, detalleTransacciones: [...prev.detalleTransacciones, newDetalle] }));
  };
  const updateDetalleTransaccion = (id: string, updated: Partial<DetalleTransaccion>) => {
    setData(prev => ({ ...prev, detalleTransacciones: prev.detalleTransacciones.map(d => d.id === id ? { ...d, ...updated } : d) }));
  };
  const deleteDetalleTransaccion = (id: string) => {
    setData(prev => ({ ...prev, detalleTransacciones: prev.detalleTransacciones.filter(d => d.id !== id) }));
  };

  // Pago Mensual operations
  const addPagoMensual = (pago: Omit<PagoMensual, 'id'>) => {
    const newPago: PagoMensual = { ...pago, id: generateId() };
    setData(prev => ({ ...prev, pagosMensuales: [...prev.pagosMensuales, newPago] }));
  };
  const updatePagoMensual = (id: string, updated: Partial<PagoMensual>) => {
    setData(prev => ({ ...prev, pagosMensuales: prev.pagosMensuales.map(p => p.id === id ? { ...p, ...updated } : p) }));
  };
  const deletePagoMensual = (id: string) => {
    setData(prev => ({ ...prev, pagosMensuales: prev.pagosMensuales.filter(p => p.id !== id) }));
  };

  // Cartera operations
  const addCartera = (cartera: Omit<Cartera, 'id'>) => {
    const newCartera: Cartera = { ...cartera, id: generateId() };
    setData(prev => ({ ...prev, cartera: [...prev.cartera, newCartera] }));
  };
  const updateCartera = (id: string, updated: Partial<Cartera>) => {
    setData(prev => ({ ...prev, cartera: prev.cartera.map(c => c.id === id ? { ...c, ...updated } : c) }));
  };
  const deleteCartera = (id: string) => {
    setData(prev => ({ ...prev, cartera: prev.cartera.filter(c => c.id !== id) }));
  };

  // Attendance operations
  const addAttendance = (attendance: Omit<Attendance, 'id'>) => {
    const newAttendance: Attendance = { ...attendance, id: generateId() };
    setData(prev => ({ ...prev, asistencia: [...prev.asistencia, newAttendance] }));
  };
  const updateAttendance = (id: string, updated: Partial<Attendance>) => {
    setData(prev => ({ ...prev, asistencia: prev.asistencia.map(a => a.id === id ? { ...a, ...updated } : a) }));
  };
  const deleteAttendance = (id: string) => {
    setData(prev => ({ ...prev, asistencia: prev.asistencia.filter(a => a.id !== id) }));
  };

  // Jersey Order operations
  const addJerseyOrder = (order: Omit<JerseyOrder, 'id'>) => {
    const newOrder: JerseyOrder = { ...order, id: generateId() };
    setData(prev => ({ ...prev, jerseyOrders: [...prev.jerseyOrders, newOrder] }));
  };
  const updateJerseyOrder = (id: string, updated: Partial<JerseyOrder>) => {
    setData(prev => ({ ...prev, jerseyOrders: prev.jerseyOrders.map(o => o.id === id ? { ...o, ...updated } : o) }));
  };
  const deleteJerseyOrder = (id: string) => {
    setData(prev => ({ ...prev, jerseyOrders: prev.jerseyOrders.filter(o => o.id !== id) }));
  };

  // Jersey Inventory operations
  const addInventarioJersey = (inventario: Omit<InventarioJersey, 'id'>) => {
    const newInventario: InventarioJersey = { ...inventario, id: generateId() };
    setData(prev => ({ ...prev, inventarioJersey: [...prev.inventarioJersey, newInventario] }));
  };
  const updateInventarioJersey = (id: string, updated: Partial<InventarioJersey>) => {
    setData(prev => ({ ...prev, inventarioJersey: prev.inventarioJersey.map(i => i.id === id ? { ...i, ...updated } : i) }));
  };
  const deleteInventarioJersey = (id: string) => {
    setData(prev => ({ ...prev, inventarioJersey: prev.inventarioJersey.filter(i => i.id !== id) }));
  };

  // Locker operations
  const addLocker = (locker: Omit<Locker, 'id'>) => {
    const newLocker: Locker = { ...locker, id: generateId() };
    setData(prev => ({ ...prev, lockers: [...prev.lockers, newLocker] }));
  };
  const updateLocker = (id: string, updated: Partial<Locker>) => {
    setData(prev => ({ ...prev, lockers: prev.lockers.map(l => l.id === id ? { ...l, ...updated } : l) }));
  };
  const deleteLocker = (id: string) => {
    setData(prev => ({ ...prev, lockers: prev.lockers.filter(l => l.id !== id) }));
  };

  // Health Policy operations
  const addHealthPolicy = (policy: Omit<HealthPolicy, 'id'>) => {
    const newPolicy: HealthPolicy = { ...policy, id: generateId() };
    setData(prev => ({ ...prev, healthPolicies: [...prev.healthPolicies, newPolicy] }));
  };
  const updateHealthPolicy = (id: string, updated: Partial<HealthPolicy>) => {
    setData(prev => ({ ...prev, healthPolicies: prev.healthPolicies.map(p => p.id === id ? { ...p, ...updated } : p) }));
  };
  const deleteHealthPolicy = (id: string) => {
    setData(prev => ({ ...prev, healthPolicies: prev.healthPolicies.filter(p => p.id !== id) }));
  };

  // Compra operations
  const addCompra = (compra: Omit<Compra, 'id'>) => {
    const newCompra: Compra = { ...compra, id: generateId() };
    setData(prev => ({ ...prev, compras: [...prev.compras, newCompra] }));
  };
  const updateCompra = (id: string, updated: Partial<Compra>) => {
    setData(prev => ({ ...prev, compras: prev.compras.map(c => c.id === id ? { ...c, ...updated } : c) }));
  };
  const deleteCompra = (id: string) => {
    setData(prev => ({ ...prev, compras: prev.compras.filter(c => c.id !== id) }));
  };

  // Factura operations
  const addFactura = (factura: Omit<Factura, 'id'>) => {
    const newFactura: Factura = { ...factura, id: generateId() };
    setData(prev => ({ ...prev, facturas: [...prev.facturas, newFactura] }));
  };
  const updateFactura = (id: string, updated: Partial<Factura>) => {
    setData(prev => ({ ...prev, facturas: prev.facturas.map(f => f.id === id ? { ...f, ...updated } : f) }));
  };
  const deleteFactura = (id: string) => {
    setData(prev => ({ ...prev, facturas: prev.facturas.filter(f => f.id !== id) }));
  };

  // Detalle Factura operations
  const addDetalleFactura = (detalle: Omit<DetalleFactura, 'idFactura' | 'nroLinea'>) => {
    const idFactura = generateId();
    const nroLinea = data.detalleFacturas.filter(df => df.idFactura === idFactura).length + 1;
    const newDetalle: DetalleFactura = { ...detalle, idFactura, nroLinea };
    setData(prev => ({ ...prev, detalleFacturas: [...prev.detalleFacturas, newDetalle] }));
  };
  const deleteDetalleFactura = (idFactura: string, nroLinea: number) => {
    setData(prev => ({ ...prev, detalleFacturas: prev.detalleFacturas.filter(df => !(df.idFactura === idFactura && df.nroLinea === nroLinea)) }));
  };

  // Reset
  const resetAllData = () => {
    const initialData = getInitialData();
    setData({ ...getDefaultAppData(), ...initialData });
  };

  const value: DataContextType = {
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
    addPeriodo,
    updatePeriodo,
    deletePeriodo,
    addConfigMensualidad,
    updateConfigMensualidad,
    deleteConfigMensualidad,
    addDetalleTransaccion,
    updateDetalleTransaccion,
    deleteDetalleTransaccion,
    addPagoMensual,
    updatePagoMensual,
    deletePagoMensual,
    addCartera,
    updateCartera,
    deleteCartera,
    addAttendance,
    updateAttendance,
    deleteAttendance,
    addJerseyOrder,
    updateJerseyOrder,
    deleteJerseyOrder,
    addInventarioJersey,
    updateInventarioJersey,
    deleteInventarioJersey,
    addLocker,
    updateLocker,
    deleteLocker,
    addHealthPolicy,
    updateHealthPolicy,
    deleteHealthPolicy,
    addCompra,
    updateCompra,
    deleteCompra,
    addFactura,
    updateFactura,
    deleteFactura,
    addDetalleFactura,
    deleteDetalleFactura,
    resetAllData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData debe usarse dentro de DataProvider');
  }
  return context;
}
