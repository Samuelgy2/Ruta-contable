# Ruta Contable - Vercel Build Configuration

Esta aplicación cuenta con un frontend React Single-Page Application (SPA) y un backend Node.js/Express que se ejecutan independientemente.

## Estructura de Configuración

```
Ruta contable/
├─ frontend/                    # Aplicación React
│   ├── build/                 # Archivos estáticos compilados para Vercel
│   │   ├── index.html         # Punto de entrada
│   │   ├── assets/            # Recurso estáticos (css, js, imágenes)
│   │   └── ...
│   ├── src/                   # Código fuente (no requerido para Vercel)
│   ├── package.json
│   ├── vercel.json            # Configuración de reescritura
│   └── ...
├─ app.ts                       # Punto de entrada del builder de Vercel
├─ .gitignore
└─ ...
```

## Script de Build

El `app.ts` es el punto de entrada para Vercel. Verifica que:

1. Los archivos estáticos del frontend estén presentes en `frontend/build`
2. El backend esté disponible (opcional para Vercel)

## Reescritura Frontend

El `vercel.json` permite que las rutas dinámicas del frontend funcionen con el enrutamiento basado en archivos de React Router (si está usando ese enfoque).

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Variables de Entorno

Las variables de entorno necesarias son:

```env
DB_NAME=ruta_contable1
DB_USER=postgres
DB_PASSWORD=root
JWT_SECRET=tu_jwt_secret_super_seguro_aqui
CORS_ORIGIN=http://localhost:3000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tus_credenciales_email
EMAIL_PASS=tus_contraseñas_app_password
CLUB_NAME=Ruta Contable
```

## Configuración de Backend

El backend (Node.js/Express) debe ser configurado por el usuario:

### Opciones de Despliegue:

1. **Deploy Separado** (Recomendado): Deploy del backend como una aplicación Node.js independiente
2. **Deploy Integrado**: El backend también puede ser deployado con Vercel usando `app.ts`
3. **Docker**: Usando Docker Compose con Vercel

### Para Deploy en Vercel (Integrado):

```bash
# 1. Construir el frontend
cd frontend && npm run build

# 2. Configurar variables de entorno en Vercel dashboard
#    - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
#    - JWT_SECRET
#    - EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS

# 3. Desplegar con Vercel CLI
vercel --prod
```

### Para Docker + Vercel:

```dockerfile
# frontend/Dockerfile (producción)
FROM node:18-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/frontend/build/ /usr/share/nginx/html/
COPY frontend/vercel.json /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]

# backend/Dockerfile (opcional)
FROM node:18-alpine
WORKDIR /app
COPY backend/ ./
RUN npm ci
EXPOSE 3001
CMD ["node", "server.js"]
```

## Proceso de Build en Vercel

1. Vercel ejecuta `app.ts` como script de prepare
2. Verifica la estructura de archivos.
3. Construye los archivos estáticos para el frontend (si es necesario)
4. Desplega los archivos estáticos con la configuración de reescritura apropiada

## Deploy Múltiple Aplicación (Frontend y Backend)

Para aplicaciones completas con ambos frontend y backend, considere:

### 1. Dos deploys en Vercel:

- **Frontend**: Usando los archivos en `frontend/`
- **Backend**: Usando el servidor Node.js

### 2. Función Lambda Versión Serverless:

Cree un proxy único que redirija:

```javascript
export default async function handler(req, res) {
  // Redirigir backend a servicio externo
  // Servir frontend estático
}
```

## Scripts Útiles

```bash
# Construir el frontend para producción
cd frontend && npm run build

# Probar el frontend localmente (Vercel Local)
vercel dev

# Desplegar frontend a Vercel
vercel --prod

# Verificar la estructura de archivos del backend
ls -la backend/
ls -la frontend/build/
```

## Enrutamiento

- **Frontend**: Rutas basadas en archivos de React Router (o cualquier enrutador compatible)
- **Backend**: Rutas Express.js API (`/api/*`)

## Configuración de Middleware

### Frontend (Vercel):

- Dynamic Rendering
- Compresión GZIP (Automática)
- HEAD preflight requests para APIs originarias

### Backend (Node.js/Express):

- Helmet para headers de seguridad HTTP
- CORS configurado para orígenes específicos
- Rate limiting
- JWT para autenticación

## Migración desde Vercel Anteriores

Si estaba usando un solo repositorio para ambas aplicaciones:

```json
// old vercel.json
{
  "builds": [
    { "src": "frontend/next.config.js", "use": "@vercel/next" },
    { "src": "backend/server.js", "use": "@vercel/node" }
  ]
}
```

