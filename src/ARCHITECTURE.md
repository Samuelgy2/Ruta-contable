# Arquitectura del Proyecto - ClubFinance

Este proyecto utiliza una **arquitectura basada en features** (feature-based architecture) para mantener el código organizado, escalable y mantenible.

## Estructura de Carpetas

```
src/
├── features/                    # Features principales de la aplicación
│   ├── auth/                   # Feature de Autenticación
│   │   ├── components/         # Componentes específicos de auth
│   │   │   ├── LoginForm.tsx   # Formulario de inicio de sesión
│   │   │   └── RegisterForm.tsx # Formulario de registro
│   │   ├── contexts/           # Contextos de auth
│   │   │   └── AuthContext.tsx # Contexto global de autenticación
│   │   └── pages/              # Páginas de auth
│   │       ├── Login.tsx       # Página de login
│   │       └── Register.tsx    # Página de registro
│   │
│   ├── dashboard/              # Feature de Dashboard
│   │   ├── components/         # Componentes del dashboard
│   │   │   ├── Header.tsx      # Header con usuario y logout
│   │   │   └── StatCard.tsx    # Tarjeta de estadísticas
│   │   ├── pages/              # Páginas del dashboard
│   │   │   ├── UserDashboard.tsx  # Dashboard de usuario
│   │   │   └── AdminPanel.tsx     # Panel de administrador
│   │   ├── contexts/           # Contextos del dashboard
│   │   │   └── DataContext.tsx # Contexto global de datos
│   │   ├── hooks/              # Custom hooks
│   │   │   └── useStats.ts     # Hook para estadísticas
│   │   └── utils/              # Utilidades del dashboard
│   │       ├── export.ts       # Funciones de exportación
│   │       ├── format.ts       # Funciones de formato
│   │       └── validation.ts   # Validaciones
│   │
│   └── landing/                # Feature de Landing Page
│       ├── components/         # Componentes de la landing
│       │   ├── Navbar.tsx      # Barra de navegación
│       │   ├── Footer.tsx      # Pie de página
│       │   ├── Hero.tsx        # Sección hero principal
│       │   ├── Features.tsx    # Sección de características
│       │   ├── About.tsx       # Sección sobre nosotros
│       │   └── CTA.tsx         # Call-to-action
│       └── pages/              # Páginas de landing
│           └── LandingPage.tsx # Página principal
│
├── shared/                      # Código compartido entre features
│   ├── components/             # Componentes globales
│   │   ├── Logo.tsx            # Componente de logo
│   │   └── ImageWithFallback.tsx # Imagen con fallback
│   ├── types/                  # Tipos TypeScript globales
│   │   └── index.ts            # Definiciones de tipos
│   └── utils/                  # Utilidades globales
│       └── initialData.ts      # Datos iniciales del sistema
│
├── components/                  # Componentes de terceros
│   └── ui/                     # Componentes de shadcn/ui
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       └── ...
│
├── styles/                      # Estilos globales
│   └── globals.css             # CSS global con variables
│
├── App.tsx                      # Componente raíz
└── main.tsx                     # Punto de entrada
```

## Principios de la Arquitectura

### 1. Separación por Features

Cada feature es una unidad independiente que contiene:
- **Components**: Componentes UI específicos del feature
- **Pages**: Páginas completas del feature
- **Contexts**: Estado global del feature
- **Hooks**: Lógica reutilizable del feature
- **Utils**: Funciones utilitarias del feature
- **Types**: Tipos TypeScript del feature (opcional)

### 2. Shared (Compartido)

El código que se usa en múltiples features se coloca en `shared/`:
- Componentes genéricos (Logo, ImageWithFallback)
- Tipos compartidos
- Utilidades comunes

### 3. Components/UI

Librería de componentes de terceros (shadcn/ui) que no se modifican.

### 4. Convenciones de Nomenclatura

- **PascalCase**: Componentes, contextos, páginas (ej: `LoginForm.tsx`)
- **camelCase**: Funciones, variables, hooks (ej: `useStats.ts`)
- **kebab-case**: Archivos CSS (ej: `globals.css`)

## Features del Proyecto

### Auth (Autenticación)

