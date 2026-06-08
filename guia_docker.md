# 📚 Documentación Docker - Ruta Contable

---

## 🐳 ¿Qué es Docker?

Docker es una plataforma que permite empaquetar aplicaciones junto con todas sus dependencias (librerías, configuraciones, runtime) en contenedores ligeros y portables. Un **contenedor** es como una "caja" que contiene todo lo necesario para que tu aplicación se ejecute de forma idéntica en cualquier entorno: tu máquina local, la de un compañero o un servidor en la nube.

### Conceptos básicos

| Término | Descripción |
|---------|-------------|
| **Imagen** | Plantilla inmutable que define cómo se construye un contenedor (código + dependencias + config). |
| **Contenedor** | Instancia en ejecución de una imagen. Es el proceso vivo. |
| **Dockerfile** | Archivo de texto con las instrucciones para armar una imagen. |
| **Docker Compose** | Herramienta para definir y correr múltiples contenedores a la vez (backend, frontend, base de datos). |
| **Volumen** | Mecanismo de almacenamiento persistente que sobrevive incluso si el contenedor se elimina. |
| **Bind Mount** | Montaje directo de una carpeta de tu máquina host dentro del contenedor. Útil para desarrollo. |
| **Red** | Docker crea una red privada entre los servicios del `docker-compose.yml` para que se comuniquen por nombre. |

---

## 📦 ¿Qué es Docker Compose?

Docker Compose es una herramienta que usa un archivo `docker-compose.yml` (o `.yaml`) para definir **todos los servicios** de tu aplicación en un solo lugar. En vez de levantar cada contenedor con comandos largos y separados (`docker run ...`), con un solo comando levantás todo el stack.

### Estructura del archivo

- **`version`**: Versión de la sintaxis de Compose (`3.9` es la más usada).
- **`services`**: Cada servicio es un contenedor (ej: `postgres`, `backend`, `frontend`).
- **`volumes`**: Volúmenes persistentes compartidos entre servicios.

---

## 🧩 ¿Cómo funcionan los volúmenes?

Los volúmenes son la forma que tiene Docker de **guardar datos persistente**. Sin volúmenes, cuando un contenedor se elimina, toda la información dentro se pierde.

### Tipos de almacenamiento en Docker

| Tipo | Cuándo usarlo | Vida útil |
|------|---------------|-----------|
| **Volumen nombrado** (`pgdata:/var/lib/postgresql/data`) | Datos que deben persistir entre reinicios y que no necesitás editar desde el host. | Persistente (independiente del ciclo de vida de los contenedores) |
| **Bind mount** (`.:/app`) | Código fuente en desarrollo: querés que los cambios locales se reflejen instantáneamente dentro del contenedor. | Mientras exista la carpeta en el host |
| **Volumen anónimo** (`/app/node_modules`) | Cache o archivos generados dentro del contenedor que no querés mezclar con el host. | Se elimina con `docker compose down` |

### Diferencia clave

- **Volúmenes nombrados**: Docker los administra, los guarda en `/var/lib/docker/volumes`. Ideales para bases de datos.
- **Bind mounts**: Mapean una ruta exacta de tu disco a un path dentro del contenedor. Ideales para desarrollo.

---

## 🔥 Hot-reload: ¿Cómo se sincronizan los cambios?

El **hot-reload** es la capacidad de ver cambios en tu código reflejados instantáneamente en el navegador o servidor sin tener que reiniciar manualmente el proceso.

### En el backend

- El código fuente está montado en el contenedor con un **bind mount** (`./backend:/app`).
- **nodemon** detecta cambios en archivos `.js` y reinicia automáticamente el servidor Express.
- Variables como `CHOKIDAR_USEPOLLING=true` y `WATCHPACK_POLLING=true` fuerzan a las herramientas de observación de archivos a usar *polling* en vez de events nativos del sistema operativo, porque en Docker (especialmente en Windows/Mac) los events de FS a veces no llegan correctamente.

### En el frontend

