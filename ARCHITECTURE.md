# Arquitectura del Proyecto - ClubFinance

Este proyecto utiliza una **arquitectura organizada por tipo de contenido** con componentes, contextos, páginas y utilidades centralizadas.

## Estructura de Carpetas

```
src/
├── pages/                       # Páginas de la aplicación
│   ├── Login.tsx               # Página de login
│   ├── Register.tsx            # Página de registro
│   ├── AdminPanel.tsx          # Panel de administrador (combined)
│   └── admin/                  # Páginas del admin
│       ├── index.ts            # Export de todas las páginas admin
│       ├── AdminOverview.tsx   # Resumen del sistema
│       ├── AdminTransactions.tsx # Gestión de transacciones
│       ├── AdminUsers.tsx      # Gestión de usuarios/socios
│       ├── AdminMembers.tsx    # Lista de miembros
│       ├── AdminReports.tsx    # Reportes y estadísticas
│       ├── AdminCategories.tsx # Gestión de categorías
│       ├── AdminClubData.tsx   # Datos del club
│       └── AdminSystem.tsx     # Configuración del sistema
│
├── components/                  # Componentes globales
│   ├── auth/                   # Componentes de autenticación
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ForgotPasswordForm.tsx
│   ├── common/                 # Componentes comunes
│   │   ├── Header.tsx         # Header con usuario y logout
│   │   ├── Footer.tsx         # Pie de página
│   │   ├── Logo.tsx           # Componente de logo
│   │   ├── Navbar.tsx         # Barra de navegación
│   │   └── StatCard.tsx       # Tarjeta de estadísticas
│   ├── landing/                # Componentes de landing
│   │   ├── About.tsx
│   │   ├── CTA.tsx
│   │   ├── Features.tsx
│   │   └── Hero.tsx
│   ├── figma/                  # Componentes de Figma
│   │   └── ImageWithFallback.tsx
│   └── ui/                     # Componentes de shadcn/ui
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       └── ... (60+ componentes)
│
├── contexts/                    # Contextos globales
│   ├── AuthContext.tsx         # Contexto de autenticación
│   └── DataContext.tsx         # Contexto global de datos
│
├── hooks/                       # Custom hooks globales
│   └── useStats.ts             # Hook para estadísticas
│
├── types/                       # Tipos TypeScript globales
│   └── index.ts
│
├── utils/                       # Utilidades globales
│   ├── export.ts               # Funciones de exportación
│   ├── format.ts               # Funciones de formato
│   ├── initialData.ts          # Datos iniciales del sistema
│   └── validation.ts           # Validaciones
│
├── styles/                      # Estilos globales
│   └── globals.css             # CSS global con variables Tailwind
│
├── images/                      # Imágenes y recursos
│   └── logo/                   # Logos del club
│
├── App.tsx                      # Componente raíz
└── main.tsx                     # Punto de entrada
```

## Principios de la Arquitectura

### 1. Organización por Tipo

