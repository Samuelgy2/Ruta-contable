# Guía de Migración a Arquitectura por Features

## Cambios Realizados

### 1. Eliminación de Supabase
- ❌ Eliminada carpeta `/supabase/`
- ❌ Eliminada carpeta `/utils/supabase/`
- ✅ Sistema 100% basado en localStorage

### 2. Nueva Arquitectura de Carpetas

**Antes:**
```
components/
├── auth/
├── common/
├── landing/
└── ui/
contexts/
pages/
utils/
```

**Ahora:**
```
features/
├── auth/
│   ├── components/
│   ├── contexts/
│   └── pages/
├── dashboard/
│   ├── components/
│   ├── pages/
│   ├── contexts/
│   ├── hooks/
│   └── utils/
└── landing/
    ├── components/
    └── pages/
shared/
├── components/
├── types/
└── utils/
components/ui/ (sin cambios)
```

### 3. Actualización de Imports

Los imports han cambiado según la nueva estructura:

**Componentes de Auth:**
```typescript
// Antes
import { LoginForm } from './components/auth/LoginForm';
import { useAuth } from './contexts/AuthContext';

// Ahora
import { LoginForm } from './features/auth/components/LoginForm';
import { useAuth } from './features/auth/contexts/AuthContext';
```

**Componentes de Dashboard:**
```typescript
// Antes
import { Header } from './components/common/Header';
import { StatCard } from './components/common/StatCard';
import { useData } from './contexts/DataContext';

// Ahora
import { Header } from './features/dashboard/components/Header';
import { StatCard } from './features/dashboard/components/StatCard';
import { useData } from './features/dashboard/contexts/DataContext';
```

**Componentes de Landing:**
```typescript
// Antes
import { Navbar } from './components/common/Navbar';
import { Hero } from './components/landing/Hero';

// Ahora
import { Navbar } from './features/landing/components/Navbar';
import { Hero } from './features/landing/components/Hero';
```

**Componentes Compartidos:**
```typescript
// Antes
import { Logo } from './components/common/Logo';

// Ahora
import { Logo } from './shared/components/Logo';
```

### 4. Nuevas Props en Formularios

Los formularios de Login y Register ahora aceptan props para personalizar el fondo:

```typescript
// LoginForm
<LoginForm 
  onNavigate={handleNavigate}
  backgroundColor="#f0f9ff"  // Color sólido
/>

// O con imagen
<LoginForm 
  onNavigate={handleNavigate}
  backgroundImage="url('/backgrounds/login.jpg')"
/>

// RegisterForm
<RegisterForm 
  onNavigate={handleNavigate}
  onRegister={handleRegister}
  backgroundColor="#ecfdf5"
/>
```

## Mapa de Archivos Movidos

### Feature: Auth

| Archivo Original | Nuevo Ubicación |
|-----------------|-----------------|
| `/components/auth/LoginForm.tsx` | `/features/auth/components/LoginForm.tsx` |
| `/components/auth/RegisterForm.tsx` | `/features/auth/components/RegisterForm.tsx` |
| `/contexts/AuthContext.tsx` | `/features/auth/contexts/AuthContext.tsx` |
| `/pages/Login.tsx` | `/features/auth/pages/Login.tsx` |
| `/pages/Register.tsx` | `/features/auth/pages/Register.tsx` |

### Feature: Dashboard

| Archivo Original | Nuevo Ubicación |
|-----------------|-----------------|
| `/components/common/Header.tsx` | `/features/dashboard/components/Header.tsx` |
| `/components/common/StatCard.tsx` | `/features/dashboard/components/StatCard.tsx` |
| `/pages/UserDashboard.tsx` | `/features/dashboard/pages/UserDashboard.tsx` |
| `/pages/AdminPanel.tsx` | `/features/dashboard/pages/AdminPanel.tsx` |
| `/contexts/DataContext.tsx` | `/features/dashboard/contexts/DataContext.tsx` |
| `/hooks/useStats.ts` | `/features/dashboard/hooks/useStats.ts` |
| `/utils/export.ts` | `/features/dashboard/utils/export.ts` |
| `/utils/format.ts` | `/features/dashboard/utils/format.ts` |
| `/utils/validation.ts` | `/features/dashboard/utils/validation.ts` |

### Feature: Landing

| Archivo Original | Nuevo Ubicación |
|-----------------|-----------------|
| `/components/common/Navbar.tsx` | `/features/landing/components/Navbar.tsx` |
| `/components/common/Footer.tsx` | `/features/landing/components/Footer.tsx` |
| `/components/landing/Hero.tsx` | `/features/landing/components/Hero.tsx` |
| `/components/landing/Features.tsx` | `/features/landing/components/Features.tsx` |
| `/components/landing/About.tsx` | `/features/landing/components/About.tsx` |
| `/components/landing/CTA.tsx` | `/features/landing/components/CTA.tsx` |
| `/pages/LandingPage.tsx` | `/features/landing/pages/LandingPage.tsx` |

### Shared (Compartidos)