Maneja todo lo relacionado con autenticación:
- Inicio de sesión
- Registro de usuarios
- Gestión de sesión (localStorage)
- Roles (admin/usuario)

**Componentes principales:**
- `LoginForm`: Formulario de login con props para personalizar fondo
- `RegisterForm`: Formulario de registro con props para personalizar fondo
- `AuthContext`: Proveedor de autenticación

**Props de personalización:**
```typescript
<LoginForm 
  onNavigate={(page) => ...}
  backgroundColor="#f5f5f5"  // Color de fondo
  backgroundImage="url(...)"  // O imagen de fondo
/>
```

### Dashboard

Panel de control para usuarios y administradores:
- Vista de estadísticas
- Gestión de transacciones
- Gestión de miembros
- Gestión de cuotas
- Reportes y exportación

**Componentes principales:**
- `UserDashboard`: Dashboard para usuarios regulares
- `AdminPanel`: Panel completo para administradores
- `Header`: Barra superior con usuario y logout
- `StatCard`: Tarjeta de estadística
- `DataContext`: Contexto de datos (transacciones, miembros, etc.)

### Landing

Página de presentación y bienvenida:
- Hero section
- Características del sistema
- Información del club
- Call-to-action

**Componentes principales:**
- `LandingPage`: Página principal
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
    UserDashboard o AdminPanel
```

### 2. Datos de la Aplicación

```
DataContext (provider) → localStorage
        ↓
   useData() hook
        ↓
UserDashboard / AdminPanel
```

### 3. Estadísticas

```
DataContext → useStats hook → StatCard
```

## Ventajas de esta Arquitectura

1. **Escalabilidad**: Fácil agregar nuevos features sin afectar los existentes
2. **Mantenibilidad**: Código organizado por funcionalidad
3. **Reutilización**: Componentes compartidos en `shared/`
4. **Testabilidad**: Cada feature se puede testear independientemente
5. **Colaboración**: Múltiples desarrolladores pueden trabajar en features diferentes
6. **Claridad**: Fácil encontrar código relacionado

## Cómo Agregar un Nuevo Feature

1. Crear carpeta en `features/`:
   ```
   features/nuevo-feature/
   ```

2. Agregar subcarpetas necesarias:
   ```
   features/nuevo-feature/
   ├── components/
   ├── pages/
   ├── contexts/ (opcional)
   ├── hooks/ (opcional)
   └── utils/ (opcional)
   ```

3. Implementar componentes y lógica

4. Si hay código compartido, moverlo a `shared/`

5. Importar y usar en `App.tsx`

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

Editar `styles/globals.css`:
```css
:root {
  --color-green: #22c55e;
  --color-black: #000000;
  --color-white: #ffffff;
}
```

### Agregar nuevo feature

1. Crear `features/mi-feature/`
2. Seguir la estructura de features existentes
3. Importar en `App.tsx`

### Personalizar fondos de formularios

```typescript
<LoginForm 
  backgroundColor="#e0f2f1"
  // o
  backgroundImage="url('/backgrounds/login.jpg')"
/>
```

## Guías de Estilo

### Importaciones

```typescript
// 1. React y hooks
import React, { useState, useEffect } from 'react';

// 2. Contextos
import { useAuth } from '../contexts/AuthContext';

// 3. Componentes locales
import { LoginForm } from '../components/LoginForm';

// 4. Shared
import { Logo } from '../../../shared/components/Logo';

// 5. Tipos
import type { User } from '../../../shared/types';

// 6. Utilidades
import { formatCurrency } from '../utils/format';
```

### Componentes

```typescript
interface MyComponentProps {
  title: string;
  onSubmit?: () => void;
}

export function MyComponent({ title, onSubmit }: MyComponentProps) {
  // Hooks primero
  const [state, setState] = useState('');
  
  // Funciones
  const handleClick = () => { ... };
  
  // Render
  return <div>...</div>;
}
```

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

## Próximos Pasos

- [ ] Agregar tests unitarios por feature
- [ ] Implementar lazy loading de features
- [ ] Agregar internacionalización (i18n)
- [ ] Migrar a backend real
- [ ] Implementar encriptación de datos