- Vite levanta un servidor de desarrollo **dentro del contenedor** en el puerto 5173.
- El bind mount (`./frontend:/app`) hace que Vite detecte cambios en los archivos y recargue el navegador automáticamente.
- El navegador accede a la app por `localhost:3000` porque Docker mapea el puerto `5173` del contenedor al `3000` del host.

---

## ⚙️ Comando `docker compose up --build` paso a paso

Cuando ejecutás `docker compose up --build`, Docker hace lo siguiente:

1. **Lee el archivo `.env`** en la misma carpeta que `docker-compose.yml` y carga las variables (DB_NAME, DB_USER, JWT_SECRET, etc.).
2. **Verifica la red**: Si no existe una red para el proyecto, la crea.
3. **Arma las imágenes**:
   - Ejecuta los `Dockerfile.dev` de `backend` y `frontend`.
   - Instala dependencias (npm install).
   - Si usás `--build`, reconstruye las imágenes desde cero ignorando el cache anterior.
4. **Crea los contenedores**:
   - Levanta `postgres`, espera el healthcheck (`pg_isready`).
   - Levanta `backend`, que espera a que `postgres` esté healthy.
   - Levanta `frontend`, que espera a que `backend` esté corriendo.
5. **Monta los volúmenes**:
   - `pgdata` para persistir la base de datos.
   - `./backend:/app` y `./frontend:/app` para hot-reload.
   - Volúmenes anónimos para `node_modules` para no sobrescribir los módulos instalados dentro del contenedor.
6. **Inyecta variables de entorno** a cada servicio según la sección `environment` del compose.
7. **Ejecuta el comando de arranque** (`npm run dev` en cada servicio).

---

## 🚀 Cuándo usar `--build` y cuándo no

| Escenario | Comando | Motivo |
|-----------|---------|--------|
| **Primera vez** que levantas el proyecto | `docker compose up --build` | Necesitás compilar las imágenes por primera vez. |
| **Cambiaste el Dockerfile** (agregaste librerías, cambiaste la base) | `docker compose up --build` | Para reconstruir la imagen con los cambios. |
| **Solo cambiaste código fuente** (JS, CSS, vistas) | `docker compose up` | No necesitás rebuild, el bind mount ya sincroniza los cambios. |
| **Agregaste `npm install` de una nueva dependencia** | `docker compose up --build` | Hay que reinstalar dentro de la imagen. |

---

## 🏗️ Desarrollo vs Producción

| Aspecto | Desarrollo | Producción |
|---------|------------|------------|
| **Dockerfile** | `Dockerfile.dev` (con nodemon, sin copiar código) | `Dockerfile` o `Dockerfile.prod` (copia todo, optimizado) |
| **Hot-reload** | Activado | Desactivado |
| **Node modules** | Montados como volumen anónimo (cache local) | Instalados dentro de la imagen |
| **Puertos** | 3000:5173 (frontend) y 3001:3001 (backend) | 80:80 (todo por nginx) |
| **Variables de entorno** | `.env` raíz para desarrollo | Secrets inyectados por CI/CD |
| **Logs** | Detallados (nivel `development`) | Solo warnings y errores |

---

## 📋 Paso a paso para usar Docker en desarrollo

### 1. Prerrequisitos

Antes de empezar, asegurate de tener instalado:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows, Mac o Linux)
- git (opcional, para clonar el proyecto)

Para verificar la instalación:

```bash
docker --version
docker compose version
```

Ambos comandos deben mostrar un número de versión sin errores.

### 2. Configurar variables de entorno

Creá o editá el archivo `.env` en la raíz del proyecto. Este archivo **no se sube a git** (está en `.gitignore`) y contiene las credenciales que Docker Compose inyecta a los servicios.

```env
DB_NAME=ruta_contable1
DB_USER=postgres
DB_PASSWORD=root
JWT_SECRET=tu_jwt_secret_super_seguro_aqui
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
CLUB_NAME=Ruta Contable
```

> **Importante:** El `.env` de Docker es distinto del `backend/.env`. El primero lo usa `docker-compose`, el segundo lo usa el backend cuando lo ejecutás con `npm start` fuera de Docker.

### 3. Levantar el stack completo

