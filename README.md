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
│   │   ├── main.tsx            # Punto de entrada de la aplicación
│   │   ├── index.css           # Estilos globales
│   │   ├── types/              # Definiciones de tipos TypeScript
│   │   ├── contexts/           # Contextos de React
│   │   │   ├── DataContext.tsx # Estado de datos de la aplicación
│   │   │   └── AuthContext.tsx # Estado de autenticación
│   │   ├── features/          # Módulos basados en características
│   │   ├── pages/             # Componentes de página
│   │   ├── hooks/             # Hooks personalizados
│   │   ├── components/        # Componentes de UI
│   │   ├── shared/            # Código compartido
│   │   ├── config/           # Configuración de entidades
│   │   ├── utils/            # Funciones utilitarias
│   │   ├── styles/           # Estilos globales
│   │   ├── images/           # Imágenes y logos
│   │   └── guidelines/       # Guías de estilo
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── backend/                     # API REST (Servidor)
│   ├── db.js                   # Pool de conexiones PostgreSQL
│   ├── server.js               # Servidor Express (entrada principal)
│   ├── src/
│   │   ├── index.js            # Servidor principal con rutas inline
│   │   └── pages/
│   │       └── Admin_system.js  # Páginas admin
│   ├── middleware/
│   │   └── auth.js             # Middleware JWT requireAdmin
│   ├── routes/
│   │   ├── auth.js             # Rutas de autenticación
│   │   └── users.js           # CRUD completo de usuarios
│   ├── utils/
│   │   └── helpers.js         # Validación y logging
│   ├── logs/
│   │   └── security.log       # Registro de intentos fallidos
│   ├── package.json
│   └── .env                   # Variables de entorno
│
├── build/                      # Build de producción
├── README.md                   # Documentación principal
└── .npmrc                      # Configuración de npm
```
Ruta contable/
├── frontend/                                    # Aplicación React (Cliente)
│   ├── src/
│   │   ├── App.tsx                              # Componente raíz de la aplicación
│   │   ├── main.tsx                             # Punto de entrada de la aplicación
│   │   ├── index.css                            # Estilos globales
│   │   ├── vite-env.d.ts                        # Tipos de Vite
│   │   ├── types/                               # Definiciones de tipos TypeScript
│   │   │   └── index.ts                         # Tipos centralizados
│   │   ├── contexts/                            # Contextos de React
│   │   │   └── DataContext.tsx                  # Estado de datos de la aplicación
│   │   ├── features/                            # Módulos basados en características
│   │   │   ├── auth/                            # Autenticación
│   │   │   │   ├── index.ts                     # Exportaciones del módulo
│   │   │   │   ├── components/                  # LoginForm, RegisterForm
│   │   │   │   ├── contexts/                    # AuthContext
│   │   │   │   └── pages/                       # Login, Register, ForgotPassword
│   │   │   ├── landing/                         # Página pública
│   │   │   │   └── components/                  # Navbar, Footer, Hero
│   │   │   └── admin/                           # Panel de administración
│   │   │       ├── index.ts                     # Exportaciones del módulo
│   │   │       └── components/                  # AdminLayout
│   │   ├── pages/                               # Componentes de página
│   │   │   ├── admin/                           # Páginas del admin
│   │   │   │   ├── AdminCategories.tsx
│   │   │   │   ├── AdminClubData.tsx
│   │   │   │   ├── AdminMembers.tsx
│   │   │   │   ├── AdminOverview.tsx
│   │   │   │   ├── AdminReports.tsx
│   │   │   │   ├── AdminSystem.tsx
│   │   │   │   ├── AdminTransactions.tsx
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
│   │   ├── index.js             # Punto de entrada con seguridad completa
│   │   ├── server.js            # Servidor Express alternativo
│   │   ├── middleware/
│   │   │   └── auth.js          # Middleware de autenticación JWT
│   │   ├── config/
│   │   │   └── database.js     # Configuración de base de datos
│   │   ├── controllers/         # Controladores de rutas
│   │   ├── routes/              # Definición de rutas API
│   │   │   ├── auth.js          # Rutas de autenticación
│   │   │   └── users.js         # Rutas de usuarios (CRUD)
│   │   ├── services/            # Lógica de negocio
│   │   ├── database/            # Scripts de base de datos
│   │   └── utils/
│   │       └── helpers.js       # Utilidades (validación, logging)
│   ├── utils/
│   │   └── helpers.js           # Funciones auxiliares
│   ├── db.js                    # Conexión a PostgreSQL (Pool)
│   ├── server.js                # Servidor principal
│   ├── package.json
│   ├── .env                     # Variables de entorno
│   └── logs/                    # Logs de seguridad
│
├── build/                       # Build de producción del frontend
│   ├── index.html
│   └── assets/
│
├── README.md                    # Documentación principal
│ └── .npmrc                       # Configuración de npm
```

