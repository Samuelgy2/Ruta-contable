// Tipos y interfaces centralizados del sistema

// =====================================================
// ENUMS
// =====================================================

export type UserRole = 'user' | 'admin' | 'tesorero' | 'secretario' | 'entrenador';
export type DocumentType = 'CC' | 'TI' | 'CE' | 'PAS';
export type MembershipType = 'Completa' | 'Básica' | 'Premium' | 'Honoraria';
export type MemberStatus = 'activo' | 'inactivo' | 'suspendido';
export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque';
export type PaymentStatus = 'pendiente' | 'pagado' | 'moroso' | 'exento' | 'cancelado';
export type FeeStatus = 'pending' | 'paid' | 'overdue';
export type AttendanceStatus = 'Presente' | 'Ausente' | 'Justificado' | 'Tarde';
export type JerseyOrderStatus = 'Solicitado' | 'En producción' | 'Listo' | 'Entregado' | 'Cancelado';
export type JerseyType = 'Jersey' | 'Short' | 'Medias' | 'Chaqueta';
export type LockerStatus = 'Asignado' | 'Pagado' | 'Vencido' | 'Liberado';
export type HealthPolicyType = 'Básica' | 'Premium' | 'Familiar';
export type HealthPolicyStatus = 'Activa' | 'Vencida' | 'Cancelada';
export type InvoiceStatus = 'Pendiente' | 'Pagada' | 'Anulada';
export type CarteraStatus = 'pendiente' | 'pagado' | 'anulado';

// =====================================================
// USER & AUTH
// =====================================================

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  fullName: string;
  email: string;
  active: boolean;
  lastLogin?: string;
  createdAt: string;
}

// =====================================================
// MEMBERS (SOCIO)
// =====================================================

export interface Member {
  id: string;
  name: string;
  documento: string;
  tipoDocumento: DocumentType;
  email: string;
  phone: string;
  direccion?: string;
  fechaNacimiento?: string;
  joinDate: string;
  membershipType: string;
  estado: MemberStatus;
  foto?: string;
  observaciones?: string;
  createdBy?: string;
  active: boolean;
}

// =====================================================
// CATEGORIES
// =====================================================

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  description: string;
  active: boolean;
}

// =====================================================
// PERIODS (MESES_PERIODO)
// =====================================================

export interface Periodo {
  id: string;
  anio: number;
  mes: number;
  nombreMes: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  cerrado: boolean;
  fechaCierre?: string;
  observaciones?: string;
  cerradoBy?: string;
}

// =====================================================
// MONTHLY FEE CONFIG (CONFIG_MENSUALIDAD)
// =====================================================

export interface ConfigMensualidad {
  id: string;
  anio: number;
  valorMensual: number;
  fechaVencimientoDefault: number;
  activo: boolean;
  observaciones?: string;
  createdBy?: string;
}

// =====================================================
// TRANSACTIONS (TRANSACCION_FIN)
// =====================================================

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  categoryId?: string;
  description: string;
  referencia?: string;
  metodoPago: PaymentMethod;
  date: string;
  createdBy: string;
  memberId?: string;
}

// =====================================================
// TRANSACTION DETAIL (DETALLE_TRANSACCION)
// =====================================================

export interface DetalleTransaccion {
  id: string;
  idTransaccion: string;
  idSocio: string;
  monto: number;
  concepto: string;
}

// =====================================================
// MONTHLY PAYMENTS (PAGO_MENSUAL)
// =====================================================

export interface PagoMensual {
  id: string;
  idSocio: string;
  idPeriodo: string;
  valor: number;
  fechaVencimiento: string;
  fechaPago?: string;
  estado: PaymentStatus;
  idTransaccion?: string;
  diasMora: number;
  observaciones?: string;
}

// =====================================================
// CARTERA (Late fees and debt)
// =====================================================

export interface Cartera {
  id: string;
  idSocio: string;
  idPagoMensual?: string;
  fecha: string;
  concepto: string;
  valor: number;
  estado: CarteraStatus;
  fechaPago?: string;
  idTransaccion?: string;
  observaciones?: string;
}