```bash
# Primera vez o después de agregar dependencias/paquetes:
docker compose up --build

# Si solo cambiaste código (sin tocar Dockerfile ni package.json):
docker compose up
```

Esto levanta:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001
- **Base de datos:** localhost:5432

Para ver los logs de todos los servicios en tiempo real:

```bash
docker compose logs -f
```

Para ver solo los logs del backend:

```bash
docker compose logs -f backend
```

### 4. Comandos básicos

| Comando | Descripción |
|---------|-------------|
| `docker compose up` | Levanta los servicios en primer plano. |
| `docker compose up -d` | Levanta los servicios en segundo plano (*detached*). |
| `docker compose down` | Apaga y elimina los contenedores (no borra datos). |
| `docker compose down -v` | Apaga, elimina contenedores **y** borra los volúmenes (⚠️ pierde los datos de la DB). |
| `docker compose stop` | Detiene los contenedores sin eliminarlos. |
| `docker compose start` | Reinicia contenedores detenidos (no recrea). |
| `docker compose restart` | Reinicia los servicios. |
| `docker compose build` | Construye las imágenes sin levantar los servicios. |
| `docker compose build --no-cache` | Reconstruye ignorando el cache de capas. |
| `docker compose logs -f [servicio]` | Muestra logs en tiempo real de un servicio. |
| `docker compose ps` | Muestra el estado actual de los servicios. |

### 5. Ejecutar comandos dentro de un contenedor

A veces necesitás ejecutar un comando puntual dentro de un contenedor ya corriendo.

#### Backend (npm)

```bash
docker compose exec backend npm install <nombre-paquete>
docker compose exec backend npm run <script>
docker compose exec backend node -e "console.log('hola')"
```

#### Frontend (npm)

```bash
docker compose exec frontend npm install <nombre-paquete>
docker compose exec frontend npm run <script>
```

#### Base de datos (psql)

```bash
docker compose exec postgres psql -U postgres -d ruta_contable1
```

Desde la consola de PostgreSQL podés ejecutar consultas SQL directamente:

```sql
SELECT * FROM users;
SELECT * FROM transactions LIMIT 10;
```

Para salir:

```sql
\q
```

### 6. Resetear la base de datos

Si necesitás empezar desde cero (borrar todas las tablas y datos):

```bash
# Opción 1: conservar el volumen pero borrar tablas
docker compose exec postgres psql -U postgres -d ruta_contable1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Opción 2: eliminar el volumen y volver a crear (pierde TODO)
docker compose down -v
docker compose up --build
```

### 7. Manejar dependencias nuevas

Cuando instales una nueva librería (`npm install express-validator` por ejemplo):

1. El archivo `package.json` cambia localmente.
2. Por el bind mount, el contenedor ya tiene el archivo actualizado, **pero** los archivos físicos dentro del contenedor no cambiaron (solo los vía del bind mount impactan el filesystem visto por el contenedor).
3. Para instalar la dependencia correctamente dentro del contenedor:

```bash
docker compose exec backend npm install express-validator
# o para el frontend:
docker compose exec frontend npm install nueva-libreria
```

Esto actualiza `package.json` y `node_modules` dentro del contenedor. Como el bind mount es bidireccional, tu `package.json` local también se actualiza.

---

## 📋 Tabla de comandos útiles

| Comando | Descripción |
|---------|-------------|
| `docker compose up` | Levantar servicios en primer plano. |
| `docker compose up -d` | Levantar servicios en segundo plano. |
| `docker compose down` | Apagar servicios sin borrar datos. |
| `docker compose down -v` | Apagar **y** borrar volúmenes (DB se pierde). |
| `docker compose restart` | Reiniciar todos los servicios. |
| `docker compose build` | Reconstruir imágenes. |
| `docker compose build --no-cache` | Rebuild ignorando cache. |
| `docker compose logs -f` | Ver logs en tiempo real. |
| `docker compose logs -f backend` | Logs solo del backend. |
| `docker compose logs -f frontend` | Logs solo del frontend. |
| `docker compose ps` | Estado actual de servicios. |
| `docker compose exec backend sh` | Abrir shell en el contenedor backend. |
| `docker compose exec frontend sh` | Abrir shell en el contenedor frontend. |
| `docker compose exec postgres psql -U postgres -d ruta_contable1` | Conectar a PostgreSQL. |
| `docker compose exec backend npm install <paquete>` | Instalar paquete en backend. |
| `docker compose exec frontend npm install <paquete>` | Instalar paquete en frontend. |
| `docker compose pull` | Descargar imágenes actualizadas (postgres, nginx, etc.). |
| `docker compose events` | Eventos en tiempo real de Docker. |

