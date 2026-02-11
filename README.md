# Sistema de Gestión Financiera del Club

Sistema completo de gestión financiera para clubes con autenticación de usuarios, gestión de transacciones, socios y reportes.

## 🎨 Características

- **Sistema de autenticación** con roles de Usuario y Administrador
- **Panel de Usuario**: Gestión de transacciones, consulta de socios y reportes básicos
- **Panel de Administrador**: Control total del sistema con 5 secciones principales
- **Gestión de transacciones**: Ingresos y gastos con categorización
- **Gestión de socios**: Membresías, cuotas y seguimiento
- **Exportación de datos**: CSV, JSON y reportes en texto
- **Diseño minimalista**: Colores institucionales verde, negro y blanco

## 🏗️ Arquitectura del Proyecto

```
/
├── App.tsx                 # Componente principal y enrutamiento
├── types/
│   └── index.ts           # Tipos TypeScript centralizados
├── contexts/
│   ├── AuthContext.tsx    # Contexto de autenticación
│   └── DataContext.tsx    # Contexto de datos del sistema
├── hooks/
│   └── useStats.ts        # Hook para estadísticas calculadas
├── utils/
│   ├── initialData.ts     # Datos iniciales del sistema
│   ├── export.ts          # Funciones de exportación
│   ├── format.ts          # Funciones de formateo
│   └── validation.ts      # Funciones de validación
├── components/
│   ├── Header.tsx         # Cabecera de la aplicación
│   ├── StatCard.tsx       # Tarjetas de estadísticas
│   ├── Logo.tsx           # Componente de logotipo
│   └── ui/                # Componentes Shadcn UI
├── pages/
│   ├── Login.tsx          # Página de inicio de sesión
│   ├── UserDashboard.tsx  # Panel de usuario
│   └── AdminPanel.tsx     # Panel de administrador
└── images/                # Recursos gráficos
    └── logo/              # Logotipos del club
```

## 👥 Credenciales de Acceso

### Administrador
- **Usuario**: admin
- **Contraseña**: admin123

### Usuario Regular
- **Usuario**: usuario
- **Contraseña**: usuario123

## 📊 Panel de Administrador

El panel de administrador incluye 5 secciones:

### 1. Resumen
- Estadísticas generales del sistema
- Información consolidada del club
- Métricas clave de ingresos, gastos y socios

### 2. Usuarios
- Crear, editar y eliminar usuarios
- Asignar roles (Usuario/Administrador)
- Gestión de estados (Activo/Inactivo)

### 3. Categorías
- Gestión de categorías de ingresos
- Gestión de categorías de gastos
- Activar/desactivar categorías

### 4. Datos del Club
- Nombre del club
- Información fiscal (RUT/ID)
- Datos de contacto (dirección, teléfono, email)
- Configuración de moneda y año fiscal

### 5. Sistema
- Exportar transacciones a CSV
- Exportar socios con cuotas a CSV
- Generar reporte financiero completo
- Backup completo del sistema en JSON
- Reiniciar sistema (restaurar datos iniciales)

## 💾 Almacenamiento

El sistema utiliza **localStorage** del navegador para persistir los datos:
- Todos los datos se guardan automáticamente
- La sesión persiste entre recargas
- Los datos permanecen hasta que se reinicie el sistema o se limpie el caché

## 🎨 Personalización

### Logotipo del Club
1. Coloca tu logotipo en `/images/logo/club-logo.png`
2. Edita `/components/Logo.tsx` y cambia `hasLogo` a `true`
3. El logotipo aparecerá en la esquina superior derecha

### Colores Institucionales
Los colores principales están definidos en:
- Verde: `#10b981` (green-500)
- Negro: `#000000`
- Blanco: `#ffffff`

## 📱 Características Técnicas

- **React** con TypeScript
- **Context API** para gestión de estado
- **Shadcn UI** para componentes
- **Tailwind CSS** para estilos
- **Lucide React** para iconos
- **Responsive Design** adaptado a móviles y escritorio

## 🔧 Funcionalidades Principales

### Gestión de Transacciones
- Crear ingresos y gastos
- Categorización automática
- Filtrado por tipo y búsqueda
- Historial completo con fechas

### Gestión de Socios
- Registro de miembros
- Seguimiento de cuotas
- Estados de pago
- Tipos de membresía

### Reportes y Exportación
- Reporte financiero completo
- Exportación de transacciones
- Exportación de socios
- Backup completo del sistema

## 🔐 Seguridad

**IMPORTANTE**: Este es un sistema de demostración que almacena datos en el navegador. Para uso en producción:
- Implementar backend con base de datos real
- Usar hash de contraseñas (bcrypt)
- Implementar tokens JWT para autenticación
- Agregar validación de entrada robusta
- Implementar HTTPS obligatorio

## 📝 Notas

- Los datos de ejemplo incluyen transacciones, socios y categorías predefinidas
- El sistema está optimizado para uso local sin conexión a internet
- Todas las funciones de exportación generan archivos descargables
- El diseño es completamente responsive
