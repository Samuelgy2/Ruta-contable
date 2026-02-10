# ClubFinance - Sistema de Gestión Financiera

Sistema completo de gestión financiera para clubes y organizaciones, construido con React, TypeScript y Tailwind CSS 3.x.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build
```

## 📋 Características Principales

✅ **Sin dependencias externas** - Solo React + TypeScript + Tailwind 3.x  
✅ **Arquitectura por Features** - Código organizado y escalable  
✅ **LocalStorage** - Persistencia de datos sin backend  
✅ **Sistema de Autenticación** - Con roles Admin/Usuario  
✅ **Dashboard Completo** - Transacciones, miembros, cuotas  
✅ **Exportación de Datos** - CSV y JSON  
✅ **Personalización** - Colores y fondos configurables  
✅ **100% Responsive** - Funciona en todos los dispositivos  

## 📁 Estructura del Proyecto

```
src/
├── features/           # Features principales (auth, dashboard, landing)
│   ├── auth/          # Autenticación y registro
│   ├── dashboard/     # Dashboards de usuario y admin
│   └── landing/       # Página de inicio
├── shared/            # Componentes y utilidades compartidas
│   ├── components/    # Logo, ImageWithFallback
│   ├── types/         # Tipos TypeScript globales
│   └── utils/         # Utilidades comunes
├── components/ui/     # Componentes shadcn/ui
├── styles/            # CSS global
└── App.tsx            # Componente raíz
```

## 🛠️ Tecnologías

- **React 18** - Librería UI
- **TypeScript** - Tipado estático
- **Tailwind CSS 3.x** - Framework CSS
- **Vite** - Build tool y dev server
- **LocalStorage API** - Persistencia de datos

## 📚 Documentación

- **[INSTALL.md](./INSTALL.md)** - Guía completa de instalación desde cero
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detalles de la arquitectura por features
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Guía de migración desde versión anterior

## 🎨 Personalización

### Colores Institucionales

Edita `src/styles/globals.css`:

```css
:root {
  --color-green: #22c55e;
  --color-black: #000000;
  --color-white: #ffffff;
}
```

### Logo del Club

1. Coloca tu logo en `public/images/logo/club-logo.png`
2. Edita `src/shared/components/Logo.tsx`
3. Cambia `hasLogo` a `true`

### Fondos de Formularios

Los formularios aceptan props de personalización:

```typescript
// Color sólido
<LoginForm 
  onNavigate={nav}
  backgroundColor="#f0f9ff"
/>

// Imagen de fondo
<LoginForm 
  onNavigate={nav}
  backgroundImage="url('/backgrounds/login.jpg')"
/>
```

## 👤 Usuarios de Prueba

**Administrador:**
- Usuario: `admin`
- Contraseña: `admin123`

**Usuario Regular:**
- Usuario: `usuario`
- Contraseña: `usuario123`

## 🏗️ Arquitectura por Features

El proyecto usa arquitectura basada en features para mejor organización:

### Feature: Auth
- Formularios de login y registro
- Contexto de autenticación
- Gestión de sesión con localStorage

### Feature: Dashboard
- Dashboard de usuario
- Panel de administrador
- Gestión de transacciones, miembros y cuotas
- Estadísticas y reportes

### Feature: Landing
- Página de bienvenida
- Secciones: Hero, Features, About, CTA
- Navbar y Footer

## 📊 Funcionalidades del Dashboard

### Usuario Regular
- Ver transacciones propias
- Consultar estadísticas básicas
- Ver miembros
- Exportar reportes

### Administrador
- Gestión completa de usuarios
- Gestión de categorías
- Configuración del sistema
- Resetear datos
- Exportar todo a CSV/JSON
- Gestión de transacciones
- Gestión de miembros
- Control de cuotas

## 🔒 Seguridad

⚠️ **IMPORTANTE**: Este sistema es para demostración/prototipo.

**NO usar en producción sin:**
- Hash de contraseñas (bcrypt)
- Backend real con base de datos
- HTTPS obligatorio
- Autenticación JWT
- Validación del lado del servidor
- Protección CSRF
- Rate limiting

## 🚫 Lo que NO incluye

- ❌ Supabase (eliminado)
- ❌ Redux o state management externo
- ❌ React Router
- ❌ Axios o fetch libraries
- ❌ Form libraries (react-hook-form)
- ❌ Backend real

## ✅ Lo que SÍ incluye

- ✅ Context API para estado global
- ✅ LocalStorage para persistencia
- ✅ Navegación manual con estados
- ✅ Formularios controlados nativos
- ✅ TypeScript para tipado
- ✅ Tailwind 3.x para estilos

## 🔄 Migración desde Versión Anterior

Si tienes la versión anterior con Supabase:

```bash
# Ejecutar script de migración
chmod +x migrate.sh
./migrate.sh

# Seguir guía de migración
# Ver MIGRATION_GUIDE.md
```

## 📝 Scripts Disponibles

```json
{
  "dev": "Servidor de desarrollo",
  "build": "Build de producción",
  "preview": "Preview del build",
  "lint": "Ejecutar linter"
}
```

## 🤝 Contribución

Este es un proyecto de demostración. Siéntete libre de:
- Hacer fork
- Modificar según tus necesidades
- Usar en tus proyectos
- Compartir mejoras

## 📄 Licencia

Completamente libre de derechos de autor. Úsalo como quieras.

## 🆘 Soporte

Para problemas comunes:

1. **Tailwind no funciona**: Verifica que `globals.css` esté importado en `main.tsx`
2. **Errores de módulos**: Ejecuta `rm -rf node_modules && npm install`
3. **LocalStorage no persiste**: Verifica que no estés en modo incógnito

Para más ayuda:
- Revisa [INSTALL.md](./INSTALL.md)
- Revisa [ARCHITECTURE.md](./ARCHITECTURE.md)
- Revisa la consola del navegador

## 🎯 Próximos Pasos

Después de instalar:

1. ✅ Revisar la landing page
2. ✅ Probar el registro
3. ✅ Iniciar sesión
4. ✅ Explorar el dashboard
5. ✅ Personalizar colores y logo
6. ✅ Agregar tus propios datos

## 🌟 Características Destacadas

- **Sin configuración compleja**: Solo instalar y ejecutar
- **Sin cuenta de nada**: Todo funciona offline
- **Sin costos**: 100% gratuito
- **Sin límites**: Personaliza todo lo que quieras
- **Sin bloat**: Solo las librerías esenciales

---

**Creado con ❤️ para clubes y organizaciones**

Versión: 2.0.0 (Feature-based Architecture)  
Fecha: Octubre 2025  
Tailwind: 3.x  
React: 18.x