El código se organiza por tipo de contenido:
- **components/**: Todos los componentes React
- **contexts/**: Contextos globales de React
- **pages/**: Páginas completas
- **hooks/**: Custom hooks reutilizables
- **types/**: Tipos TypeScript
- **utils/**: Funciones utilitarias

### 2. Convenciones de Nomenclatura

- **PascalCase**: Componentes, contextos, páginas (ej: `LoginForm.tsx`)
- **camelCase**: Funciones, variables, hooks (ej: `useStats.ts`)
- **kebab-case**: Archivos CSS (ej: `globals.css`)

## Features del Proyecto

### Auth (Autenticación)

Maneja todo lo relacionado con autenticación:
- Inicio de sesión
- Registro de usuarios
- Cambio de contraseña (recuperación directa)
- Gestión de sesión (localStorage)
- Roles (admin/usuario)

**Ubicación:** `src/components/auth/`

**Componentes principales:**
- `LoginForm`: Formulario de login
- `RegisterForm`: Formulario de registro
- `ForgotPasswordForm`: Formulario de recuperación de contraseña

**Contexto:**
- `AuthContext`: Proveedor de autenticación en `src/contexts/AuthContext.tsx`

**Funcionalidades:**
- `login()`: Autentica al usuario con username y password
- `register()`: Registra un nuevo usuario
- `changePassword()`: Cambia la contraseña directamente
- `logout()`: Cierra la sesión del usuario
- `isAdmin()`: Verifica si el usuario tiene rol de administrador

### Dashboard

Panel de control para usuarios y administradores:
- Vista de estadísticas
- Gestión de transacciones
- Gestión de miembros
- Gestión de cuotas
- Reportes y exportación

**Componentes principales:**
- `AdminPanel`: Panel completo para administradores
- `Header`: Barra superior con usuario y logout
- `StatCard`: Tarjeta de estadística
- `DataContext`: Contexto de datos

**Estructura de páginas admin:**
- `AdminOverview`: Resumen del sistema con estadísticas
- `AdminTransactions`: Gestión de transacciones
- `AdminUsers`: Gestión de usuarios y socios
- `AdminMembers`: Lista de miembros del club
- `AdminReports`: Reportes y exportación de datos
- `AdminCategories`: Gestión de categorías de transacciones
- `AdminClubData`: Datos de configuración del club
- `AdminSystem`: Herramientas del sistema y mantenimiento

### Landing

Página de presentación y bienvenida:
- Hero section
- Características del sistema
- Información del club
- Call-to-action

**Ubicación:** `src/components/landing/`

**Componentes principales:**
- `Navbar`: Barra de navegación
- `Footer`: Pie de página
- `Hero`, `Features`, `About`, `CTA`: Secciones de la landing

## Flujo de Datos

### 1. Autenticación

```
LoginForm → AuthContext → localStorage
                ↓
        App (verifica auth)
                ↓
     AdminPanel (para todos los usuarios autenticados)
```

### 2. Datos de la Aplicación

```
DataContext (provider) → localStorage
        ↓
   useData() hook
        ↓
     AdminPanel
```

### 3. Estadísticas

```
DataContext → useStats hook → StatCard
```

## Ventajas de esta Arquitectura

1. **Simplicidad**: Estructura plana y fácil de entender
2. **Mantenibilidad**: Código organizado por tipo
3. **Claridad**: Fácil encontrar código relacionado
4. **Consistencia**: Todos los componentes en una ubicación

## Tecnologías Utilizadas

- **React 18**: Librería UI
- **TypeScript**: Tipado estático
- **Tailwind CSS 3.x**: Framework CSS
- **Vite**: Build tool
- **LocalStorage**: Persistencia de datos

## Sin Dependencias Externas

El proyecto NO usa:
- ❌ Supabase
- ❌ Redux
- ❌ React Router (navegación manual)
- ❌ Axios
- ❌ Form libraries

Usa únicamente:
- ✅ React hooks
- ✅ Context API
- ✅ LocalStorage API
- ✅ Fetch API (si fuera necesario)

## Personalización

### Cambiar colores

Editar `src/styles/globals.css`:
```css
:root {
  --color-green: #22c55e;
  --color-black: #000000;
  --color-white: #ffffff;
}
```

### Agregar nuevo componente

1. Crear carpeta en `components/mi-feature/`
2. Crear el componente
3. Importar en `App.tsx`

## Consideraciones de Rendimiento

- Usar `useMemo` para cálculos pesados
- Usar `useCallback` para funciones en props
- Evitar re-renders innecesarios
- LocalStorage es síncrono, usar con moderación

## Seguridad

- ⚠️ Las contraseñas se guardan en texto plano en localStorage
- ⚠️ Este sistema es para demostración/prototipo
- ⚠️ NO usar en producción sin implementar:
  - Hash de contraseñas
  - Backend real
  - HTTPS
  - Autenticación JWT
  - Validación del lado del servidor
