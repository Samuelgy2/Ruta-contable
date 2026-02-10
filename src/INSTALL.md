# Guía de Instalación - ClubFinance

Esta guía te ayudará a configurar el proyecto ClubFinance desde cero usando React y Tailwind CSS 3.x.

## Requisitos Previos

- Node.js 16.x o superior
- npm 8.x o superior (o yarn/pnpm como alternativa)
- Editor de código (recomendado: VS Code)

## Pasos de Instalación

### 1. Crear un nuevo proyecto React con Vite

```bash
npm create vite@latest clubfinance -- --template react-ts
cd clubfinance
```

### 2. Instalar Dependencias Base

```bash
npm install
```

### 3. Instalar Tailwind CSS 3.x

```bash
npm install -D tailwindcss@^3.4.0 postcss autoprefixer
npx tailwindcss init -p
```

### 4. Configurar Tailwind CSS

Edita el archivo `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
    },
  },
  plugins: [],
}
```

### 5. Configurar CSS Global

Crea el archivo `src/styles/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-green: #22c55e;
  --color-green-dark: #16a34a;
  --color-green-light: #86efac;
  --color-black: #000000;
  --color-white: #ffffff;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
  
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  
  --border-radius-sm: 6px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: var(--color-gray-900);
  background-color: var(--color-white);
}

/* Typography defaults - NO usar clases de Tailwind para estos */
h1 { font-size: 2.5rem; font-weight: 700; line-height: 1.2; margin-bottom: 1rem; }
h2 { font-size: 2rem; font-weight: 700; line-height: 1.3; margin-bottom: 0.875rem; }
h3 { font-size: 1.5rem; font-weight: 600; line-height: 1.4; margin-bottom: 0.75rem; }
h4 { font-size: 1.25rem; font-weight: 600; line-height: 1.4; margin-bottom: 0.625rem; }
h5 { font-size: 1rem; font-weight: 600; line-height: 1.5; margin-bottom: 0.5rem; }
p { font-size: 1rem; line-height: 1.6; margin-bottom: 1rem; }
```

Importa este archivo en `src/main.tsx`:

```typescript
import './styles/globals.css'
```

### 6. Estructura de Carpetas Recomendada

```
src/
├── features/              # Arquitectura por features
│   ├── auth/             # Feature de autenticación
│   │   ├── components/   # Componentes de auth
│   │   ├── contexts/     # Contextos de auth
│   │   ├── hooks/        # Hooks de auth
│   │   └── types.ts      # Tipos de auth
│   ├── dashboard/        # Feature de dashboard
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   └── utils/
│   └── landing/          # Feature de landing
│       ├── components/
│       └── pages/
├── shared/               # Componentes/utilidades compartidas
│   ├── components/
│   ├── types/
│   └── utils/
├── components/           # Componentes UI de terceros (shadcn)
│   └── ui/
├── styles/
│   └── globals.css
├── App.tsx
└── main.tsx
```

### 7. Dependencias Adicionales del Proyecto

```bash
# Ninguna dependencia externa es requerida
# El proyecto usa solo React, TypeScript y Tailwind CSS
```

### 8. Configurar tsconfig.json

Asegúrate de que `tsconfig.json` incluya:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 9. Ejecutar el Proyecto

```bash
# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Crea el build de producción
- `npm run preview` - Previsualiza el build de producción
- `npm run lint` - Ejecuta el linter

## Características del Proyecto

- ✅ **Sin dependencias externas**: Solo React, TypeScript y Tailwind CSS
- ✅ **LocalStorage**: Todos los datos se guardan localmente en el navegador
- ✅ **Responsive**: Diseño adaptable a móviles, tablets y escritorio
- ✅ **Sistema de autenticación**: Con roles de Usuario y Administrador
- ✅ **Gestión financiera**: Transacciones, miembros, cuotas y reportes
- ✅ **Colores institucionales**: Verde (#22c55e), Negro y Blanco

## Datos de Prueba

El sistema incluye usuarios de prueba:

**Administrador:**
- Usuario: `admin`
- Contraseña: `admin123`

**Usuario Regular:**
- Usuario: `usuario`
- Contraseña: `usuario123`

## Personalización

### Cambiar Colores Institucionales

Edita las variables CSS en `src/styles/globals.css`:

```css
:root {
  --color-green: #22c55e;      /* Color principal */
  --color-green-dark: #16a34a;  /* Color verde oscuro */
  --color-green-light: #86efac; /* Color verde claro */
}
```

### Agregar Logo del Club

1. Coloca tu logo en `public/images/logo/`
2. Edita el componente `Logo.tsx`
3. Cambia `hasLogo` a `true`
4. Actualiza la ruta en `logoPath`

### Personalizar Fondos de Formularios

Los formularios de Login y Register aceptan props para personalizar el fondo:

```typescript
<LoginForm 
  backgroundColor="#f0f0f0"  // O usa backgroundImage
  backgroundImage="url('/path/to/image.jpg')"
/>
```

## Solución de Problemas

### Tailwind no aplica estilos

1. Verifica que `globals.css` esté importado en `main.tsx`
2. Asegúrate de que el contenido en `tailwind.config.js` incluya todas las rutas
3. Reinicia el servidor de desarrollo

### Error de módulos no encontrados

```bash
rm -rf node_modules package-lock.json
npm install
```

### LocalStorage no persiste datos

- Verifica que el navegador permita LocalStorage
- Comprueba que no estés en modo incógnito
- Revisa la consola del navegador para errores

## Soporte y Documentación

Para más información sobre las tecnologías utilizadas:

- [React Documentation](https://react.dev/)
- [Tailwind CSS v3](https://tailwindcss.com/docs)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)

## Licencia

Este proyecto es completamente libre de derechos de autor y puede ser usado sin restricciones.