// =====================================================
// ATTENDANCE (ASISTENCIA)
// =====================================================

export interface Attendance {
  id: string;
  idSocio: string;
  fecha: string;
  tipoEntrenamiento?: string;
  estado: AttendanceStatus;
  observacion?: string;
  registradoBy?: string;
}

// =====================================================
// JERSEY ORDERS (PEDIDO_JERSEY)
// =====================================================

export interface JerseyOrder {
  id: string;
  idSocio: string;
  fecha: string;
  tipo: JerseyType;
  talla?: string;
  aplica?: string;
  valor: number;
  estado: JerseyOrderStatus;
  fechaEntrega?: string;
  observaciones?: string;
}

// =====================================================
// JERSEY INVENTORY (INVENTARIO_JERSEY)
// =====================================================

export interface InventarioJersey {
  id: string;
  idPedido: string;
  nroItem: number;
  estadoEntrega: 'Pendiente' | 'Entregado' | 'Devuelto';
  fechaEntrega?: string;
  recibidoBy?: string;
  observaciones?: string;
}

// =====================================================
// LOCKERS (CAMERINO)
// =====================================================

export interface Locker {
  id: string;
  idSocio: string;
  numeroCamerino: string;
  anio: number;
  valor: number;
  fechaAsignacion: string;
  fechaPago?: string;
  estado: LockerStatus;
  idTransaccion?: string;
  observaciones?: string;
}

// =====================================================
// HEALTH POLICY (POLIZA_SALUD)
// =====================================================

export interface HealthPolicy {
  id: string;
  idSocio: string;
  tipo: HealthPolicyType;
  numeroPoliza?: string;
  fechaContratacion: string;
  fechaVencimiento: string;
  fechaPago?: string;
  valor: number;
  estado: HealthPolicyStatus;
  idTransaccion?: string;
  observaciones?: string;
}

// =====================================================
// PURCHASES (COMPRA)
// =====================================================

export interface Compra {
  id: string;
  concepto: string;
  tipo?: string;
  cantidad: number;
  valorUnitario: number;
  valorTotal: number;
  fecha: string;
  proveedor?: string;
  factura?: string;
  categoriaId?: string;
  idTransaccion?: string;
  observaciones?: string;
  createdBy?: string;
}

// =====================================================
// INVOICES (FACTURA)
// =====================================================

export interface Factura {
  id: string;
  fecha: string;
  concepto: string;
  valorTotal: number;
  proveedor?: string;
  nitProveedor?: string;
  numeroFactura?: string;
  fechaRecepcion?: string;
  estado: InvoiceStatus;
  idCompra?: string;
  idTransaccion?: string;
  observaciones?: string;
  createdBy?: string;
}

// =====================================================
// INVOICE DETAILS (DETALLE_FACTURA)
// =====================================================

export interface DetalleFactura {
  idFactura: string;
  nroLinea: number;
  servicio: string;
  descripcion?: string;
  cantidad: number;
  valorUnitario: number;
  valorTotal: number;
  iva: number;
  descuento: number;
  observaciones?: string;
}

// =====================================================
// SYSTEM DATA
// =====================================================

export interface SystemData {
  clubName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  fiscalYear: string;
  logoUrl?: string;
  diaVencimientoDefault: number;
  porcentajeMora: number;
}

// =====================================================
// APP DATA
// =====================================================

export interface AppData {
  users: User[];
  members: Member[];
  transactions: Transaction[];
  categories: Category[];
  fees: Fee[];
  systemData: SystemData;
  // New tables
  periodos: Periodo[];
  configMensualidad: ConfigMensualidad[];
  detalleTransacciones: DetalleTransaccion[];
  pagosMensuales: PagoMensual[];
  cartera: Cartera[];
  asistencia: Attendance[];
  jerseyOrders: JerseyOrder[];
  inventarioJersey: InventarioJersey[];
  lockers: Locker[];
  healthPolicies: HealthPolicy[];
  compras: Compra[];
  facturas: Factura[];
  detalleFacturas: DetalleFactura[];
}

// Legacy support
export interface Fee {
  id: string;
  memberId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  transactionId?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
}
