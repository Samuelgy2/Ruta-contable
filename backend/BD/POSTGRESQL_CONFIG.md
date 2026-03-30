# Configuración de PostgreSQL

## Ubicación de archivos de configuración

### Archivo de conexión a la base de datos
- **Archivo principal:** `express-db-example/src/config/database.js`
- **Archivo de conexión alternativo:** `express-db-example/src/conection.js`

### Archivo de variables de entorno
- **Ubicación:** `express-db-example/.env`

### Variables de entorno para PostgreSQL
| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| DB_HOST | Host del servidor PostgreSQL | localhost |
| DB_PORT | Puerto de PostgreSQL | 5432 |
| DB_NAME | Nombre de la base de datos | ruta_contable |
| DB_USER | Usuario de PostgreSQL | postgres |
| DB_PASSWORD | Contraseña de PostgreSQL | root |

### Ejemplo de configuración en .env
```env
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ruta_contable 
DB_USER=postgres
DB_PASSWORD=root
```

### Configuración de conexión en database.js
```javascript
// express-db-example/src/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
```