---

## 🐛 Troubleshooting: Solución de problemas comunes

### Puerto ya en uso

**Síntoma:** Error `Bind for 0.0.0.0:3000 failed: port is already allocated`.

**Causa:** Otro proceso está usando el puerto 3000, 3001 o 5432 en tu máquina.

**Solución:**

```bash
# Windows (PowerShell como Administrador):
netstat -ano | findstr ":3000"
# Obtienes un PID, luego:
taskkill /PID <PID> /F

# Mac / Linux:
lsof -i :3000
kill -9 <PID>

# Opción alternativa: cambiar el puerto en docker-compose.yml
# Frontend: "3001:5173"
# Backend: "3002:3001"
# PostgreSQL: "5433:5432"
```

### Permisos en Linux/Mac

**Síntoma:** `Permission denied` al montar volúmenes en `/app/node_modules`.

**Causa:** Los archivos creados dentro del contenedor pertenecen al usuario `node` (uid 1000), pero en tu host son de `root`.

**Solución:**

```bash
# Mac
# Generalmente no es necesario, pero si persiste:
sudo chown -R 1000:1000 backend/node_modules frontend/node_modules

# Linux
sudo chown -R node:node backend/node_modules frontend/node_modules
```

### Hot-reload no funciona en Windows

**Síntoma:** Cambias el código pero el servidor no se reinicia o el navegador no recarga.

**Causa:** En Windows, los eventos de cambios de archivos (`fs.watch`) no se propagan bien a través de Docker Desktop.

**Solución (ya configurada):**

Las variables `CHOKIDAR_USEPOLLING=true` y `WATCHPACK_POLLING=true` ya están en el `docker-compose.yml` de desarrollo. Esto fuerza a las herramientas a usar *polling* para detectar cambios cada X ms.

Si sigue sin funcionar, podés aumentar el intervalo de polling en el frontend agregando en el `.env`:

```env
VITE_POLL_INTERVAL=100
```

O en el backend, asegurate de que `nodemon` esté leyendo la variable:

```env
CHOKIDAR_INTERVAL=100
```

### Base de datos se resetea constantemente

**Síntoma:** Las tablas y datos desaparecen al hacer `docker compose down`.

**Solución:** Asegurate de no usar `docker compose down -v` (la bandera `-v` elimina volúmenes). Usá apenas `docker compose down` que solo detiene los contenedores pero mantiene el volumen `pgdata`.

### Build muy lento

**Síntoma:** Cada `docker compose up --build` tarda mucho.

**Soluciones:**

- Usá `docker compose up` cuando solo cambiaste código fuente (no Dockerfile ni package.json).
- Asegurate de tener los `.dockerignore` correctos para que Docker no copie `node_modules`.
- Si cambiás `package.json`, el layer de `npm install` se invalida (es normal).
- En Linux nativo, podés usar el driver de filesystem `overlay2` (es el default en Docker moderno).
- En Mac/Windows, asegurate de que Docker Desktop tenga asignados al menos **4 GB de RAM** y **2 CPUs**.

### Error de CORS en el navegador

**Síntoma:** Consola del navegador muestra `Access to fetch at ... has been blocked by CORS policy`.

**Sausa:** El backend está rechazando requests desde el origen del frontend.

**Solución:**

Verificá en `docker-compose.yml` (desarrollo) que `CORS_ORIGIN` apunte al puerto correcto del frontend:

```yaml
CORS_ORIGIN: http://localhost:5173
```

Si el frontend corre en otro puerto (por ejemplo 3000), actualizá el valor.

