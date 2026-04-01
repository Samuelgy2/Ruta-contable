# Ruta contable - Documentación Completa del Código

## Descripción General

Ruta contable es una aplicación web full-stack para gestión financiera diseñada específicamente para clubes y organizaciones. Construida con una arquitectura moderna de tres capas:

- **Frontend**: React 18, TypeScript y Tailwind CSS con arquitectura basada en características
- **Backend**: Node.js con Express para API REST
- **Base de Datos**: PostgreSQL para persistencia de datos

---

## Tabla de Contenidos

1. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
2. [Módulos Principales](#módulos-principales)
3. [Componentes](#componentes)
4. [Contextos y Gestión de Estado](#contextos-y-gestión-de-estado)
5. [Utilidades](#utilidades)
6. [Tipos e Interfaces](#tipos-e-interfaces)
7. [Flujo de Datos](#flujo-de-datos)
8. [Características](#características)
9. [Consideraciones de Seguridad](#consideraciones-de-seguridad)
10. [Referencia de API](#referencia-de-api)

---

## Arquitectura del Proyecto

El proyecto sigue una arquitectura full-stack de tres capas:

```
Ruta contable/
├── frontend/                    # Aplicación React (Cliente)
│   ├── src/
│   │   ├── App.tsx              # Componente raíz de la aplicación
│   │   ├── main.tsx             # Punto de entrada de la aplicación
│   │   ├── index.css            # Estilos globales
│   │   ├── vite-env.d.ts        # Tipos de Vite
│   │   ├── types/               # Definiciones de tipos TypeScript
│   │   │   └── index.ts         # Tipos centralizados
│   │   ├── contexts/            # Contextos de React
│   │   │   └── DataContext.tsx  # Estado de datos de la aplicación
│   │   ├── features/            # Módulos basados en características
│   │   │   ├── auth/            # Autenticación
│   │   │   │   ├── index.ts     # Exportaciones del módulo
│   │   │   │   ├── components/  # LoginForm, RegisterForm
│   │   │   │   ├── contexts/    # AuthContext
│   │   │   │   └── pages/       # Login, Register, ForgotPassword
│   │   │   ├── landing/         # Página pública
│   │   │   │   └── components/  # Navbar, Footer, Hero
│   │   │   └── admin/           # Panel de administración
│   │   │       ├── index.ts     # Exportaciones del módulo
│   │   │       └── components/  # AdminLayout
│   │   ├── pages/               # Componentes de página
│   │   │   ├── admin/           # Páginas del admin
│   │   │   │   ├── AdminCategories.tsx
│   │   │   │   ├── AdminClubData.tsx
│   │   │   │   ├── AdminMembers.tsx
│   │   │   │   ├── AdminOverview.tsx
│   │   │   │   ├── AdminReports.tsx
│   │   │   │   ├── AdminSystem.tsx
│   │   │   │   ├── AdminTransactions.tsx
│   │   │   │   ├── AdminUsers.tsx
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── hooks/               # Hooks personalizados de React
│   │   │   ├── useStats.ts      # Cálculos de estadísticas
│   │   │   └── useCrudState.ts  # Estado CRUD
│   │   ├── components/          # Componentes de UI
│   │   │   ├── common/          # Componentes comunes
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Logo.tsx
│   │   │   │   └── StatCard.tsx
│   │   │   ├── crud/            # Componentes CRUD
│   │   │   │   ├── CrudManager.tsx
│   │   │   │   ├── EntityForm.tsx
│   │   │   │   ├── EntityTable.tsx
│   │   │   │   └── index.ts
│   │   │   └── ui/              # Componentes shadcn/ui (45+ componentes)
│   │   ├── shared/              # Código compartido/reutilizable
│   │   │   ├── components/
│   │   │   │   ├── Logo.tsx
│   │   │   │   └── ImageWithFallback.tsx
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── config/              # Configuración de entidades
│   │   │   └── entities/
│   │   │       ├── categories.config.ts
│   │   │       ├── members.config.ts
│   │   │       ├── transactions.config.ts
│   │   │       ├── users.config.ts
│   │   │       └── index.ts
│   │   ├── utils/               # Funciones utilitarias
│   │   │   ├── format.ts
│   │   │   ├── export.tsx
│   │   │   ├── initialData.ts
│   │   │   ├── pdfDocuments.tsx
│   │   │   └── validation.ts
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── images/
│   │   │   └── logo/
│   │   └── guidelines/
│   │       └── Guidelines.md
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── backend/                     # API REST (Servidor)
│   ├── src/
│   │   ├── index.js             # Punto de entrada del servidor
│   │   ├── config/
│   │   │   └── database.js      # Configuración de base de datos
│   │   ├── controllers/         # Controladores de rutas
│   │   ├── middlewares/         # Middlewares de Express
│   │   ├── models/              # Modelos de datos
│   │   ├── routes/              # Definición de rutas API
│   │   ├── services/            # Lógica de negocio
│   │   ├── database/            # Scripts de base de datos
│   │   └── utils/               # Utilidades del backend
│   ├── BD/                      # Configuración de PostgreSQL
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── database.js  # Configuración de conexión
│   │   │   │   └── server.js    # Configuración del servidor
│   │   │   └── models/
│   │   │       └── user.js      # Modelo de usuario
│   │   ├── POSTGRESQL_CONFIG.md # Documentación de PostgreSQL
│   │   └── README.md            # Documentación del backend
│   ├── package.json
│   └── .env                     # Variables de entorno
│
├── build/                       # Build de producción del frontend
│   ├── index.html
│   └── assets/
│
├── README.md                    # Documentación principal
└── .npmrc                       # Configuración de npm
```

---

## Módulos Principales

### Frontend (React + TypeScript)

#### Punto de Entrada ([`frontend/src/main.tsx`](frontend/src/main.tsx:1))

Punto de entrada de la aplicación que renderiza React en el DOM.

```typescript
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

#### App Raíz ([`frontend/src/App.tsx`](frontend/src/App.tsx:1))

Componente raíz que configura los proveedores y maneja la lógica de enrutamiento.

**Características Clave:**
- Envuelve la aplicación con `AuthProvider` y `DataProvider`
- Maneja el estado de autenticación
- Dirige a las páginas según el rol del usuario
- Se comunica con el backend a través de servicios API

```typescript
function AppContent() {
  const { isAuthenticated, currentUser, register } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');

  if (isAuthenticated) {
    if (currentUser?.role === 'admin') {
      return <AdminPanel />;
    }
    return <UserDashboard />;
  }

  // Muestra páginas de login/register para usuarios no autenticados
}
```

### Backend (Node.js + Express)

#### Punto de Entrada del Servidor ([`backend/src/index.js`](backend/src/index.js:1))

Servidor Express que maneja las peticiones HTTP y la lógica de negocio.

**Características Clave:**
- Configuración de middleware (CORS, JSON parsing, etc.)
- Definición de rutas REST API
- Conexión a base de datos PostgreSQL
- Manejo de errores y validaciones

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Rutas de la API
app.use('/api/users', require('./routes/users'));
app.use('/api/members', require('./routes/members'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/categories', require('./routes/categories'));

app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000');
});
```

#### Configuración de Base de Datos ([`backend/src/config/database.js`](backend/src/config/database.js:1))

Configuración de la conexión a PostgreSQL usando pg-pool.

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

module.exports = pool;
```

### Base de Datos (PostgreSQL)

#### Configuración de PostgreSQL ([`backend/BD/src/config/database.js`](backend/BD/src/config/database.js:1))

Script de configuración y creación de tablas en PostgreSQL.

**Tablas Principales:**
- `users` - Usuarios del sistema
- `members` - Miembros del club
- `transactions` - Transacciones financieras
- `categories` - Categorías de transacciones
- `fees` - Cuotas de membresía
- `system_data` - Configuración del sistema

#### Modelo de Usuario ([`backend/BD/src/models/user.js`](backend/BD/src/models/user.js:1))

Modelo de datos para la tabla de usuarios con operaciones CRUD.

```javascript
const pool = require('../config/database');

const User = {
  async findAll() {
    const result = await pool.query('SELECT * FROM users');
    return result.rows;
  },
  
  async findById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  },
  
  async create(userData) {
    const { username, password, role, fullName, email } = userData;
    const result = await pool.query(
      'INSERT INTO users (username, password, role, full_name, email) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [username, password, role, fullName, email]
    );
    return result.rows[0];
  },
  
  async update(id, userData) {
    const { username, password, role, fullName, email, active } = userData;
    const result = await pool.query(
      'UPDATE users SET username=$1, password=$2, role=$3, full_name=$4, email=$5, active=$6 WHERE id=$7 RETURNING *',
      [username, password, role, fullName, email, active, id]
    );
    return result.rows[0];
  },
  
  async delete(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }
};

module.exports = User;
```

---

## Componentes

### Componentes de Autenticación

#### LoginForm ([`frontend/src/features/auth/components/LoginForm.tsx`](frontend/src/features/auth/components/LoginForm.tsx:1))

Componente de formulario para autenticación de usuarios.

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `onNavigate` | `(page: 'home' \| 'login' \| 'register') => void` | Callback de navegación |

**Características:**
- Campos de nombre de usuario y contraseña
- Manejo y visualización de errores
- Credenciales de demostración mostradas debajo del formulario
- Usa el hook `useAuth` para autenticación
- Envía petición al backend para validación

**Estado:**
```typescript
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
```

#### RegisterForm ([`frontend/src/features/auth/components/RegisterForm.tsx`](frontend/src/features/auth/components/RegisterForm.tsx:1))

Componente de formulario para registro de usuarios con validación.

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `onNavigate` | `(page: 'home' \| 'login' \| 'register') => void` | Callback de navegación |
| `onRegister` | `(data: RegistrationData) => boolean` | Callback de registro |

**Reglas de Validación:**
- Nombre y apellido requeridos
- Formato de email válido
- Contraseña mínima de 6 caracteres
- Confirmación de contraseña debe coincidir

**Estado:**
```typescript
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}
```

### Componentes Comunes

#### Header ([`frontend/src/components/common/Header.tsx`](frontend/src/components/common/Header.tsx:1))

Muestra información del usuario y proporciona funcionalidad de cierre de sesión.

**Características:**
- Muestra el nombre completo del usuario actual
- Muestra insignia de rol (Administrador/Usuario)
- Botón de cierre de sesión
- Logo del club

```typescript
export function Header() {
  const { currentUser, logout } = useAuth();
  
  return (
    <div className="header">
      <div className="user-info">
        <span>{currentUser?.fullName}</span>
        <span className="badge">
          {currentUser?.role === 'admin' ? 'Administrador' : 'Usuario'}
        </span>
      </div>
      <div className="header-actions">
        <Logo />
        <button onClick={logout}>Cerrar Sesión</button>
      </div>
    </div>
  );
}
```

#### StatCard ([`frontend/src/components/common/StatCard.tsx`](frontend/src/components/common/StatCard.tsx:1))

Componente de tarjeta reutilizable para mostrar estadísticas.

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `title` | `string` | Título de la tarjeta |
| `value` | `string \| number` | Valor a mostrar |
| `description?` | `string` | Descripción opcional |
| `className?` | `'positive' \| 'negative' \| 'neutral'` | Tema de color |

#### Navbar ([`frontend/src/features/landing/components/Navbar.tsx`](frontend/src/features/landing/components/Navbar.tsx:1))

Barra de navegación para páginas públicas.

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `onNavigate` | `(page: 'home' \| 'login' \| 'register') => void` | Callback de navegación |

#### Footer ([`frontend/src/features/landing/components/Footer.tsx`](frontend/src/features/landing/components/Footer.tsx:1))

Pie de página con información de contacto y enlaces rápidos.

**Secciones:**
- Sobre Nosotros
- Información de Contacto
- Enlaces Rápidos
- Derechos de Autor

#### Logo ([`frontend/src/shared/components/Logo.tsx`](frontend/src/shared/components/Logo.tsx:1))

Muestra el logo del club con soporte de fallback.

**Props:**
| Prop | Tipo | Valor Predeterminado | Descripción |
|------|------|---------|-------------|
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Tamaño del logo |
| `className` | `string` | `''` | Clases CSS adicionales |
| `showPlaceholder` | `boolean` | `true` | Mostrar placeholder si falla la imagen |

**Características:**
- Usa `ImageWithFallback` para manejo de errores
- Clases de tamaño Tailwind CSS
- Visualización de placeholder cuando la imagen no está disponible

#### ImageWithFallback ([`frontend/src/shared/components/ImageWithFallback.tsx`](frontend/src/shared/components/ImageWithFallback.tsx:1))

Componente de imagen con fallback para imágenes rotas.

**Características:**
- Fallback automático si la imagen falla al cargar
- Placeholder SVG para imágenes fallidas
- Soporta todos los atributos estándar de img

---

## Contextos y Gestión de Estado

### AuthContext ([`frontend/src/features/auth/contexts/AuthContext.tsx`](frontend/src/features/auth/contexts/AuthContext.tsx:1))

Gestiona el estado de autenticación y sesiones de usuarios.

**Claves de Almacenamiento:**
- `clubfinance_auth` - Estado de auth actual (localStorage)
- `clubfinance_users` - Usuarios registrados (sincronizado con backend)

**Tipo de Contexto:**
```typescript
interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  register: (data: RegistrationData) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
}
```

**Métodos:**

| Método | Parámetros | Retorna | Descripción |
|--------|-----------|---------|-------------|
| `login` | `username: string, password: string` | `Promise<boolean>` | Autentica al usuario vía backend |
| `register` | `RegistrationData` | `Promise<boolean>` | Crea nuevo usuario vía backend |
| `logout` | Ninguno | `void` | Limpia la sesión |
| `isAdmin` | Ninguno | `boolean` | Verifica rol de administrador |

**Datos de Registro de Usuario:**
```typescript
interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
```

**Objeto de Usuario:**
```typescript
interface User {
  id: string;
  username: string;
  password: string;        // Hasheado en backend
  role: 'user' | 'admin';
  fullName: string;
  email: string;
  active: boolean;
  createdAt: string;
}
```

### DataContext ([`frontend/src/contexts/DataContext.tsx`](frontend/src/contexts/DataContext.tsx:1))

Gestiona todos los datos de la aplicación incluyendo usuarios, miembros, transacciones, categorías, cuotas y configuración del sistema.

**Claves de Almacenamiento:**
```typescript
const STORAGE_KEYS = {
  users: 'clubfinance_users',
  members: 'clubfinance_members',
  transactions: 'clubfinance_transactions',
  categories: 'clubfinance_categories',
  fees: 'clubfinance_fees',
  systemData: 'clubfinance_systemData',
};
```

**Tipo de Contexto:**
```typescript
interface DataContextType extends AppData {
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addMember: (member: Omit<Member, 'id'>) => Promise<void>;
  updateMember: (id: string, member: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addFee: (fee: Omit<Fee, 'id'>) => Promise<void>;
  updateFee: (id: string, fee: Partial<Fee>) => Promise<void>;
  deleteFee: (id: string) => Promise<void>;
  updateSystemData: (data: Partial<SystemData>) => Promise<void>;
  resetAllData: () => Promise<void>;
}
```

**Operaciones CRUD:**
Todos los métodos siguen el patrón de enviar petición HTTP al backend, actualizar el estado local y sincronizar con la base de datos PostgreSQL.

---

## Utilidades

### Hook useStats ([`frontend/src/hooks/useStats.ts`](frontend/src/hooks/useStats.ts:1))

Hook personalizado para calcular estadísticas de transacciones, cuotas y miembros.

**Uso:**
```typescript
const stats = useStats(transactions, fees, members);
```

**Retorna:**
```typescript
interface Stats {
  totalIncome: number;           // Suma de todas las transacciones de ingreso
  totalExpense: number;          // Suma de todas las transacciones de gasto
  balance: number;              // Balance total (ingresos - gastos)
  monthlyIncome: number;         // Ingresos del mes actual
  monthlyExpense: number;        // Gastos del mes actual
  monthlyBalance: number;        // Balance del mes actual
  activeMembers: number;        // Cantidad de miembros activos
  inactiveMembers: number;       // Cantidad de miembros inactivos
  totalMembers: number;         // Total de miembros
  paidFees: number;            // Cantidad de cuotas pagadas
  pendingFees: number;         // Cantidad de cuotas pendientes
  overdueFees: number;         // Cantidad de cuotas vencidas
  totalPaidAmount: number;     // Suma de cuotas pagadas
  totalPendingAmount: number;   // Suma de cuotas pendientes
  totalTransactions: number;    // Total de transacciones
}
```

### Hook useCrudState ([`frontend/src/hooks/useCrudState.ts`](frontend/src/hooks/useCrudState.ts:1))

Hook personalizado para manejar estado CRUD con sincronización backend.

**Uso:**
```typescript
const { data, loading, error, create, update, remove } = useCrudState('/api/users');
```

**Retorna:**
```typescript
interface CrudState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  create: (item: Omit<T, 'id'>) => Promise<void>;
  update: (id: string, item: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}
```

### Utilidades de Formato ([`frontend/src/utils/format.ts`](frontend/src/utils/format.ts:1))

| Función | Parámetros | Retorna | Descripción |
|----------|-----------|---------|-------------|
| `formatCurrency` | `amount: number, currency?: string` | `string` | Formatea moneda con símbolo |
| `formatDate` | `dateString: string` | `string` | Fecha completa |
| `formatDateShort` | `dateString: string` | `string` | Fecha corta |
| `formatDateTime` | `dateString: string` | `string` | Fecha y hora |
| `capitalizeFirst` | `str: string` | `string` | Mayúscula inicial |
| `getMonthName` | `monthIndex: number` | `string` | Nombre del mes en español |
| `truncateText` | `text: string, maxLength: number` | `string` | Trunca texto con puntos suspensivos |

**Ejemplos:**
```typescript
formatCurrency(1500, '$');      // "$1500.00"
formatDate('2024-01-15');       // "15 de enero de 2024"
formatDateShort('2024-01-15');  // "15/01/2024"
capitalizeFirst('hola');       // "Hola"
getMonthName(0);                // "Enero"
truncateText('Hola Mundo', 5);   // "Hola..."
```

### Utilidades de Exportación ([`frontend/src/utils/export.tsx`](frontend/src/utils/export.tsx:1))

| Función | Parámetros | Descripción |
|----------|-----------|-------------|
| `exportToCSV` | `data: any[], filename: string` | Exporta array a archivo CSV |
| `exportToJSON` | `data: any, filename: string` | Exporta objeto a archivo JSON |
| `exportTransactionsReport` | `transactions: Transaction[], systemData: SystemData` | Genera reporte de texto |
| `exportMembersWithFees` | `members: Member[], fees: Fee[]` | Exporta miembros con estado de cuotas |

**Helper Interno:**
```typescript
function downloadFile(content: string, filename: string, mimeType: string): void
```

### Utilidades de PDF ([`frontend/src/utils/pdfDocuments.tsx`](frontend/src/utils/pdfDocuments.tsx:1))

Genera documentos PDF para reportes y exportaciones.

| Función | Parámetros | Descripción |
|----------|-----------|-------------|
| `generateTransactionsPDF` | `transactions: Transaction[], systemData: SystemData` | Genera PDF de transacciones |
| `generateMembersPDF` | `members: Member[], fees: Fee[]` | Genera PDF de miembros |

### Datos Iniciales ([`frontend/src/utils/initialData.ts`](frontend/src/utils/initialData.ts:1))

Proporciona datos iniciales para nuevas instalaciones.

**Retorna objeto `AppData` con:**
- 2 usuarios por defecto (admin y usuario demo)
- 3 miembros de ejemplo
- 6 categorías (3 ingresos, 3 gastos)
- 5 transacciones de ejemplo
- 3 registros de cuotas
- Configuración predeterminada del sistema

---

## Tipos e Interfaces

### Tipos Principales ([`frontend/src/types/index.ts`](frontend/src/types/index.ts:1))

#### UserRole
```typescript
type UserRole = 'user' | 'admin';
```

#### User
```typescript
interface User {
  id: string;
  username: string;
  password: string;        // Hasheado en backend
  role: UserRole;
  fullName: string;
  email: string;
  active: boolean;
  createdAt: string;
}
```

#### Member
```typescript
interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  active: boolean;
  membershipType: string;  // 'Completa', 'Básica', 'Premium'
}
```

#### TransactionType
```typescript
type TransactionType = 'income' | 'expense';
```

#### Transaction
```typescript
interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;            // Formato ISO
  createdBy: string;        // ID del usuario que creó
  memberId?: string;        // Asociación opcional con miembro
}
```

#### Category
```typescript
interface Category {
  id: string;
  name: string;
  type: TransactionType;
  description: string;
  active: boolean;
}
```

#### Fee
```typescript
interface Fee {
  id: string;
  memberId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  transactionId?: string;
}
```

#### SystemData
```typescript
interface SystemData {
  clubName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  currency: string;       // Valor predeterminado: '$'
  fiscalYear: string;
}
```

#### AppData (Estado Completo)
```typescript
interface AppData {
  users: User[];
  members: Member[];
  transactions: Transaction[];
  categories: Category[];
  fees: Fee[];
  systemData: SystemData;
}
```

---

## Flujo de Datos

### Flujo de Autenticación (Frontend → Backend → Base de Datos)

```
Usuario ingresa credenciales en LoginForm
        ↓
LoginForm llama a useAuth().login()
        ↓
AuthContext envía petición POST a /api/auth/login
        ↓
Backend valida credenciales contra PostgreSQL
        ↓
Si es válido: Backend retorna JWT token
              → Frontend guarda token en localStorage
              → App redirige al panel
        ↓
Si es inválido: Backend retorna error 401
              → Frontend muestra mensaje de error
```

### Flujo de Gestión de Datos (Frontend → Backend → Base de Datos)

```
Acción de usuario (agregar/actualizar/eliminar)
        ↓
Componente llama método de DataContext
        ↓
DataContext envía petición HTTP al backend
  - POST /api/{resource} para crear
  - PUT /api/{resource}/:id para actualizar
  - DELETE /api/{resource}/:id para eliminar
        ↓
Backend recibe petición y valida datos
        ↓
Backend ejecuta query SQL en PostgreSQL
        ↓
Backend retorna respuesta al frontend
        ↓
DataContext actualiza estado local
        ↓
Todos los componentes suscritos se re-renderizan
```

### Flujo de Cálculo de Estadísticas

```
Componente solicita datos a DataContext
        ↓
DataContext obtiene datos del backend (GET /api/{resource})
        ↓
Backend consulta PostgreSQL y retorna datos
        ↓
DataContext pasa datos a useStats()
        ↓
useMemo calcula todas las estadísticas
        ↓
Retorna objeto Stats calculado
        ↓
Componente muestra StatCards
```

### Flujo de Persistencia de Datos

```
Frontend realiza operación CRUD
        ↓
Petición HTTP al backend (Express)
        ↓
Backend valida y procesa datos
        ↓
Query SQL ejecutada en PostgreSQL
        ↓
Base de datos almacena datos de forma persistente
        ↓
Respuesta enviada al frontend
        ↓
Frontend actualiza estado local
```

---

## Características

### Panel de Usuario ([`frontend/src/pages/admin/AdminOverview.tsx`](frontend/src/pages/admin/AdminOverview.tsx:1))

**Pestañas:**
1. **Transacciones** - Ver, filtrar y agregar transacciones
2. **Miembros** - Ver lista de miembros
3. **Reportes** - Resumen financiero

**Características:**
- CRUD de Transacciones (Crear, Leer)
- Filtrado por tipo (ingreso/gasto)
- Búsqueda por descripción o categoría
- Tarjetas de estadísticas (balance, ingresos, gastos, miembros)
- Resúmenes mensuales

**Campos del Formulario de Transacción:**
- Tipo (ingreso/gasto)
- Monto
- Categoría (filtrada por tipo)
- Fecha
- Descripción

### Panel de Administrador ([`frontend/src/pages/admin/AdminOverview.tsx`](frontend/src/pages/admin/AdminOverview.tsx:1))

**Pestañas:**
1. **Resumen** - Estadísticas del sistema e información
2. **Usuarios** - Gestión de usuarios (CRUD)
3. **Categorías** - Gestión de categorías (CRUD)
4. **Datos** - Exportación de datos del club
5. **Sistema** - Configuración y reinicio del sistema

**Gestión de Usuarios:**
- Crear nuevos usuarios
- Editar usuarios existentes
- Cambiar roles (usuario/admin)
- Activar/desactivar usuarios
- Eliminar usuarios

**Gestión de Categorías:**
- Crear categorías (ingreso/gasto)
- Editar categorías
- Activar/desactivar categorías
- Eliminar categorías

**Opciones de Exportación:**
- Transacciones a CSV
- Miembros con cuotas a CSV
- Reporte financiero (texto)
- Respaldo completo (JSON)

**Acciones del Sistema:**
- Reiniciar todos los datos a estado inicial (con confirmación)

---

## Consideraciones de Seguridad

⚠️ **IMPORTANTE**: Esta aplicación tiene varias limitaciones de seguridad que deben ser addressadas antes de producción.

### Estado Actual de Seguridad

**✅ Implementado:**
- Backend con Express para validación del servidor
- Base de datos PostgreSQL para persistencia segura
- Separación de frontend y backend
- API REST con rutas protegidas

**⚠️ Limitaciones Actuales:**

1. **Almacenamiento de Contraseñas**: Contraseñas pueden estar en texto plano
   - **Riesgo**: Acceso no autorizado a cuentas de usuario
   - **Solución**: Implementar hashing bcrypt/argon2 en el backend

2. **Sin HTTPS en Desarrollo**: Transmisión de datos no encriptada en local
   - **Riesgo**: Ataques man-in-the-middle en producción
   - **Solución**: Desplegar con HTTPS y certificados SSL

3. **Autenticación Básica**: Sistema de autenticación simple
   - **Riesgo**: Ataques de fuerza bruta, credential stuffing
   - **Solución**: Implementar JWT con refresh tokens, rate limiting, CAPTCHA

4. **Sin Protección CSRF**: Falta protección contra ataques CSRF
   - **Riesgo**: Solicitudes maliciosas desde otros sitios
   - **Solución**: Implementar tokens CSRF

5. **Sin Sanitización de Entradas**: Validación limitada de datos
   - **Riesgo**: Inyección SQL, XSS
   - **Solución**: Sanitizar todas las entradas en el backend

### Credenciales de Demostración

| Rol | Nombre de Usuario | Contraseña |
|------|----------|----------|
| Admin | admin | admin123 |
| Usuario | usuario | usuario123 |

### Arquitectura de Seguridad

```
Frontend (React)
    ↓
HTTPS (en producción)
    ↓
Backend (Express)
    ↓
Validación y Sanitización
    ↓
PostgreSQL (con parámetros preparados)
```

---

## Referencia de API

### Hooks de Contexto

#### useAuth()
```typescript
const {
  isAuthenticated: boolean;  // Si el usuario ha iniciado sesión
  currentUser: User | null; // Objeto de usuario actual
  login: (username, password) => Promise<boolean>;  // Autentica vía backend
  register: (data) => Promise<boolean>;  // Registra vía backend
  logout: () => void;
  isAdmin: () => boolean;
} = useAuth();
```

#### useData()
```typescript
const {
  users: User[];
  members: Member[];
  transactions: Transaction[];
  categories: Category[];
  fees: Fee[];
  systemData: SystemData;
  addUser: (user) => Promise<void>;  // Crea vía backend
  updateUser: (id, user) => Promise<void>;  // Actualiza vía backend
  deleteUser: (id) => Promise<void>;  // Elimina vía backend
  addMember: (member) => Promise<void>;
  updateMember: (id, member) => Promise<void>;
  deleteMember: (id) => Promise<void>;
  addTransaction: (transaction) => Promise<void>;
  updateTransaction: (id, transaction) => Promise<void>;
  deleteTransaction: (id) => Promise<void>;
  addCategory: (category) => Promise<void>;
  updateCategory: (id, category) => Promise<void>;
  deleteCategory: (id) => Promise<void>;
  addFee: (fee) => Promise<void>;
  updateFee: (id, fee) => Promise<void>;
  deleteFee: (id) => Promise<void>;
  updateSystemData: (data) => Promise<void>;
  resetAllData: () => Promise<void>;
} = useData();
```

### Hooks Personalizados

#### useStats()
```typescript
const stats: Stats = useStats(
  transactions: Transaction[],
  fees: Fee[],
  members: Member[]
);
```

#### useCrudState()
```typescript
const {
  data: T[],
  loading: boolean,
  error: string | null,
  create: (item: Omit<T, 'id'>) => Promise<void>,
  update: (id: string, item: Partial<T>) => Promise<void>,
  remove: (id: string) => Promise<void>,
  refresh: () => Promise<void>
} = useCrudState<T>(endpoint: string);
```

### API REST Endpoints

#### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/logout` | Cerrar sesión |

#### Usuarios
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users` | Obtener todos los usuarios |
| GET | `/api/users/:id` | Obtener usuario por ID |
| POST | `/api/users` | Crear usuario |
| PUT | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Eliminar usuario |

#### Miembros
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/members` | Obtener todos los miembros |
| GET | `/api/members/:id` | Obtener miembro por ID |
| POST | `/api/members` | Crear miembro |
| PUT | `/api/members/:id` | Actualizar miembro |
| DELETE | `/api/members/:id` | Eliminar miembro |

#### Transacciones
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/transactions` | Obtener todas las transacciones |
| GET | `/api/transactions/:id` | Obtener transacción por ID |
| POST | `/api/transactions` | Crear transacción |
| PUT | `/api/transactions/:id` | Actualizar transacción |
| DELETE | `/api/transactions/:id` | Eliminar transacción |

#### Categorías
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/categories` | Obtener todas las categorías |
| GET | `/api/categories/:id` | Obtener categoría por ID |
| POST | `/api/categories` | Crear categoría |
| PUT | `/api/categories/:id` | Actualizar categoría |
| DELETE | `/api/categories/:id` | Eliminar categoría |

---

## Estilos

### Variables CSS Globales ([`frontend/src/styles/globals.css`](frontend/src/styles/globals.css:1))

```css
:root {
  --color-green: #22c55e;
  --color-black: #000000;
  --color-white: #ffffff;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-600: #4b5563;
  /* ... más variables */
}

.positive { color: var(--color-green); }
.negative { color: #ef4444; }
.neutral { color: var(--color-gray-600); }
```

### Configuración Tailwind ([`frontend/tailwind.config.js`](frontend/tailwind.config.js:1))

- Paleta de colores personalizada
- Espaciado extendido
- Radio de borde personalizado

---

## Cambios Recomendados para Producción

### ✅ Ya Implementado

1. **Integración de Backend**
   - ✅ Backend con Express implementado
   - ✅ Base de datos PostgreSQL configurada
   - ✅ API REST funcional

2. **Arquitectura Full-Stack**
   - ✅ Separación frontend/backend
   - ✅ Persistencia en base de datos
   - ✅ Validación del servidor

### 🔧 Pendiente para Producción

1. **Mejoras de Seguridad**
   - Implementar hashing de contraseñas (bcrypt/argon2)
   - Configurar HTTPS con certificados SSL
   - Implementar sanitización de entradas
   - Agregar rate limiting
   - Implementar protección CSRF
   - Agregar autenticación JWT con refresh tokens

2. **Rendimiento**
   - Agregar React.lazy para división de código
   - Implementar paginación para grandes conjuntos de datos
   - Agregar capa de caché (Redis)
   - Optimizar queries de base de datos
   - Implementar compresión gzip

3. **Pruebas**
   - Pruebas unitarias con Jest
   - Pruebas de integración con React Testing Library
   - Pruebas E2E con Playwright
   - Pruebas de API con Supertest

4. **Monitoreo y Logging**
   - Seguimiento de errores (Sentry)
   - Analítica de uso
   - Registro de logs estructurado
   - Monitoreo de rendimiento (APM)

5. **DevOps y Despliegue**
   - Configurar CI/CD pipeline
   - Dockerizar aplicación
   - Configurar variables de entorno
   - Implementar backup de base de datos
   - Configurar dominio y DNS

6. **Documentación**
   - Documentación de API (Swagger/OpenAPI)
   - Guía de despliegue
   - Manual de usuario

---

## Conclusión

Ruta contable es una aplicación full-stack bien estructurada que implementa una arquitectura moderna de tres capas:

- **Frontend**: React 18 con TypeScript, Tailwind CSS y arquitectura basada en características
- **Backend**: Node.js con Express para API REST
- **Base de Datos**: PostgreSQL para persistencia de datos

La aplicación utiliza patrones modernos incluyendo:
- Arquitectura basada en características para organización modular
- React Context para gestión de estado global
- Hooks personalizados para reutilización de lógica
- API REST para comunicación frontend-backend
- PostgreSQL para almacenamiento persistente y seguro

Aunque la arquitectura base está completa y funcional, se necesitan mejoras en seguridad (hashing de contraseñas, HTTPS, JWT) y pruebas antes del despliegue en producción.

---

**Última Actualización:** Abril 2026
**Versión:** 2.0.0 (Full-Stack)
