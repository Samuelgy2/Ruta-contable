# Ruta Contable

Aplicación web full-stack para gestión financiera diseñada para clubes y organizaciones.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)](https://www.postgresql.org)

## Descripción

Ruta contable es una aplicación web full-stack para gestión financiera diseñada específicamente para clubes y organizaciones. Construida con una arquitectura moderna de tres capas:

- **Frontend**: React 18, TypeScript y Tailwind CSS con arquitectura basada en características
- **Backend**: Node.js con Express para API REST
- **Base de Datos**: PostgreSQL para persistencia de datos

## Tabla de Contenidos

1. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Primeros Pasos](#primeros-pasos)
4. [Estructura de Archivos](#estructura-de-archivos)
5. [API Endpoints](#api-endpoints)
6. [Credenciales](#credenciales)
7. [Seguridad](#seguridad)

---

## Arquitectura del Proyecto

```
┌─────────────────────────────────────────────────────────────┐
│                    Ruta Contable                             │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + TypeScript + Tailwind CSS)                 │
│       │                                                    │
│       ▼                                                    │
│  Backend (Node.js + Express API REST)                    │
│       │                                                    │
│       ▼                                                    │
│  PostgreSQL (Base de Datos)                              │
└─────────────────────────────────────────────────────────────┘
```

## Stack Tecnológico

### Frontend
| Tecnología | Propósito |
|------------|-----------|
| React 18 | Librería de UI |
| TypeScript | tipado estático |
| Tailwind CSS | Estilos |
| Vite | Build tool |

### Backend
| Tecnología | Propósito |
|------------|-----------|
| Node.js | Runtime |
| Express.js | Framework web |
| PostgreSQL | Base de datos |
| JWT | Autenticación |
| bcryptjs | Hashing de contraseñas |
| Helmet | Seguridad HTTP |
| express-rate-limit | Rate limiting |

## Primeros Pasos

### Requisitos

- Node.js 18+
- PostgreSQL 15+
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd ruta-contable

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

### Configuración

Crear archivo `backend/.env`:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rutacontable
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=tu_secret_key
CORS_ORIGIN=http://localhost:3000
```

### Iniciar

```bash
# Backend (terminal 1)
cd backend
npm start

# Frontend (terminal 2)
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

## Estructura de Archivos

```
Ruta contable/
├─��� frontend/                    # Aplicación React
│   ├── src/
│   │   ├── App.tsx            # Componente raíz
│   │   ├── main.tsx          # Punto de entrada
│   │   ├── features/        # Módulos por característica
│   │   │   ├── auth/       # Autenticación
│   │   │   ├── landing/   # Página pública
│   │   │   └── admin/    # Panel admin
│   │   ├── components/     # Componentes reutilizables
│   │   ├── contexts/      # React Context
│   │   ├── hooks/        # Hooks personalizados
│   │   ├── pages/       # Páginas
│   │   ├── types/      # Tipos TypeScript
│   │   └── utils/      # Utilidades
│   └── package.json
│
├── backend/                 # API REST
│   ├── src/
│   │   ├── index.js      # Servidor principal
│   │   ├── middleware/  # Middleware JWT
│   │   ├── routes/       # Rutas API
│   │   ├── config/      # Configuración BD
│   │   └── utils/       # Utilidades
│   ├── db.js            # Pool PostgreSQL
│   ├── server.js       # Servidor Express
│   ├── package.json
│   └── .env           # Variables de entorno
│
└── README.md
```

---

## API Endpoints

### Autenticación (Público)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/register` | Registrar usuario |
| GET | `/api/enana` | Ruta de prueba |
| GET | `/health` | Health check |

### Usuarios (Protegido - Admin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users` | Listar usuarios |
| GET | `/api/users/:id` | Usuario por ID |
| POST | `/api/users` | Crear usuario |
| PUT | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Eliminar usuario |

### Miembros

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/members` | Listar miembros |
| GET | `/api/members/:id` | Miembro por ID |
| POST | `/api/members` | Crear miembro |
| PUT | `/api/members/:id` | Actualizar miembro |
| DELETE | `/api/members/:id` | Eliminar miembro |

### Transacciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/transactions` | Listar transacciones |
| GET | `/api/transactions/:id` | Transacción por ID |
| POST | `/api/transactions` | Crear transacción |
| PUT | `/api/transactions/:id` | Actualizar transacción |
| DELETE | `/api/transactions/:id` | Eliminar transacción |

### Categorías

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/categories` | Listar categorías |
| GET | `/api/categories/:id` | Categoría por ID |
| POST | `/api/categories` | Crear categoría |
| PUT | `/api/categories/:id` | Actualizar categoría |
| DELETE | `/api/categories/:id` | Eliminar categoría |

---

## Credenciales

| Rol | Usuario | Contraseña |
|-----|----------|------------|
| Admin | `admin` | `admin123` |
| Usuario | `usuario` | `usuario123` |

---

## Seguridad

### Medidas Implementadas

| Capa | Implementación |
|------|----------------|
| Helmet | Headers de seguridad HTTP |
| CORS | Configuración estricta |
| Rate Limiting | 10 intentos / 15 min |
| Hashing | bcrypt (12 rounds) |
| JWT | Tokens con expiración |
| Validación | Sanitización de entradas |
| Bloqueo | 5 intentos fallidos (15 min) |

### Arquitectura de Seguridad

```
Frontend (React)
      │
      ▼
HTTPS (producción)
      │
      ▼
Backend (Express)
      │
      ▼
Validación y Sanitización
      │
      ▼
PostgreSQL (prepared statements)
```

---

## Schema de Base de Datos

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  active BOOLEAN DEFAULT true,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Middleware de Autenticación

```javascript
// backend/middleware/auth.js
async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Acceso denegado' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
}
```

---

## Tipos TypeScript

```typescript
interface User {
  id: string;
  username: string;
  password: string;
  role: 'user' | 'admin';
  fullName: string;
  email: string;
  active: boolean;
  createdAt: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  active: boolean;
  membershipType: 'Completa' | 'Básica' | 'Premium';
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  createdBy: string;
  memberId?: string;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  description: string;
  active: boolean;
}

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

---

## Hooks Personalizados

### useAuth()

```typescript
const {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (username, password) => Promise<boolean>;
  register: (data) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
} = useAuth();
```

### useStats()

```typescript
const stats = useStats(transactions, fees, members);
// Retorna: { totalIncome, totalExpense, balance, monthlyIncome, monthlyExpense, ... }
```

### useCrudState()

```typescript
const {
  data: T[],
  loading: boolean,
  error: string | null,
  create: (item) => Promise<void>,
  update: (id, item) => Promise<void>,
  remove: (id) => Promise<void>,
  refresh: () => Promise<void>
} = useCrudState<T>('/api/endpoint');
```

---

## Utilidades

### Formato

```typescript
formatCurrency(1500, '$');      // "$1500.00"
formatDate('2024-01-15');       // "15 de enero de 2024"
formatDateShort('2024-01-15');  // "15/01/2024"
capitalizeFirst('hola');        // "Hola"
```

### Exportación

```typescript
exportToCSV(data, filename);
exportToJSON(data, filename);
exportTransactionsReport(transactions, systemData);
```

---

## Mejoras Pendientes

- [ ] HTTPS con certificados SSL
- [ ] Sanitización completa de entradas
- [ ] Protección CSRF
- [ ] JWT con refresh tokens
- [ ] Pruebas unitarias y de integración
- [ ] Documentación con Swagger/OpenAPI

## Cambios Recientes
- [x] Generar alertas automáticas para pagos pendientes y vencidos (hook `useAlerts`)

---

**Última Actualización:** Mayo 2026
**Versión:** 2.0.1