### No se puede conectar a PostgreSQL desde DBeaver/pgAdmin

**Síntoma:** Timeout de conexión en `localhost:5432`.

**Causa:** El puerto no está mapeado o la DB no está lista.

**Solución:**

```bash
# Verificar que el puerto esté mapeado:
docker compose ps

# Salida esperada:
# Name                    State          Ports
# rutacontable_db          Up (healthy)   5432/tcp

# Si no aparece el puerto, recrear:
docker compose down
docker compose up --build

# Probar conexión desde línea de comandos:
docker compose exec postgres psql -U postgres -d ruta_contable1
```

---

## 📁 Estructura de carpetas esperada

```
ruta-contable/
├─ backend/
│  ├─ controllers/
│  ├─ middleware/
│  ├─ routes/
│  ├─ utils/
│  ├─ server.js
│  ├─ db.js
│  ├─ package.json
│  ├─ Dockerfile          # Producción
│  ├─ Dockerfile.dev      # Desarrollo
│  ├─ .dockerignore       # Ignorados para Docker
│  └─ .env                # Desarrollo local (sin Docker)
├─ frontend/
│  ├─ src/
│  │  ├─ features/
│  │  ├─ components/
│  │  ├─ contexts/
│  │  ├─ hooks/
│  │  ├─ pages/
│  │  ├─ types/
│  │  └─ utils/
│  ├─ public/
│  ├─ package.json
│  ├─ Dockerfile          # Producción
│  ├─ Dockerfile.dev      # Desarrollo
│  ├─ .dockerignore       # Ignorados para Docker
│  ├─ vite.config.ts
│  └─ .env                # Desarrollo local (sin Docker)
├─ .env                    # Variables para Docker Compose
├─ .env.example            # Plantilla de variables
├─ docker-compose.yml      # Desarrollo (hot-reload)
├─ DOCUMENTATION.md        # Este archivo
└─ README.md
```

---

## ✅ Buenas prácticas

1. **No commitear `.env`**: El archivo `.env` va en `.gitignore`. Usá `.env.example` para documentar las variables necesarias.
2. **Señales de salud (`healthcheck`)**: Usalas en servicios como PostgreSQL para que dependencias (`backend`) esperen a que la DB esté realmente lista.
3. **Volúmenes anónimos para `node_modules`**: Evitá que los módulos instalados dentro del contenedor sobrescriban los de tu host (y viceversa).
4. **Nombres explícitos en servicios**: Usá `container_name` solo si lo necesitás para conectar desde herramientas externas (pgAdmin, Postman). En general, dejá que Docker asigne nombres.
5. **Variables públicas en el frontend**: Solo poné en el `.env` del frontend variables que empiecen con `VITE_`. Todo lo demás es expuesto en el bundle.
6. **Imágenes oficiales**: Usá imágenes `-alpine` o `-slim` para reducir tamaño y superficie de ataque.
7. **Logs**: Configura niveles de log adecuados (`development` local, `warning` en prod) para no llenar el disco.
8. **Limpieza periódica**: Ejecutá `docker system prune` cada tanto para liberar espacio de imágenes y contenedores muertos.

---

## 📌 Comandos rápidos de limpieza

```bash
# Eliminar contenedores detenidos
docker container prune

# Eliminar imágenes sin usar
docker image prune -a

# Eliminar volúmenes sin usar (⚠️ puede borrar datos)
docker volume prune

# Limpiar todo lo que no se usa
docker system prune -a

# Ver cuánto espacio ocupa Docker
docker system df
```

---

## 🔗 Recursos útiles

- [Documentación oficial de Docker](https://docs.docker.com/)
- [Docker Compose file reference](https://docs.docker.com/compose/compose-file/)
- [Nginx como reverse proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Vite + Docker](https://vitejs.dev/guide/static-deploy.html#docker)

---

> **Nota:** Esta documentación está orientada a desarrollo local. Para despliegue en producción, revisá la documentación de su servicio de hosting (Railway, Render, Fly.io, AWS ECS, etc.) y adaptá las imágenes a un `Dockerfile` de producción optimizado.