---

## Arquitectura del Backend

El backend de Ruta Contable es una API REST segura construida con Node.js, Express y PostgreSQL. Implementa múltiples capas de seguridad incluyendo autenticación JWT, hashing de contraseñas con bcrypt, rate limiting y validación de entradas.

### Stack Tecnológico

| Tecnología | Propósito |
|------------|-----------|
| **Node.js** | Runtime de JavaScript |
| **Express.js** | Framework web |
| **PostgreSQL** | Base de datos relacional |
| **pg** | Driver de PostgreSQL |
| **JWT** | Autenticación con tokens |
| **bcryptjs** | Hashing de contraseñas |
| **Helmet** | Headers de seguridad HTTP |
| **express-rate-limit** | Limitación de intentos |
| **morgan** | Logging de peticiones |
| **dotenv** | Variables de entorno |

### Estructura de Archivos Reales

```
backend/
├── db.js                    # Pool de conexiones PostgreSQL
├── server.js                # Servidor Express (entrada principal)
├── src/
│   ├── index.js             # Servidor con lógica inline
│   └── pages/
│       └── Admin_system.js   # Páginas admin
├── middleware/
│   └── auth.js              # Middleware requireAdmin
├── routes/
│   ├── auth.js              # Rutas de autenticación
│   └── users.js             # CRUD de usuarios
├── utils/
│   └── helpers.js           # Validación y logging
├── logs/
│   └── security.log         # Intentos fallidos
├── package.json
└── .env
```

### Dependencias (package.json)

```json
{
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "cors": "^2.8.6",
    "dotenv": "^17.4.0",
    "express": "^5.2.1",
    "express-rate-limit": "^8.3.2",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.3",
    "morgan": "^1.10.1",
    "pg": "^8.20.0"
  }
}
```

### Configuración de Base de Datos

La conexión a PostgreSQL usa el módulo `pg` con un pool de conexiones:

```javascript
// backend/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

module.exports = pool;
```

### Schema de la Tabla Users

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

### Medidas de Seguridad Implementadas

| Capa | Implementación | Descripción |
|------|----------------|-------------|
| **Helmet** | Headers de seguridad | Protege contra ataques comunes |
| **CORS** | Configuración estricta | Origin configurable |
| **Rate Limiting** | 10 intentos/15 min | Previene fuerza bruta |
| **Hashing** | bcrypt (12 rounds) | Contraseñas hasheadas |
| **JWT** | Expiración 1 día | Tokens con issuer/audience |
| **Validación** | Input sanitization | Previene inyección SQL |
| **Bloqueo** | 5 intentos fallidos | Bloquea 15 minutos |
| **Logging** | security.log | Registro de intentos |

### Variables de Entorno (.env)

```bash
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rutacontable
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secure_secret_key
CORS_ORIGIN=http://localhost:3000
```

### Credenciales por Defecto

| Rol | Username | Contraseña |
|-----|----------|------------|
| Admin | admin | admin123 |

### Endpoints de la API

#### Autenticación (Público)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/health` | Health check |
| GET | `/api/enana` | Ruta de prueba |

