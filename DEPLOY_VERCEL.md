# Guía de Despliegue en Vercel - Ruta Contable (Frontend)

## Configuración Requerida: Opción A (Root Directory)

Como el repositorio tiene una estructura **monorepo** (`backend/` + `frontend/`), **debes configurar el "Root Directory" en Vercel** para que apunte a la carpeta del frontend.

---

## Pasos Exactos en el Dashboard de Vercel

### 1. Acceder a la Configuración
1. Entra a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto **`Ruta-contable`** (o el nombre que tenga)
3. Ve a la pestaña **Settings** (Configuración) → **General**

### 2. Cambiar Root Directory
1. Busca la sección **Root Directory** (Directorio Raíz)
2. Por defecto dice: `/` (raíz del repo)
3. **Cámbialo a:** `frontend`
4. Haz clic en **Save** (Guardar)

> **Importante:** Este cambio le dice a Vercel: *"El package.json, vite.config.ts y el código a compilar están dentro de `frontend/`, no en la raíz"*.

### 3. Verificar Build & Output Settings (Opcional - Auto-detectado)
Tras guardar el Root Directory, Vercel recargará la página. Verifica que detecte automáticamente:
- **Framework Preset:** `Vite`
- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Install Command:** `npm install`

> Si no los detecta, ingrésalos manualmente en la misma página (sección **Build & Development Settings**).

### 4. Variables de Entorno (Si las necesitas)
Si tu frontend usa variables de entorno (ej. `VITE_API_URL`), agrégalas en:
**Settings** → **Environment Variables**

| Name | Value | Environments |
|------|-------|--------------|
| `VITE_API_URL` | `https://tu-backend.railway.app` | Production, Preview, Development |

### 5. Redesplegar (Redeploy)
1. Ve a la pestaña **Deployments**
2. Busca el último despliegue (el que falló con `No entrypoint found`)
3. Haz clic en los **tres puntos (⋮)** → **Redeploy**
4. O simplemente haz un `git push` nuevo para trigger automático.

---

## Verificación Exitosa

En los logs del nuevo despliegue deberías ver:

```
Cloning github.com/Samuelgy2/Ruta-contable ...
Root Directory: frontend
Installing dependencies...
npm install
Running build command: npm run build
vite build
Output directory: build
Uploading build artifacts...
Deploying...
Ready! https://ruta-contable-xxx.vercel.app
```

---

## Notas Importantes

### ⚠️ Backend NO se despliega aquí
- Este proyecto Vercel **solo sirve el frontend estático** (React + Vite).
- El `backend/` (Node.js + Express + PostgreSQL) **debe ir en otra plataforma**:
  - **Railway** / **Render** / **Fly.io** (recomendados para Node.js + DB)
  - O un VPS con Docker (usando tu `docker-compose.yml`)

### 🔗 Conexión Frontend → Backend
Una vez tengas el backend desplegado (ej. `https://ruta-contable-api.railway.app`):
1. Actualiza `VITE_API_URL` en **Environment Variables** de Vercel.
2. Redeploy.

### 📦 Tamaño del Bundle (Advertencia Actual)
```
assets/index-C_u4hTQW.js   1,938.82 kB │ gzip: 633.92 kB
```
**Recomendación futura:** Implementar *code-splitting* (lazy loading de rutas) para reducir el chunk principal por debajo de 500 kB.

---

## Checklist Rápido
- [ ] Root Directory = `frontend` guardado en Settings
- [ ] Build Command = `npm run build`
- [ ] Output Directory = `build`
- [ ] Variables de entorno (`VITE_API_URL`) configuradas
- [ ] Redeploy ejecutado
- [ ] Sitio carga sin errores 404 en rutas internas (ej. `/login`, `/admin`)

---

**¿Problemas?** Si tras el redeploy sigues viendo errores:
1. Revisa la pestaña **Functions** en el dashboard (debe estar vacía para sitio estático).
2. Confirma que `vercel.json` **NO existe en la raíz** (o que no contradiga la config).
3. Borra la caché de build en Vercel: Settings → General → **Clear Build Cache** → Redeploy.