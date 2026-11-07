# Ruta Contable

Aplicación web full-stack para la gestión financiera y administrativa de un club deportivo (BMX): socios, mensualidades, cartera, compras, inventario, facturación y un portal para el socio.

[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-green)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com)

> Este documento unifica la documentación técnica general del proyecto. La fuente de verdad del modelo de datos está en `docs/bd/` y la de los requisitos en `docs/matriz/` (ver [Documentación del repositorio](#documentación-del-repositorio)).

## Tabla de Contenidos

1. [Descripción](#descripción)
2. [Arquitectura](#arquitectura)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Primeros Pasos](#primeros-pasos)
5. [Estructura de Archivos](#estructura-de-archivos)
6. [Modelo de Datos](#modelo-de-datos)
7. [API Endpoints](#api-endpoints)
8. [Seguridad](#seguridad)
9. [Pruebas](#pruebas)
10. [Assets del Frontend](#assets-del-frontend)
11. [Despliegue](#despliegue)
12. [Documentación del repositorio](#documentación-del-repositorio)
13. [Limitaciones y mejoras pendientes](#limitaciones-y-mejoras-pendientes)

---

## Descripción

Ruta Contable gestiona los procesos contables y administrativos de un club:

- **Panel de administración:** resumen financiero, transacciones (ingresos y egresos) con categorías, reportes, socios, mensualidades, cartera morosa con tipos de cartera, asistencia, jersey, compras, inventario con kardex de movimientos, facturación y datos del club.
- **Usuarios y seguridad:** usuarios con rol Usuario o Administrador, recuperación de contraseña por correo, bloqueo de cuenta tras intentos fallidos y alertas del sistema para errores del servidor.
- **Portal del socio:** consulta de pagos y documentos, y pago en línea con PayPal (solo entorno de pruebas).
- **Landing editable:** página pública del club que el administrador puede editar desde el panel.

El proveedor de una compra o de una factura se registra como texto libre. No existe un módulo de proveedores (decisión D7 de la entrega: ver `docs/alineacion/DECISIONES_G1.md`).

---

## Arquitectura

### Visión general

```
Navegador (React + Vite + TypeScript)        → Vercel
        │   HTTP/JSON · API REST · JWT
        ▼
API Express 5 (Node.js)                      → Render
        │   pg.Pool directo (pooler de Supabase)
        ▼
PostgreSQL 17                                → Supabase (proyecto hfibhmntifttdududwpw)
```

Es una arquitectura **cliente-servidor en tres niveles** (presentación, lógica y datos) con API REST. Todo el código vive en un monorepo (`backend/` y `frontend/`). Un push a `main` despliega ambas mitades.

### Backend: rutas y controladores

El backend sigue un patrón de **rutas → controladores → PostgreSQL**, sin capa de modelos:

| Pieza | Responsabilidad |
|---|---|
| `server.js` | Arranque, CORS, helmet, límite de peticiones, `TRUST_PROXY`, verificación del esquema, `/health` y manejo global de errores. |
| `routes/` | Define las URL y aplica el middleware de autenticación y de roles. |
| `middleware/auth.js` | Verifica el JWT, comprueba que el usuario siga activo y valida el rol (`requireAuth`, `requireAdmin`, `requireRole`). |
| `controllers/` | Recibe la petición, valida los datos, aplica las reglas de negocio, ejecuta el SQL y responde. |
| `services/paypalClient.js` | Cliente de la pasarela PayPal. |
| `utils/` | JWT, formato y funciones auxiliares. |
| `db.js` | Un único `pg.Pool` compartido. No se usa ORM ni `@supabase/supabase-js`. |

Decisión de diseño: el acceso a datos queda dentro de los controladores, con consultas SQL parametrizadas. Parte de la lógica de negocio vive en funciones de la base de datos (por ejemplo `registrar_pago_mensual` y `registrar_pago_cartera`), que los controladores invocan. Es una limitación conocida: separar una capa de modelos queda como mejora futura (ver [Limitaciones](#limitaciones-y-mejoras-pendientes)).

### Frontend: capas de responsabilidad

`pages/` (pantallas) → `hooks/` (estado y datos) → `services/` (llamadas a la API) → `lib/` y `utils/`. La carpeta `features/` agrupa los módulos de autenticación, landing y administración, y `types/` contiene los tipos compartidos. La URL del backend se resuelve en un solo módulo: `frontend/src/services/apiConfig.ts`.

### Base de datos única

Existe **una sola base de datos, en Supabase**. No hay un Postgres local ni en Docker. Correr el backend en cualquier equipo con el `backend/.env` de producción **escribe en los datos reales**: para pruebas, apunta `backend/.env` a otra base.

---

## Stack Tecnológico

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.3.1 | UI |
| TypeScript | 5.x | Tipado estático |
| Vite | 6.x | Build tool / dev server |
| Tailwind CSS | 3.4.18 | Estilos |
| Radix UI | varias | Componentes accesibles sin estilos |
| Lucide React | 0.487.0 | Iconos SVG |
| Axios | 1.7.9 | Cliente HTTP |
| React Hook Form | 7.55.0 | Formularios |
| Recharts | 2.15.2 | Gráficos |
| @react-pdf/renderer | 4.3.2 | PDFs en cliente |
| Sonner | 2.0.3 | Toasts |

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 20 (imagen de producción) | Runtime |
| Express | 5.x | Framework HTTP / API REST |
| pg (node-postgres) | 8.x | Driver PostgreSQL directo (sin ORM, sin cliente Supabase) |
| jsonwebtoken | 9.x | Autenticación JWT |
| bcryptjs | 3.x | Hash de contraseñas (12 rounds) |
| helmet | 8.x | Cabeceras de seguridad HTTP |
| cors | 2.8.6 | Control de acceso entre orígenes |
| express-rate-limit | 8.x | Rate limiting |
| morgan | 1.x | Logging de peticiones |
| nodemailer | 9.x | Envío de correo (recuperación de contraseña) |
| nodemon | — | Hot-reload (solo desarrollo) |

### Infraestructura
| Componente | Uso |
|---|---|
| Docker + Docker Compose | Entorno de desarrollo local aislado |
| Supabase (Postgres 17) | Base de datos real del proyecto, `hfibhmntifttdududwpw` |
| Vercel | Hosting del frontend estático |
| Render | Hosting del backend (Node + Express) |

---

---

## Primeros Pasos

**Requisitos:** Node.js 20 y npm (o Docker Desktop), y acceso a la base de datos de Supabase.

### Variables de entorno

Copia `backend/.env.example` a `backend/.env` y completa los valores. Nunca subas `backend/.env` al repositorio.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PORT` | No (3001) | Puerto del backend. |
| `NODE_ENV` | No | `development` o `production`. |
| `TRUST_PROXY` | No (1) | Número entero de proxies de confianza delante del backend (Render: 1; local sin proxy: 0). Si no es un entero ≥ 0, el servidor se detiene. |
| `CORS_ORIGIN` | Sí en producción | Origen(es) permitidos del frontend. |
| `FRONTEND_URL` | No | URL del frontend, usada en los correos. |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Sí | Conexión al pooler de Supabase. |
| `DB_SSL` | No (true) | `false` solo para un Postgres local de pruebas. |
| `JWT_SECRET` | Sí | Secreto aleatorio de 32 caracteres o más. |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` | Para recuperar contraseña | Cuenta de correo saliente. |
| `PAYPAL_BASE_URL`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` | Sí | Solo entorno sandbox. El servidor no arranca sin estas cuatro. |
| `CURRENCY`, `CLUB_NAME`, `FISCAL_YEAR` | No | Valores por defecto del resumen (`FISCAL_YEAR` toma el año en curso). |

Para el frontend, `frontend/.env.example` define `VITE_API_URL` (por defecto `/api`) y `VITE_PAYPAL_CLIENT_ID`.

### Sin Docker

```bash
cd backend && npm install
cd ../frontend && npm install

# Terminal 1
cd backend && npm run dev
# Terminal 2
cd frontend && npm run dev
```

- Frontend: http://localhost:5173 (Vite, con proxy de `/api` al backend)
- Backend: http://localhost:3001

El backend **no crea ni modifica tablas al arrancar**: solo verifica que el esquema esperado exista (`verificarEsquema()`). Si falta algo, se detiene con un mensaje claro.

### Con Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

`docker-compose.yml` levanta solo el backend y el frontend y toma las variables de `backend/.env`. No hay servicio de Postgres: la base es la de Supabase. Para apagar: `docker compose down`.

### Crear el primer administrador

El backend ya no siembra un usuario `admin` con clave fija. Crea el primero con:

```bash
cd backend && npm run crear-admin
```

---

## Estructura de Archivos

```
Ruta contable/
├─ backend/
│   ├── controllers/       # lógica de cada módulo (18 controladores)
│   ├── routes/            # definición de endpoints (21 archivos)
│   ├── middleware/        # auth.js: JWT, usuario activo y roles
│   ├── services/          # paypalClient.js
│   ├── utils/             # jwt, formato, ayudas
│   ├── migrations/        # 0000_baseline.sql y migraciones .up/.down.sql
│   ├── scripts/           # crear-admin.js
│   ├── tests/             # pruebas con node --test
│   ├── db.js              # pool de PostgreSQL (pooler de Supabase)
│   ├── server.js          # servidor Express y montaje de rutas
│   └── .env.example
├─ frontend/
│   ├── src/
│   │   ├── App.tsx / main.tsx
│   │   ├── features/      # auth, landing, admin
│   │   ├── pages/         # admin y portal
│   │   ├── components/ · contexts/ · hooks/ · services/ · lib/ · utils/ · types/
│   ├── public/
│   └── vite.config.ts
├─ docs/
│   ├── alineacion/        # brechas, decisiones, seguridad e integración
│   ├── bd/                # diccionario, ER y estándar de la base
│   ├── matriz/            # matriz de requisitos v2
│   ├── pruebas/           # planes de prueba, evidencia y anomalías
│   └── fuentes/           # matriz original, plantillas y planes
├─ scripts/                # comprobadores de cobertura y de la matriz
├─ docker-compose.yml
├─ vercel.json
└─ README.md
```

---

## Modelo de Datos

El esquema `public` de Supabase tiene 34 tablas y 59 relaciones, con RLS activado en todas. La documentación se genera desde el catálogo de PostgreSQL y **no se edita a mano**:

- [`docs/bd/er.md`](docs/bd/er.md): diagrama entidad-relación (Mermaid).
- [`docs/bd/diccionario.md`](docs/bd/diccionario.md): tablas, columnas, tipos, claves y comentarios.
- [`docs/bd/bd-estandar.md`](docs/bd/bd-estandar.md): convenciones de nombres y decisiones de estandarización.
- [`docs/bd/CAMBIOS.md`](docs/bd/CAMBIOS.md): registro de cambios de la base.
- [`backend/migrations/0000_baseline.sql`](backend/migrations/0000_baseline.sql): estado base del esquema.

### Migraciones

Cada cambio de esquema es un par versionado `AAAAMMDD_nombre.up.sql` / `.down.sql` en `backend/migrations/`. El procedimiento es: ensayar dentro de un bloque `DO $$ ... RAISE EXCEPTION $$` (se revierte solo), aplicar con la herramienta de migraciones de Supabase, revisar los avisos de seguridad y regenerar `er.md` y `diccionario.md`.

### Particularidades

- **Proveedores:** la tabla `proveedores` se eliminó en dos fases (migraciones `20261105_proveedores_fase1_texto` y `fase2_eliminar`). `compra` y `factura` guardan el nombre en `proveedor_nombre` (texto). Un respaldo previo quedó en el esquema `respaldo`.
- **Tablas sin uso en la API:** `camerino`, `poliza_salud` y `config_mensualidad` están documentadas como reserva para versiones futuras. La configuración mensual real usa `system_data.dia_vencimiento_default`.
- **Columnas de pasarela:** la columna `proveedor` de `pagos_pasarela` guarda el nombre de la pasarela (`paypal`), no un proveedor de compras.
- **Deriva registrada:** las columnas de `factura` (`id_socio`, `monto_pagado`, `nro_factura`, `fecha_emision`, `fecha_vencimiento`, `nit_club`) y cinco tablas se crearon fuera del historial de migraciones. Están en la línea base, pero falta registrarlas como migración (ver `docs/alineacion/origen_datos_factura.md`).

---

## API Endpoints

Rutas montadas en `server.js` bajo `/api` (con límite general de peticiones), más `/health`:

| Prefijo | Archivo de rutas | Función |
|---|---|---|
| `/api/auth` | `auth.js`, `forgotPassword.js` | Inicio de sesión, registro y recuperación de contraseña |
| `/api/users` | `users.js` | Usuarios (administración) |
| `/api/socios` | `Member.js` | Socios |
| `/api/admin` | `admin.js` | Resumen financiero, alertas del sistema y reportes |
| `/api/admin/landing` | `landingAdmin.js` | Edición de la landing (administrador) |
| `/api/landing` | `landing.js` | Landing pública |
| `/api/transactions` | `Transaction.js` | Transacciones y exportación |
| `/api/compras` | `compras.js` | Compras y detalle de compra |
| `/api/inventario` | `inventario.js` | Productos, categorías de producto y movimientos (kardex) |
| `/api/cartera` | `cartera.js` | Cartera morosa y tipos de cartera |
| `/api/asistencia` | `asistencia.js` | Control de asistencia |
| `/api/periodos` | `periodos.js` | Meses de periodo (tabla `meses_periodo`) |
| `/api/pagos-mensuales` | `pagosMensuales.js` | Mensualidades |
| `/api/categories` | `categories.js` | Categorías de ingresos y egresos |
| `/api/club-data` | `clubData.js` | Datos del club (`system_data`) |
| `/api/portal` | `portal.js` | Portal del socio |
| `/api/pagos` | `pagos.js` | Pagos en línea con PayPal y webhook |
| `/api/jersey` | `jersey.js` | Pedidos de jersey |
| `/api/facturas` | `facturas.js` | Facturas y detalle de factura |
| `GET /health` | `server.js` | Estado del servidor y de la base de datos (503 si la base no responde) |

---

## Seguridad

### Medidas implementadas

| Capa | Implementación |
|---|---|
| Cabeceras | `helmet` |
| CORS | Lista de orígenes desde `CORS_ORIGIN` |
| Límite de peticiones | General en `/api`; inicio de sesión 10 por 15 min; registro 5 por 15 min; recuperación de contraseña 5 y 10 por 15 min |
| Contraseñas | bcrypt (coste 12 en inicio de sesión y registro; 10 para el código OTP) |
| JWT | Expira a 1 día; se firma y verifica con algoritmo, emisor y audiencia fijos |
| Cuenta | Bloqueo de 15 minutos tras 5 intentos fallidos; un usuario inactivo no inicia sesión; el middleware vuelve a consultar que el usuario siga activo |
| Recuperación | El `reset_token` se guarda como hash SHA-256 |
| SQL | Consultas parametrizadas |
| Arranque | Validación de variables obligatorias, de `TRUST_PROXY` y del esquema; sin DDL ni usuario sembrado |
| Errores | Manejador global; los errores 5xx se registran en `alerta_sistema` y aparecen en la campana del panel |
| Registro de accesos | `morgan` y registro de intentos fallidos |
| Secretos | `.env`, `node_modules` y logs ya no se versionan |

El detalle de la auditoría está en [`docs/alineacion/seguridad.md`](docs/alineacion/seguridad.md).

### Por qué las políticas RLS de Supabase no son la capa de autorización real

`backend/db.js` conecta a Postgres directo con `pg.Pool` y las credenciales de `backend/.env`. No se usa `@supabase/supabase-js` en el backend ni en el frontend: toda la aplicación pasa por este backend Express.

El rol `postgres.<project-ref>` que usa el pool tiene `rolbypassrls = true`: **ignora RLS siempre**. Por eso la autorización real vive en el middleware de Express (JWT y roles). Aun así, **todas las tablas de `public` tienen RLS activado**, de modo que la API de datos de Supabase (PostgREST) no las expone a un cliente anónimo.

**Si esto cambia:** si se agrega un cliente que hable directo con Supabase (frontend con `@supabase/supabase-js`, una edge function o un servicio con clave `anon` o `service_role`), RLS pasaría a ser la única barrera y las tablas necesitarían políticas reales antes de exponer esa vía.

### Limitaciones de seguridad conocidas

- Los archivos `.env` estuvieron versionados antes del 5 de noviembre de 2026 y **siguen en el historial de git**. Se decidió no rotar las credenciales por tiempo de entrega: es un riesgo aceptado.
- El token de sesión se guarda en `localStorage` y no hay refresh tokens ni protección CSRF.
- El contenedor de producción (`backend/Dockerfile`) corre como root y sin healthcheck.

---

## Pruebas

```bash
cd backend && npm test
```

Usa el ejecutor nativo de Node (`node --test`). Los archivos de `backend/tests/` cubren JWT, la landing y los requisitos faltantes. La prueba de landing necesita un esquema temporal en Supabase y se niega a correr contra `public`: para activarla, define `TEST_ESQUEMA_TEMPORAL=1`.

Los planes de prueba funcionales (casos, parámetros y casos límite) están en `docs/fuentes/planes/` y `docs/pruebas/`, con la evidencia en `docs/pruebas/evidencia/`.

Comprobadores de coherencia con la matriz:

```bash
python scripts/check_cobertura.py   # cada requisito cubierto una vez, sin evidencias vacías
python scripts/check_matriz.py      # matriz v2 sin números repetidos ni celdas sueltas
```

---

## Assets del Frontend

### `frontend/src/images/`

- `logo/` — logos del club y de la app
- `icons/` — iconos personalizados
- `backgrounds/` — imágenes de fondo
- `avatars/` — fotos de perfil por defecto
- `documents/` — imágenes de documentos o reportes

Formatos recomendados: logo PNG con fondo transparente (mín. 256×256px, máx. 512×512px), iconos SVG o PNG en varios tamaños, fondos JPG/WebP optimizados, avatares cuadrados.

```jsx
import logo from '/images/logo/club-logo.png'
// o
<ImageWithFallback src="/images/logo/club-logo.png" alt="Logo del Club" />
```

### Activar el logo del club

1. Colocar el archivo en `frontend/src/images/logo/club-logo.png` (PNG transparente, 256–512px)
2. En `components/Logo.tsx`, cambiar `const hasLogo = false` a `const hasLogo = true`
3. Si el nombre de archivo difiere, ajustar `logoPath` en el mismo componente
4. El logo se aplica automáticamente en header, login y donde se use `<Logo />`

Para logos vectoriales: guardar como `.svg` en la misma carpeta y actualizar la ruta en `Logo.tsx`.

---


---

## Despliegue

El repo es un **monorepo** (`backend/` + `frontend/`) y cada mitad se despliega en una plataforma distinta. Un `push` a `main` dispara el despliegue en ambas: no hay ningún paso manual.

| Pieza | Plataforma | URL de producción |
|---|---|---|
| Frontend (React + Vite, estático) | Vercel | https://ruta-contable-samuelgy2s-projects.vercel.app |
| Backend (Node + Express) | Render | https://ruta-contable.onrender.com |
| Base de datos (PostgreSQL) | Supabase | proyecto `hfibhmntifttdududwpw` |

Comprobación rápida de que el backend está vivo:

```bash
curl https://ruta-contable.onrender.com/health
# {"status":"OK","message":"Servidor funcionando","db":"OK"}
```

> **Ojo con `https://ruta-contable.vercel.app`.** Esa URL **no pertenece a este proyecto** y responde `404: DEPLOYMENT_NOT_FOUND`. Es el enlace que figura en el campo *About* del repositorio en GitHub, y por eso parece que el despliegue está caído. La URL buena es la de la tabla de arriba.

### Configuración de Vercel

El despliegue está descrito en `vercel.json`, en la **raíz** del repositorio:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "installCommand": "npm install --prefix frontend",
  "buildCommand": "npm run build --prefix frontend",
  "outputDirectory": "frontend/build",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- `outputDirectory` es `frontend/build` y **no** `frontend/dist` porque `frontend/vite.config.ts` define `build.outDir: 'build'`.
- Los `rewrites` mandan cualquier ruta a `index.html`: sin ellos, recargar en `/login` o `/admin` da 404.
- **El Root Directory del panel de Vercel debe quedarse en `/`.** Si se cambia a `frontend`, Vercel ignora el `vercel.json` de la raíz y usa `frontend/vercel.json`, que solo contiene el rewrite: se pierden los comandos de build.

### Variables de entorno (pendientes de configurar a mano)

| Plataforma | Variable | Valor |
|---|---|---|
| Vercel | `VITE_API_URL` | `https://ruta-contable.onrender.com` |
| Render | `CORS_ORIGIN` | `https://ruta-contable-samuelgy2s-projects.vercel.app` |

`VITE_API_URL` es una variable de **build**: Vite la sustituye al compilar, así que después de crearla o cambiarla hay que **volver a desplegar** para que surta efecto.

### Cómo se resuelve la URL del backend

Un único módulo decide a qué backend apunta el frontend: `frontend/src/services/apiConfig.ts`.

```ts
import { API_URL } from '../../services/apiConfig';

const res = await fetch(`${API_URL}/admin/overview`, { ... });
```

- `API_BASE` es el origen del backend, sin barra final y sin sufijo.
- `API_URL` es `API_BASE + '/api'`, o sea la raíz de la API REST: las rutas cuelgan de ahí sin repetir `/api`.
- Sin `VITE_API_URL` definida: en desarrollo se usa ruta relativa y el proxy de `vite.config.ts` reenvía `/api` al `localhost:3001`; en producción se recurre al backend de Render.

**No leas `import.meta.env.VITE_API_URL` en componentes nuevos.** Importa `API_URL` de `apiConfig.ts`. Antes había seis archivos resolviendo la URL por su cuenta con valores por defecto distintos, y parte de la aplicación acababa llamando a `http://localhost:3001` en producción, es decir al equipo de quien visitaba la página.

### Checklist de despliegue

- [ ] Root Directory de Vercel = `/`
- [ ] `VITE_API_URL` configurada en Vercel + redeploy ejecutado
- [ ] `CORS_ORIGIN` configurada en Render
- [ ] Rutas internas (`/login`, `/admin`) cargan sin 404
- [ ] `GET /health` del backend responde `OK` con `"db":"OK"` (devuelve 503 si la base no responde)
- [ ] Variables del backend completas (ver [Variables de entorno](#variables-de-entorno)): sin las de PayPal o con `JWT_SECRET` ausente el servidor no arranca
- [ ] El esquema de la base coincide con el esperado: al iniciar, `verificarEsquema()` en `server.js` compara tablas y columnas y detiene el arranque si falta alguna

### Bundle grande (advertencia real del build)

```
assets/index-C_u4hTQW.js   1,938.82 kB │ gzip: 633.92 kB
```

Recomendación: code-splitting con lazy loading de rutas para bajar el chunk principal de 500 kB.

### Problemas comunes

| Error | Causa | Solución |
|---|---|---|
| `404: DEPLOYMENT_NOT_FOUND` | Se está entrando por `ruta-contable.vercel.app`, que no es de este proyecto | Usar `https://ruta-contable-samuelgy2s-projects.vercel.app` y corregir el campo *About* del repositorio |
| El build no ejecuta `npm run build` | Root Directory apunta a `frontend`, así que se aplica `frontend/vercel.json` | Devolver el Root Directory a `/` |
| Rutas internas dan 404 al recargar | Falta el rewrite SPA | Confirmar el bloque `rewrites` de `vercel.json` |
| Las peticiones van a `localhost:3001` | `VITE_API_URL` no estaba definida al compilar | Definirla en Vercel y **volver a desplegar** |
| CORS bloquea las peticiones | `CORS_ORIGIN` de Render no incluye el dominio de Vercel | Actualizar `CORS_ORIGIN` en Render |
| Primera petición muy lenta | El plan gratuito de Render duerme el servicio tras un rato inactivo | Esperar al arranque en frío (~30 s) |
| Base de datos no conectada | Variables del backend mal configuradas | Revisar `DB_HOST`/`DB_USER`/`DB_PASSWORD` en Render |
| El backend se detiene al iniciar con un mensaje de esquema | Falta una tabla o columna que `verificarEsquema()` exige | Aplicar las migraciones pendientes de `backend/migrations/` en Supabase |

---


---

## Documentación del repositorio

| Ruta | Contenido |
|---|---|
| `docs/matriz/matriz_v2.xlsx` y `CAMBIOS_MATRIZ.md` | Matriz de requisitos alineada con el sistema y registro de cambios |
| `docs/alineacion/brechas.csv` | Comparación requisito por requisito entre la matriz y el código |
| `docs/alineacion/DECISIONES_G1.md` | Decisiones tomadas sobre las brechas |
| `docs/alineacion/seguridad.md` | Auditoría de seguridad e infraestructura |
| `docs/alineacion/INTEGRACION.md` | Registro de la integración de las ramas de la entrega |
| `docs/bd/` | Diccionario, diagrama ER y estándar de la base de datos |
| `docs/pruebas/` y `docs/fuentes/planes/` | Planes de prueba y evidencia |
| `docs/fuentes/plantillas/` | Plantillas de los manuales y del plan de pruebas |

---

## Limitaciones y mejoras pendientes

- [ ] Capa de modelos para separar el acceso a datos de los controladores.
- [ ] Registrar como migración las columnas de `factura` y las tablas creadas fuera del historial.
- [ ] Renombrar las tablas con nombres en inglés para uniformar el esquema.
- [ ] Rotar las credenciales que estuvieron versionadas.
- [ ] HTTPS propio, protección CSRF y refresh tokens.
- [ ] Más pruebas automáticas de las reglas de negocio.
- [ ] Documentación de la API con OpenAPI.
- [ ] Code-splitting del frontend (el bundle principal supera 1,9 MB).
- [ ] Contenedor de producción sin privilegios de root y con healthcheck.

**Última actualización:** 2026-11-06