#### Usuarios (Protegido - Solo Admin)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users` | Obtener todos los usuarios |
| GET | `/api/users/:id` | Obtener usuario por ID |
| POST | `/api/users` | Crear usuario |
| PUT | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Eliminar usuario |

### Middleware de Autenticación

```javascript
// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const pool = require('../db');

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

module.exports = { requireAdmin };
```

### Utilidades del Backend

#### Validación de Entradas

```javascript
// backend/utils/helpers.js
function validateInput(username, password) {
  const errors = [];
  if (!username || username.trim() === '') errors.push('El usuario es requerido');
  if (!password || password.length < 6) errors.push('La contraseña debe tener al menos 6 caracteres');
  if (username && username.length > 50) errors.push('El usuario no puede tener más de 50 caracteres');
  if (password && password.length > 100) errors.push('La contraseña no puede tener más de 100 caracteres');
  return errors;
}
```

#### Logging de Intentos Fallidos

```javascript
function logFailedAttempt(username, ip, reason) {
  const logEntry = `${new Date().toISOString()} | IP: ${ip} | Usuario: ${username} | Razón: ${reason}\n`;
  const logPath = path.join(__dirname, '../logs/security.log');
  fs.appendFileSync(logPath, logEntry);
}
```

### Inicio del Servidor

```bash
# Desarrollo
cd backend
npm start

# Con nodemon (auto-reload)
npm run dev
```

El servidor inicia en `http://localhost:3001` y muestra:
- Endpoint de login: `POST http://localhost:3001/api/auth/login`
- Health check: `GET http://localhost:3001/health`
- Estado de todas las medidas de seguridad

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

### Backend - Servidor Principal ([`backend/src/index.js`](backend/src/index.js:1))

Servidor completo con todas las rutas inline y lógica de seguridad. Incluye:
- Setup automático de base de datos
- Validación de entradas
- Rate limiting
- Sistema de bloqueo de cuentas
- Generación de JWT
- Logging de seguridad

```javascript
// backend/src/index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Demasiados intentos fallidos.' },
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  // Validación, bcrypt compare, JWT sign
});

async function start() {
  await setupDatabase();
  app.listen(port, () => console.log(`🚀 Servidor en http://localhost:${port}`));
}
start();
```

### Backend - Servidor Alternativo ([`backend/server.js`](backend/server.js:1))

Servidor Express que usa rutas modulares:

```javascript
// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = require('./db');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

app.get('/health', (req, res) => res.json({ status: 'OK' }));

async function setupDatabase() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (...)`);
}

async function start() {
  await setupDatabase();
  app.listen(port, () => console.log(`🚀 Servidor en http://localhost:${port}`));
}

start();
```

### Rutas de Autenticación ([`backend/routes/auth.js`](backend/routes/auth.js:1))

Endpoints de login con seguridad integrada usando helpers externos:

```javascript
// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const pool = require('../db');
const { validateInput, logFailedAttempt } = require('../utils/helpers');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Demasiados intentos fallidos.' },
});

router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  const errors = validateInput(username, password);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Error de validación', errors });
  }
  // Buscar usuario, verificar contraseña, generar JWT
});

module.exports = router;
```

### Rutas de Usuarios ([`backend/routes/users.js`](backend/routes/users.js:1))

CRUD completo protegido por middleware `requireAdmin`:

- `GET /` - Listar todos los usuarios
- `GET /:id` - Obtener usuario por ID
- `POST /` - Crear nuevo usuario
- `PUT /:id` - Actualizar usuario
- `DELETE /:id` - Eliminar usuario

### Base de Datos (PostgreSQL)

#### Schema de la Tabla Users ([`backend/db.js`](backend/db.js:1))

Script de configuración y creación de tablas en PostgreSQL.

**Tabla Principal:**
- `users` - Usuarios del sistema (id, username, password, email, full_name, role, active, failed_attempts, locked_until, created_at)

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
