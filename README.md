# Ruta contable - Documentación Completa del Código

## Descripción General

Ruta contable es una aplicación web para gestión financiera diseñada específicamente para clubes y organizaciones. Construida con React 18, TypeScript y Tailwind CSS, utiliza una arquitectura basada en características con localStorage para persistencia de datos.

---

## Tabla de Contenidos

1. [Estructura del Proyecto](#estructura-del-proyecto)
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

## Estructura del Proyecto

```
src/
├── App.tsx                      # Componente raíz de la aplicación
├── main.tsx                     # Punto de entrada de la aplicación
├── index.css                    # Estilos globales
├── vite-env.d.ts                # Tipos de Vite
├── types/                       # Definiciones de tipos TypeScript
│   └── index.ts                 # Tipos centralizados
├── contexts/                    # Contextos de React (solo DataContext)
│   └── DataContext.tsx          # Estado de datos de la aplicación
├── features/                     # Módulos basados en características
│   ├── auth/                    # Autenticación
│   │   ├── index.ts             # Exportaciones del módulo
│   │   ├── components/          # LoginForm, RegisterForm
│   │   ├── contexts/            # AuthContext
│   │   └── pages/               # Login, Register, ForgotPassword
│   ├── landing/                 # Página pública
│   │   └── components/          # Navbar, Footer, Hero
│   └── admin/                   # Panel de administración
│       ├── index.ts             # Exportaciones del módulo
│       └── components/          # AdminLayout
├── pages/                       # Componentes de página
│   ├── UserDashboard.tsx        # Panel de usuario
│   ├── AdminPanel.tsx           # Panel de administrador
│   └── admin/                   # Páginas del admin
│       ├── AdminCategories.tsx  # Gestión de categorías
│       ├── AdminClubData.tsx    # Datos del club
│       ├── AdminMembers.tsx     # Gestión de miembros
│       ├── AdminOverview.tsx   # Resumen del sistema
│       ├── AdminReports.tsx     # Reportes
│       ├── AdminSystem.tsx      # Configuración del sistema
│       ├── AdminTransactions.tsx # Transacciones
│       ├── AdminUsers.tsx       # Gestión de usuarios
│       └── index.ts             # Exportaciones
├── hooks/                        # Hooks personalizados de React
│   └── useStats.ts              # Cálculos de estadísticas
├── components/                  # Componentes de UI
│   ├── common/                  # Componentes comunes
│   │   ├── Header.tsx           # Encabezado con información del usuario
│   │   ├── Logo.tsx            # Componente de logo
│   │   └── StatCard.tsx         # Tarjeta para mostrar estadísticas
│   └── ui/                      # Componentes shadcn/ui (45+ componentes)
├── shared/                      # Código compartido/reutilizable
│   ├── components/
│   │   ├── Logo.tsx            # Componente de logo
│   │   └── ImageWithFallback.tsx # Imagen con manejo de errores
│   └── types/
│       └── index.ts             # Tipos compartidos
├── utils/                       # Funciones utilitarias
│   ├── format.ts                # Funciones de formato
│   ├── export.ts                # Funciones de exportación
│   ├── initialData.ts           # Datos iniciales
│   └── validation.ts            # Utilidades de validación
├── styles/
│   └── globals.css               # CSS global con variables
├── images/                      # Recursos de imagen
│   └── logo/
└── guidelines/
    └── Guidelines.md            # Guías de desarrollo
```

---

## Módulos Principales

### Punto de Entrada ([`src/main.tsx`](src/main.tsx:1))

Punto de entrada de la aplicación que renderiza React en el DOM.

```typescript
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

### App Raíz ([`src/App.tsx`](src/App.tsx:1))

Componente raíz que configura los proveedores y maneja la lógica de enrutamiento.

**Características Clave:**
- Envuelve la aplicación con `AuthProvider` y `DataProvider`
- Maneja el estado de autenticación
- Dirige a las páginas según el rol del usuario

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

---

## Componentes

### Componentes de Autenticación

#### LoginForm ([`src/features/auth/components/LoginForm.tsx`](src/features/auth/components/LoginForm.tsx:1))

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

**Estado:**
```typescript
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
```

#### RegisterForm ([`src/features/auth/components/RegisterForm.tsx`](src/features/auth/components/RegisterForm.tsx:1))

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

#### Header ([`src/components/common/Header.tsx`](src/components/common/Header.tsx:1))

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

#### StatCard ([`src/components/common/StatCard.tsx`](src/components/common/StatCard.tsx:1))

Componente de tarjeta reutilizable para mostrar estadísticas.

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `title` | `string` | Título de la tarjeta |
| `value` | `string \| number` | Valor a mostrar |
| `description?` | `string` | Descripción opcional |
| `className?` | `'positive' \| 'negative' \| 'neutral'` | Tema de color |

#### Navbar ([`src/features/landing/components/Navbar.tsx`](src/features/landing/components/Navbar.tsx:1))

Barra de navegación para páginas públicas.

**Props:**
| Prop | Tipo | Descripción |
|------|------|-------------|
| `onNavigate` | `(page: 'home' \| 'login' \| 'register') => void` | Callback de navegación |

#### Footer ([`src/features/landing/components/Footer.tsx`](src/features/landing/components/Footer.tsx:1))

Pie de página con información de contacto y enlaces rápidos.

**Secciones:**
- Sobre Nosotros
- Información de Contacto
- Enlaces Rápidos
- Derechos de Autor

#### Logo ([`src/shared/components/Logo.tsx`](src/shared/components/Logo.tsx:1))

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

#### ImageWithFallback ([`src/shared/components/ImageWithFallback.tsx`](src/shared/components/ImageWithFallback.tsx:1))

Componente de imagen con fallback para imágenes rotas.

**Características:**
- Fallback automático si la imagen falla al cargar
- Placeholder SVG para imágenes fallidas
- Soporta todos los atributos estándar de img

---

## Contextos y Gestión de Estado

### AuthContext ([`src/features/auth/contexts/AuthContext.tsx`](src/features/auth/contexts/AuthContext.tsx:1))

Gestiona el estado de autenticación y sesiones de usuarios.

**Claves de Almacenamiento:**
- `clubfinance_auth` - Estado de auth actual
- `clubfinance_users` - Usuarios registrados

**Tipo de Contexto:**
```typescript
interface AuthContextType extends AuthState {
  login: (username: string, password: string) => boolean;
  register: (data: RegistrationData) => boolean;
  logout: () => void;
  isAdmin: () => boolean;
}
```

**Métodos:**

| Método | Parámetros | Retorna | Descripción |
|--------|-----------|---------|-------------|
| `login` | `username: string, password: string` | `boolean` | Autentica al usuario |
| `register` | `RegistrationData` | `boolean` | Crea nuevo usuario |
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
  password: string;        // Texto plano - ADVERTENCIA
  role: 'user' | 'admin';
  fullName: string;
  email: string;
  active: boolean;
  createdAt: string;
}
```

### DataContext ([`src/contexts/DataContext.tsx`](src/contexts/DataContext.tsx:1))

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
```

**Operaciones CRUD:**
Todos los métodos siguen el patrón de actualizar el estado local y persistir en localStorage.

---

## Utilidades

### Hook useStats ([`src/hooks/useStats.ts`](src/hooks/useStats.ts:1))

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

### Utilidades de Formato ([`src/utils/format.ts`](src/utils/format.ts:1))

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

### Utilidades de Exportación ([`src/utils/export.ts`](src/utils/export.ts:1))

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

### Datos Iniciales ([`src/utils/initialData.ts`](src/utils/initialData.ts:1))

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

### Tipos Principales ([`src/types/index.ts`](src/types/index.ts:1))

#### UserRole
```typescript
type UserRole = 'user' | 'admin';
```

#### User
```typescript
interface User {
  id: string;
  username: string;
  password: string;        // Texto plano - ADVERTENCIA
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

### Flujo de Autenticación

```
Usuario ingresa credenciales
        ↓
LoginForm llama a useAuth().login()
        ↓
AuthContext valida contra localStorage
        ↓
Si es válido: actualiza authState → localStorage
              → App redirige al panel
        ↓
Si es inválido: muestra mensaje de error
```

### Flujo de Gestión de Datos

```
Acción de usuario (agregar/actualizar/eliminar)
        ↓
Componente llama método de DataContext
        ↓
DataContext actualiza estado
        ↓
useEffect disparado → persistencia en localStorage
        ↓
Todos los componentes suscritos se re-renderizan
```

### Flujo de Cálculo de Estadísticas

```
DataContext proporciona transacciones, cuotas, miembros
        ↓
Componente pasa datos a useStats()
        ↓
useMemo calcula todas las estadísticas
        ↓
Retorna objeto Stats calculado
        ↓
Componente muestra StatCards
```

---

## Características

### Panel de Usuario ([`src/pages/UserDashboard.tsx`](src/pages/UserDashboard.tsx:1))

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

### Panel de Administrador ([`src/pages/AdminPanel.tsx`](src/pages/AdminPanel.tsx:1))

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

⚠️ **IMPORTANTE**: Esta aplicación tiene varias limitaciones de seguridad adecuadas solo para propósitos de prototipo/demo.

### Limitaciones Actuales

1. **Almacenamiento de Contraseñas**: Contraseñas almacenadas en texto plano en localStorage
   - **Riesgo**: Cualquier persona con acceso al almacenamiento del navegador puede leer contraseñas
   - **Solución**: Usar hashing bcrypt/argon2 en producción

2. **Persistencia de localStorage**: Todos los datos almacenados del lado del cliente
   - **Riesgo**: Los datos pueden ser borrados por el usuario, modificados en devtools
   - **Solución**: Migrar a base de datos del servidor

3. **Sin Validación del Servidor**: Toda validación es del lado del cliente
   - **Riesgo**: Evitable mediante llamadas API o curl
   - **Solución**: Implementar validación del lado del servidor

4. **Sin HTTPS**: Transmisión de datos no encriptada
   - **Riesgo**: Ataques man-in-the-middle
   - **Solución**: Desplegar con HTTPS

5. **Autenticación Débil**: Nombre de usuario/contraseña simple
   - **Riesgo**: Ataques de fuerza bruta, credential stuffing
   - **Solución**: Implementar JWT, rate limiting, CAPTCHA

### Credenciales de Demostración

| Rol | Nombre de Usuario | Contraseña |
|------|----------|----------|
| Admin | admin | admin123 |
| Usuario | usuario | usuario123 |

---

## Referencia de API

### Hooks de Contexto

#### useAuth()
```typescript
const {
  isAuthenticated: boolean;  // Si el usuario ha iniciado sesión
  currentUser: User | null; // Objeto de usuario actual
  login: (username, password) => boolean;
  register: (data) => boolean;
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
  addUser: (user) => void;
  updateUser: (id, user) => void;
  deleteUser: (id) => void;
  addMember: (member) => void;
  updateMember: (id, member) => void;
  deleteMember: (id) => void;
  addTransaction: (transaction) => void;
  updateTransaction: (id, transaction) => void;
  deleteTransaction: (id) => void;
  addCategory: (category) => void;
  updateCategory: (id, category) => void;
  deleteCategory: (id) => void;
  addFee: (fee) => void;
  updateFee: (id, fee) => void;
  deleteFee: (id) => void;
  updateSystemData: (data) => void;
  resetAllData: () => void;
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

---

## Estilos

### Variables CSS Globales ([`src/styles/globals.css`](src/styles/globals.css:1))

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

### Configuración Tailwind ([`tailwind.config.js`](tailwind.config.js:1))

- Paleta de colores personalizada
- Espaciado extendido
- Radio de borde personalizado

---

## Cambios Recomendados para Producción

1. **Integración de Backend**
   - Reemplazar localStorage con API REST
   - Implementar base de datos (PostgreSQL, MySQL)
   - Agregar servidor de autenticación (JWT, OAuth)

2. **Mejoras de Seguridad**
   - Hashing de contraseñas (bcrypt)
   - Aplicación de HTTPS
   - Sanitización de entradas
   - Rate limiting
   - Protección CSRF

3. **Rendimiento**
   - Agregar React.lazy para división de código
   - Implementar paginación para grandes conjuntos de datos
   - Agregar capa de caché

4. **Pruebas**
   - Pruebas unitarias con Jest
   - Pruebas de integración con React Testing Library
   - Pruebas E2E con Playwright

5. **Monitoreo**
   - Seguimiento de errores (Sentry)
   - Analítica
   - Registro de logs

---

## Conclusión

Ruta contable es una aplicación React bien estructurada que utiliza patrones modernos incluyendo arquitectura basada en características, React Context para gestión de estado, y hooks personalizados para reutilización de lógica. Aunque es adecuada para prototipos y demos, se necesitan cambios significativos antes del despliegue en producción, particularmente en seguridad e integración de backend.

---

**Última Actualización:** Febrero 2026
**Versión:** 1.0.0