```json
// new vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Monitoreo y Logs

### Métricas de Vercel:

- Custom Metrics en dashboard
- Request Logs
- Error Tracking con Vercel Analytics

### Logs Backend:

```bash
docker compose logs -f backend
# o para backend integrado:
docker logs <backend-container-id>
```

## Problemas Comunes y Soluciones

### Error: "No entrypoint found"

**Causa**: Vercel no pudo encontrar el archivo de entrypoint.
**Solución**: Usar `app.ts` como entrypoint o asegurar que `frontend/build/index.html` exista.

### Error: Rutas de API no encontradas

**Causa**: El backend está separado del frontend.
**Solución**: Configurar proxy reverso o deploys múltiples.

### Error: CORS no configurado

**Solución**: Verificar que `cors` está configurado en backend y CORS_ORIGIN es correcto.

### Error: Base de Datos no conectada

**Solución**: Configurar correctamente las variables de entorno del backend.

## Checklist de Deploy

- [ ] Construir el frontend: `cd frontend && npm run build`
- [ ] Verificar los archivos estáticos estáticos en `frontend/build/`
- [ ] Verificar la configuración de reescritura en `frontend/vercel.json`
- [ ] Configurar variables de entorno en Vercel dashboard
- [ ] Desplegar a Vercel: `vercel --prod`
- [ ] Probar las rutas del frontend
- [ ] Verificar el health check del backend (si es integrado)
- [ ] Verificar alerts y métricas en Vercel dashboard

## Referencias

- [Documentación de Vercel Static Hosting](https://vercel.com/docs/edge-functions/edge-middleware)
- [Documentación de Vercel Node.js Runtime](https://vercel.com/docs/runtime/nodejs)
- [Escritura de Next.js](https://nextjs.org/docs/advanced-features/custom-app)
- [Reescritura de Vercel](https://vercel.com/docs/edge-network/rewrites)
- [Variables de Entorno de Vercel](https://vercel.com/docs/edge-network/environment-variables)

# Casos de Uso Específicos de Ruta Contable

Esta versión sigue los patrones de Ruta Contable:

## 1. Aplicación Web Multiple Página (MPA)

Para frameworks como Next.js o similares:

```tsx
// frontend/src/pages/index.tsx
export default function HomePage() {
  return (
    <div>
      <h1>Ruta Contable</h1>
      <p>Gestión financiera para clubes y organizaciones</p>
    </div>
  );
}
```

## 2. Enrutamiento Basado en Files (archivo src/pages/admin.tsx)

```tsx
// frontend/src/pages/admin.tsx
export default function AdminPage() {
  return <AdminDashboard />;
}
```

## 3. Gestión de Contabilidad

### Rutas principales del backend:

- `/api/transactions` - Gestión de transacciones
- `/api/socios` - Gestión de miembros/socios
- `/api/payments` - Pagos mensuales

### Rutas del frontend:

- `/` - Inicio (Login)
- `/dashboard` - Vista general
- `/admin` - Panel de administración
- `/reports` - Informes financieros

## 4. Politicas de Autenticación

```tsx
// middleware/auth.ts
export const authOptions = {
  secret: process.env.JWT_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
};
```

## 5. Configuración de Contabilidad Específica del Sector

```env
# Ruta Contable - Variables de Contabilidad Específicas del Sector
CURRENCY=COP
CLUB_TYPE=organization
TAX_RATE=0.19
FINANCIAL_YEAR_START=2024-01-01
ENABLE_INVOICES=true
ENABLE_BANK_INTEGRATION=true
```

## 6. Configuración de Base de Datos Específica del Sector

```sql
-- Tablas específicas de contabilidad para clubes
CREATE TABLE club_config (
  id SERIAL PRIMARY KEY,
  club_name VARCHAR(200) NOT NULL,
  currency VARCHAR(10) DEFAULT 'COP',
  tax_rate DECIMAL(5,2) DEFAULT 19.00,
  fiscal_year_start DATE DEFAULT '2024-01-01',
  enable_invoices BOOLEAN DEFAULT true,
  enable_bank_integration BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE member_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  monthly_fee DECIMAL(10,2) NOT NULL,
  category_type VARCHAR(50) DEFAULT 'regular',
  active BOOLEAN DEFAULT true
);
```

## 7. Configuración de Router

```typescript
// frontend/src/router/index.ts
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        path: '',
        element: <LoginPage />,
      },
      {
        path: 'admin',
        element: <AdminLayout />,
        children: [
          {
            path: '',
            element: <AdminDashboard />,
          },
          {
            path: 'transactions',
            element: <TransactionsPage />,
          },
          {
            path: 'members',
            element: <MembersPage />,
          },
        ],
      },
    ],
  },
]);
```

## 8. Configuración de API

```typescript
// frontend/src/services/api.ts
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.rutacontable.com'
  : 'http://localhost:3001';

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.json();
  },
  // ... otras métodos
};
```

## 9. Redirecciones de Verificación de Email

```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "redirects": [
    {
      "source": "/verificar-email/:token",
      "destination": "/verificar-email/:token",
      "status": 308
    }
  ]
}
```

## 10. Configuración de Monitoreo

```javascript
// app.ts
import { logger } from '@vercel/logging';

module.exports = async () => {
  const log = logger().prefix('Ruta Contable Builder');

  // Monitorear métricas de rendimiento
  const startTime = Date.now();
  
  const hasBuild = require('fs').existsSync('./frontend/build');
  
  const duration = Date.now() - startTime;
  log.info(`Build completed in ${duration}ms`);
  
  // Alertar si la build tarda más de 30 segundos
  if (duration > 30000) {
    log.warn('Build took longer than 30 seconds');
  }

  return { version: require('./package.json').version };
};
```

---

**Última Actualización:** Junio 2026
**Versión:** 2.1.0

Este archivo guía lo ayudará a desplegar con éxito Ruta Contable en Vercel con prácticas recomendadas para una aplicación web moderna.
