# Ruta Contable

Aplicación web full-stack para gestión financiera diseñada para clubes y organizaciones.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-green)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com)

## Descripción

Ruta contable es una aplicación web full-stack para gestión financiera diseñada específicamente para clubes y organizaciones. Construida con una arquitectura moderna de tres capas y containerizada con Docker para despliegue consistente:

- **Frontend**: React 18, TypeScript y Tailwind CSS con arquitectura basada en características
- **Backend**: Node.js con Express para API REST
- **Base de Datos**: PostgreSQL para persistencia de datos
- **Orquestación**: Docker Compose para levantar todo el stack con un solo comando

## Tabla de Contenidos

1. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Primeros Pasos](#primeros-pasos)
   - [Con Docker (Recomendado)](#con-docker-recomendado)
   - [Sin Docker (Desarrollo local)](#sin-docker-desarrollo-local)
4. [Estructura de Archivos](#estructura-de-archivos)
5. [API Endpoints](#api-endpoints)
6. [Credenciales](#credenciales)
7. [Seguridad](#seguridad)

---

## Arquitectura del Proyecto

### Stack Dockerizado

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Ruta Contable (Docker Compose)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐      HTTP/5173      ┌───────────────────────────────┐    │
│  │   Frontend   │◄────────────────────►│           Nginx               │    │
│  │   (React)    │                      │  (Servidor estático + proxy)  │    │
│  │  Puerto 3000 │                      └──────────────┬────────────────┘    │
│  └──────────────┘                                    │                     │
│                                                      │ proxy_pass          │
│                                                      ▼                     │
│  ┌──────────────┐                       ┌───────────────────────────────┐    │
│  │   Backend    │◄──────────────────────│          Express API          │    │
│  │   (Node.js)  │      HTTP/3001        │       Puerto 3001            │    │
│  │   + nodemon  │◄──────────────────────│  (hot-reload en desarrollo)  │    │
│  └──────────────┘                       └──────────────┬────────────────┘    │
│                                                      │                     │
│                                                      │ pg driver            │
│                                                      ▼                     │
│  ┌──────────────┐                       ┌───────────────────────────────┐    │
│  │  PostgreSQL  │                       │    Volumen: pgdata            │    │
│  │   Puerto     │                       │    (datos persistentes)       │    │
│  │    5432      │                       │                               │    │
│  └──────────────┘                       └───────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Flujo de desarrollo

1. **Editas código** en tu máquina local (`./frontend`, `./backend`)
2. **Bind mounts** sincronizan los archivos dentro de los contenedores
3. **Hot-reload** detecta cambios y recarga automáticamente:
   - Backend: `nodemon` reinicia el servidor Express
   - Frontend: Vite recarga el navegador
4. **Base de datos**persiste en el volumen `pgdata` (no se pierde al apagar)

---

## Stack Tecnológico

### Frontend
| Tecnología | Propósito |
|------------|-----------|
| React 18 | Librería de UI |
| TypeScript | Tipado estático |
| Tailwind CSS | Estilos |
| Vite | Build tool |
| Docker + Nginx | Contenedor y servidor estático |

### Backend
| Tecnología | Propósito |
|------------|-----------|
| Node.js 18+ | Runtime |
| Express.js | Framework web |
| PostgreSQL 15 | Base de datos |
| JWT | Autenticación |
| bcryptjs | Hashing de contraseñas |
| Helmet | Seguridad HTTP |
| express-rate-limit | Rate limiting |
| nodemon | Hot-reload (desarrollo) |
| Docker | Contenedorización |

---

## Primeros Pasos

### Con Docker (Recomendado)

La forma más rápida de levantar el proyecto completo sin preocuparte por dependencias locales.

#### Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows, Mac o Linux)
- Al menos 4 GB de RAM y 2 CPUs asignados a Docker

#### Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd ruta-contable

# 2. Configurar variables de entorno
# Copiar el archivo de ejemplo y completar con tus valores
cp .env.example .env

# 3. Levantar todo el stack
docker compose up --build
```

Esto levanta automáticamente:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001
- **PostgreSQL:** localhost:5432

> **Nota:** La primera vez tarda más porque Docker construye las imágenes. Las siguientes veces usa cache.

Para ver logs en tiempo real:

```bash
docker compose logs -f
```

Para apagar:

```bash
docker compose down
```

> **Importante:** No uses `docker compose down -v` a menos que quieras borrar todos los datos de la base de datos.

#### Comandos Docker útiles

| Comando | Descripción |
|---------|-------------|
| `docker compose up --build` | Levantar/Reconstruir todo el stack |
| `docker compose up -d` | Levantar en segundo plano |
| `docker compose down` | Apagar sin borrar datos |
| `docker compose down -v` | Apagar **y** borrar volumen de DB |
| `docker compose logs -f` | Ver logs en tiempo real |
| `docker compose logs -f backend` | Logs solo del backend |
| `docker compose logs -f frontend` | Logs solo del frontend |
| `docker compose exec backend sh` | Abrir shell en el contenedor backend |
| `docker compose exec frontend sh` | Abrir shell en el contenedor frontend |
| `docker compose exec postgres psql -U postgres -d ruta_contable1` | Conectar a PostgreSQL |

---

### Sin Docker (Desarrollo local)

Si preferís correr el proyecto sin Docker en tu máquina.

#### Requisitos

- Node.js 18+
- PostgreSQL 15+
- npm o yarn

#### Instalación

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

#### Configuración

Crear archivo `backend/.env`:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ruta_contable1
DB_USER=postgres
DB_PASSWORD=root
JWT_SECRET=tu_jwt_secret_super_seguro_aqui
CORS_ORIGIN=http://localhost:5173
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
CURRENCY=COP
CLUB_NAME=Ruta Contable
```

#### Iniciar

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173 (Vite)
- Backend: http://localhost:3001

---

## Estructura de Archivos

```
Ruta contable/
├─ frontend/                    # Aplicación React
│   ├── src/
│   │   ├── App.tsx            # Componente raíz
│   │   ├── main.tsx          # Punto de entrada
│   │   ├── features/        # Módulos por característica
│   │   │   ├── auth/       # Autenticación (Login, Recuperar contraseña)
│   │   │   ├── landing/   # Página pública
│   │   │   ├── admin/    # Panel admin (Layout y páginas)
│   │   │   │   ├── components/AdminLayout.tsx
│   │   │   │   └── pages/
│   │   │   │       ├── index.ts
│   │   │   │       ├── AdminOverview.tsx
│   │   │   │       ├── AdminTransactions.tsx
│   │   │   │       ├── AdminMembers.tsx
│   │   │   │       ├── AdminReports.tsx
│   │   │   │       ├── AdminClubData.tsx
│   │   │   │       ├── AdminMonthlyPayments.tsx
│   │   │   │       ├── AdminCartera.tsx
│   │   │   │       └── AdminSystem.tsx
│   │   ├── components/     # Componentes reutilizables
│   │   ├── contexts/      # React Context (Auth, Data)
│   │   ├── hooks/        # Hooks personalizados (useAuth, useStats, useCrudState, useAlerts)
│   │   ├── pages/       # Páginas legacy
│   │   ├── types/      # Tipos TypeScript
│   │   └── utils/      # Utilidades (formato, exportación)
│   ├── public/
│   ├── Dockerfile          # Producción (multistage: Node + Nginx)
│   ├── Dockerfile.dev      # Desarrollo (hot-reload con nodemon)
│   ├── .dockerignore       # Ignorados para Docker
│   ├── vite.config.ts
│   └── .env                # Desarrollo local (sin Docker)
│
├── backend/                 # API REST
│   ├── controllers/        # Controladores
│   ├── middleware/        # Middleware JWT, autenticación
│   ├── routes/           # Rutas API
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── Member.js
│   │   ├── Transaction.js
│   │   ├── admin.js
│   │   ├── balance.js
│   │   ├── forgotPassword.js
│   │   └── ...
│   ├── utils/            # Utilidades
│   ├── logs/             # Logs de seguridad
│   ├── src/              # Código fuente adicional
│   ├── server.js         # Servidor Express principal
│   ├── db.js             # Pool PostgreSQL
│   ├── package.json
│   ├── Dockerfile        # Producción
│   ├── Dockerfile.dev    # Desarrollo (hot-reload)
│   ├── .dockerignore     # Ignorados para Docker
│   └── .env              # Desarrollo local (sin Docker)
│
├── .env                   # Variables de entorno para Docker Compose
├── .env.example           # Plantilla de variables de entorno
├── docker-compose.yml     # Desarrollo (hot-reload)
├── guia_docker.md         # Guía completa de Docker
├── DOCUMENTATION.md       # Documentación técnica del proyecto
└── README.md
```

---

## API Endpoints

### Autenticación (Público)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/forgot-password` | Solicitar recuperación de contraseña |
| POST | `/api/auth/reset-password` | Restablecer contraseña |
| GET | `/health` | Health check |

### Usuarios (Protegido - Admin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users` | Listar usuarios |
| GET | `/api/users/:id` | Usuario por ID |
| POST | `/api/users` | Crear usuario |
| PUT | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Eliminar usuario |

### Miembros (Socios)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/socios` | Listar socios |
| GET | `/api/socios/:id` | Socio por ID |
| POST | `/api/socios` | Crear socio |
| PUT | `/api/socios/:id` | Actualizar socio |
| DELETE | `/api/socios/:id` | Eliminar socio |
| GET | `/api/socios/export/csv` | Exportar socios a CSV |

### Transacciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/transactions` | Listar transacciones |
| GET | `/api/transactions/:id` | Transacción por ID |
| POST | `/api/transactions` | Crear transacción |
| PUT | `/api/transactions/:id` | Actualizar transacción |
| DELETE | `/api/transactions/:id` | Eliminar transacción |
| GET | `/api/transactions/export/csv` | Exportar transacciones a CSV |

### Categorías

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/categories` | Listar categorías |
| GET | `/api/categories/:id` | Categoría por ID |
| POST | `/api/categories` | Crear categoría |
| PUT | `/api/categories/:id` | Actualizar categoría |
| DELETE | `/api/categories/:id` | Eliminar categoría |

### Datos del Club

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/club` | Obtener datos del club |
| PUT | `/api/club` | Actualizar datos del club |

### Pagos Mensuales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/payments` | Listar pagos mensuales |
| GET | `/api/payments/overdue` | Pagos vencidos |
| POST | `/api/payments/generate` | Generar pagos del mes |
| POST | `/api/payments/:id/pay` | Marcar pago como pagado |
| PUT | `/api/payments/:id` | Actualizar pago |

### Cartera

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/cartera` | Obtener cartera de miembros |
| GET | `/api/cartera/:memberId` | Cartera de un miembro específico |
| PUT | `/api/cartera/:memberId` | Actualizar cartera de miembro |

---

## Credenciales

| Rol | Usuario | Contraseña |
|-----|----------|------------|
| Admin | `admin` | `admin123` |

> **Nota:** El sistema cuenta con funcionalidad de recuperación de contraseña mediante correo electrónico.

---

## Seguridad

### Medidas Implementadas

| Capa | Implementación |
|------|----------------|
| Helmet | Headers de seguridad HTTP |
| CORS | Configuración estricta por origen |
| Rate Limiting | Protección contra fuerza bruta |
| Hashing | bcrypt (12 rounds) |
| JWT | Tokens con expiración |
| Validación | Sanitización de entradas |
| Bloqueo | 5 intentos fallidos (bloqueo 15 min) |

### Arquitectura de Seguridad

```
Frontend (React)
       │
       ▼
HTTPS / Nginx (producción)
       │
       ▼
Backend (Express + Helmet)
       │
       ▼
Validación y Sanitización
       │
       ▼
PostgreSQL (prepared statements)
```

---

## Schema de Base de Datos

### Tabla: users

```sql
CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  username        VARCHAR(50)  UNIQUE NOT NULL,
  password        VARCHAR(255) NOT NULL,
  email           VARCHAR(100) UNIQUE NOT NULL,
  full_name       VARCHAR(100) NOT NULL,
  role            VARCHAR(20)  DEFAULT 'user',
  active          BOOLEAN      DEFAULT true,
  failed_attempts INTEGER      DEFAULT 0,
  locked_until    TIMESTAMP,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: socio

```sql
CREATE TABLE socio (
  id_socio         SERIAL PRIMARY KEY,
  nombre           VARCHAR(200) NOT NULL,
  documento        VARCHAR(50)  UNIQUE NOT NULL,
  tipo_documento   VARCHAR(10)  DEFAULT 'CC',
  email            VARCHAR(100),
  telefono         VARCHAR(30),
  direccion        TEXT,
  fecha_nacimiento DATE,
  fecha_ingreso    DATE NOT NULL,
  tipo_membresia   VARCHAR(50)  DEFAULT 'Básica',
  estado           VARCHAR(20)  DEFAULT 'activo',
  foto             TEXT,
  observaciones    TEXT,
  created_by       INTEGER REFERENCES users(id),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: transactions

```sql
CREATE TABLE transactions (
  id          SERIAL PRIMARY KEY,
  tipo        VARCHAR(20)     NOT NULL,
  monto       DECIMAL(15,2)   NOT NULL,
  fecha       DATE            NOT NULL,
  descripcion TEXT,
  categoria   VARCHAR(100),
  metodo_pago VARCHAR(50),
  creado_por  VARCHAR(100),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: periodos

```sql
CREATE TABLE periodos (
  id            SERIAL PRIMARY KEY,
  anio          INTEGER      NOT NULL,
  mes           INTEGER      NOT NULL CHECK (mes BETWEEN 1 AND 12),
  nombreMes     VARCHAR(20)  NOT NULL DEFAULT '',
  fechaInicio   DATE,
  fechaFin      DATE,
  activo        BOOLEAN      NOT NULL DEFAULT true,
  cerrado       BOOLEAN      NOT NULL DEFAULT false,
  fechaCierre   TIMESTAMP,
  observaciones TEXT,
  cerradoBy     VARCHAR(100),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (anio, mes)
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

## Docker

Para una guía completa de Docker, hot-reload, troubleshooting y comandos avanzados, consultá **[guia_docker.md](guia_docker.md)**.

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

**Última Actualización:** Junio 2026
**Versión:** 2.1.0