| Archivo Original | Nuevo Ubicación |
|-----------------|-----------------|
| `/components/common/Logo.tsx` | `/shared/components/Logo.tsx` |
| `/components/figma/ImageWithFallback.tsx` | `/shared/components/ImageWithFallback.tsx` |
| `/types/index.ts` | `/shared/types/index.ts` |
| `/utils/initialData.ts` | `/shared/utils/initialData.ts` |

### Sin Cambios

- `/components/ui/*` (shadcn components)
- `/styles/globals.css`
- `/App.tsx`

## Pasos para Migrar Código Existente

Si tienes cambios locales, sigue estos pasos:

### 1. Backup

```bash
# Crear backup
git commit -m "Backup antes de migración"
# o
cp -r src src_backup
```

### 2. Actualizar Imports en App.tsx

```typescript
// Actualizar
import { AuthProvider } from './features/auth/contexts/AuthContext';
import { DataProvider } from './features/dashboard/contexts/DataContext';
import { LandingPage } from './features/landing/pages/LandingPage';
import { Login } from './features/auth/pages/Login';
import { Register } from './features/auth/pages/Register';
import { UserDashboard } from './features/dashboard/pages/UserDashboard';
import { AdminPanel } from './features/dashboard/pages/AdminPanel';
```

### 3. Buscar y Reemplazar Imports

Usa el editor para buscar y reemplazar:

```bash
# En VSCode (Ctrl+Shift+H o Cmd+Shift+H)

# Auth
'./contexts/AuthContext' → './features/auth/contexts/AuthContext'
'./components/auth/' → './features/auth/components/'
'./pages/Login' → './features/auth/pages/Login'
'./pages/Register' → './features/auth/pages/Register'

# Dashboard
'./contexts/DataContext' → './features/dashboard/contexts/DataContext'
'./components/common/Header' → './features/dashboard/components/Header'
'./components/common/StatCard' → './features/dashboard/components/StatCard'
'./pages/UserDashboard' → './features/dashboard/pages/UserDashboard'
'./pages/AdminPanel' → './features/dashboard/pages/AdminPanel'
'./hooks/useStats' → './features/dashboard/hooks/useStats'
'./utils/export' → './features/dashboard/utils/export'
'./utils/format' → './features/dashboard/utils/format'
'./utils/validation' → './features/dashboard/utils/validation'

# Landing
'./components/common/Navbar' → './features/landing/components/Navbar'
'./components/common/Footer' → './features/landing/components/Footer'
'./components/landing/' → './features/landing/components/'
'./pages/LandingPage' → './features/landing/pages/LandingPage'

# Shared
'./components/common/Logo' → './shared/components/Logo'
'./components/figma/ImageWithFallback' → './shared/components/ImageWithFallback'
'./types' → './shared/types'
'./utils/initialData' → './shared/utils/initialData'
```

### 4. Verificar TypeScript

```bash
# Verificar errores de TypeScript
npm run build
# o
npx tsc --noEmit
```

### 5. Probar la Aplicación

```bash
npm run dev
```

## Nuevas Funcionalidades

### 1. Personalización de Fondos

```typescript
// Ejemplo: Login con fondo degradado
<LoginForm 
  onNavigate={nav}
  backgroundColor="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
/>

// Ejemplo: Register con imagen
<RegisterForm 
  onNavigate={nav}
  onRegister={reg}
  backgroundImage="url('https://images.unsplash.com/photo-...')"
/>
```

### 2. Sin Dependencias de Supabase

Todo el código de Supabase ha sido eliminado. El sistema ahora:
- ✅ Usa localStorage para todo
- ✅ No requiere configuración externa
- ✅ Funciona 100% offline
- ✅ Sin necesidad de API keys

## Tailwind CSS 3.x

El proyecto ahora usa Tailwind CSS 3.x:

```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Configuración personalizada
    },
  },
  plugins: [],
}
```

## Verificación Post-Migración

Verifica que todo funcione:

- [ ] La landing page carga correctamente
- [ ] El registro funciona
- [ ] El login funciona
- [ ] El dashboard de usuario carga
- [ ] El panel de admin carga
- [ ] Los datos persisten en localStorage
- [ ] Las estadísticas se calculan correctamente
- [ ] La exportación funciona
- [ ] No hay errores en la consola
- [ ] No hay errores de TypeScript

## Solución de Problemas

### Error: Module not found

Verifica que los imports usen las nuevas rutas:
```typescript
// ❌ Incorrecto
import { useAuth } from './contexts/AuthContext';

// ✅ Correcto
import { useAuth } from './features/auth/contexts/AuthContext';
```

### Error: Cannot find module 'supabase'

Elimina cualquier referencia a Supabase:
```bash
# Buscar referencias
grep -r "supabase" src/
# Eliminar imports y código relacionado
```

### Tailwind no funciona

Verifica:
1. `tailwind.config.js` existe
2. `globals.css` importa Tailwind
3. `main.tsx` importa `globals.css`

## Contacto y Soporte

Para dudas o problemas:
1. Revisa `/INSTALL.md` para instalación desde cero
2. Revisa `/ARCHITECTURE.md` para entender la estructura
3. Revisa los comentarios en el código
