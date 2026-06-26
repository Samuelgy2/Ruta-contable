# DOCUMENTACIÓN TÉCNICA OFICIAL - RUTA CONTABLE

**Proyecto Productivo - Programa ADSO SENA**  
**Versión:** 1.0.0  
**Fecha:** Junio 2024  
**Autor:** [Nombre del Desarrollador]

---

## TABLA DE CONTENIDOS

1. [Branding e Identidad Visual](#1-branding-e-identidad-visual)
2. [Arquitectura de Software y Tecnologías](#2-arquitectura-de-software-y-tecnologias)
3. [Modelado de Datos y Reglas de Negocio](#3-modelado-de-datos-y-reglas-de-negocio)
4. [Especificación de Módulos y Lógica de Programación](#4-especificacion-de-modulos-y-logica-de-programacion)
5. [Diccionario de Datos Técnico](#5-diccionario-de-datos-tecnico)

---

## 1. BRANDING E IDENTIDAD VISUAL

### 1.1 Concepto de Marca

**Ruta Contable** es una plataforma digital diseñada para simplificar y optimizar los procesos contables y financieros de organizaciones, clubes y pequeñas empresas. La marca transmite:

- **Seguridad:** Confianza en el manejo de información financiera sensible
- **Orden:** Estructura y claridad en la presentación de datos contables
- **Transparencia:** Visibilidad completa de operaciones y estados financieros
- **Modernidad:** Tecnología actualizada con interfaces intuitivas y accesibles

**Propuesta de Valor:**
> "Ruta Contable transforma la complejidad contable en claridad financiera, ofreciendo una ruta segura hacia la gestión contable eficiente."

### 1.2 Nombre y Slogan - Opciones Propuestas

| Opción | Nombre | Slogan | Justificación |
|--------|--------|--------|---------------|
| 1 | **Ruta Contable** | *"Tu camino hacia la claridad financiera"* | Enfatiza la guía y dirección en el proceso contable |
| 2 | **ContaRuta** | *"Contabilidad sin desvíos"* | Combina contabilidad con precisión de ruta |
| 3 | **FinanzaClara** | *"Transparencia que suma"* | Destaca la claridad y el principio de partida doble |

**Recomendación:** Mantener **"Ruta Contable"** como nombre principal por su claridad semántica y alineación con el propósito del proyecto.

### 1.3 Colorimetría - Paleta de Colores Corporativa

#### Paleta Principal

| Color | Código HEX | Uso | Justificación Psicológica |
|-------|------------|-----|---------------------------|
| **Verde Esmeralda** | `#10B981` | Color primario, acciones principales, éxito | Transmite crecimiento, estabilidad financiera y confianza. El verde es universalmente asociado con dinero y prosperidad. |
| **Azul Corporativo** | `#1E40AF` | Encabezados, navegación, elementos de autoridad | Evoca profesionalismo, seguridad y confianza institucional. Ideal para elementos de jerarquía. |
| **Gris Pizarra** | `#64748B` | Texto secundario, bordes, iconos | Neutralidad y equilibrio, permite legibilidad sin competir con colores primarios. |

#### Paleta de Fondos

| Color | Código HEX | Uso |
|-------|------------|-----|
| Blanco Puro | `#FFFFFF` | Fondos de tarjetas, contenedores principales |
| Gris Muy Claro | `#F8FAFC` | Fondos de secciones, áreas de descanso visual |
| Gris Claro | `#F1F5F9` | Fondos alternos, separación de filas en tablas |

#### Paleta de Estados y Feedback

| Estado | Código HEX | Uso | Significado |
|--------|------------|-----|-------------|
| **Éxito** | `#10B981` | Confirmaciones, estados positivos | Operación completada correctamente |
| **Error** | `#EF4444` | Alertas críticas, validaciones fallidas | Atención inmediata requerida |
| **Advertencia** | `#F59E0B` | Precauciones, estados pendientes | Revisión necesaria |
| **Información** | `#3B82F6` | Notificaciones informativas | Datos de contexto |

#### Justificación Psicológica para el Usuario Contable

Los contadores y administradores trabajan con información que requiere:
- **Alta concentración:** La paleta de grises neutros reduce la fatiga visual
- **Precisión:** Los colores de estado claros (verde/rojo/ámbar) permiten identificación rápida
- **Confianza:** El verde esmeralda y azul corporativo transmiten estabilidad institucional
- **Jerarquía visual:** La diferenciación cromática guía la atención a elementos críticos

### 1.4 Tipografía Corporativa

#### Combinación Recomendada (Google Fonts)

| Elemento | Tipografía | Peso | Tamaño Base | Justificación |
|----------|------------|------|-------------|---------------|
| **Títulos** | `Inter` | 700 (Bold) | 24px - 32px | Sans-serif moderna, excelente legibilidad en pantallas, transmite modernidad |
| **Subtítulos** | `Inter` | 600 (SemiBold) | 18px - 20px | Jerarquía clara manteniendo coherencia tipográfica |
| **Cuerpo de Texto** | `Inter` | 400 (Regular) | 14px - 16px | Alta legibilidad en párrafos extensos |
| **Tablas y Datos** | `JetBrains Mono` | 400 (Regular) | 13px - 14px | Monoespaciada, alineación perfecta de números y datos contables |
| **Etiquetas y Badges** | `Inter` | 500 (Medium) | 12px | Claridad en elementos pequeños |

#### Configuración CSS Recomendada

```css
/* Importar Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}

body {
  font-family: var(--font-primary);
  font-size: 16px;
  line-height: 1.6;
  color: #1e293b;
}

.data-table, .accounting-entry {
  font-family: var(--font-mono);
  font-size: 13px;
}
```

---

## 2. ARQUITECTURA DE SOFTWARE Y TECNOLOGÍAS

### 2.1 Arquitectura Recomendada

**Arquitectura en Capas (Layered Architecture) con patrón MVC**

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTACIÓN (Frontend)                   │
│  React 18 + TypeScript + Vite + TailwindCSS + Radix UI     │
├─────────────────────────────────────────────────────────────┤
│                      API REST (Backend)                       │
│              Express.js + Middleware + Controladores         │
├─────────────────────────────────────────────────────────────┤
│                   LÓGICA DE NEGOCIO                          │
│     Servicios + Validaciones + Reglas Contables             │
├─────────────────────────────────────────────────────────────┤
│                   ACCESO A DATOS                             │
│              Pool de Conexiones PostgreSQL                   │
├─────────────────────────────────────────────────────────────┤
│                   PERSISTENCIA                               │
│              PostgreSQL 15 (RDBMS)                           │
└─────────────────────────────────────────────────────────────┘
```

**Justificación para Entorno Contable:**
- **Separación de responsabilidades:** Cada capa tiene un propósito definido, facilitando auditorías de código
- **Mantenibilidad:** Cambios en reglas contables afectan solo la capa de lógica de negocio
- **Escalabilidad:** Posibilidad de crecer horizontalmente el backend
- **Seguridad:** Capas de middleware para autenticación, validación y logging

### 2.2 Stack Tecnológico Detallado

#### Backend

| Componente | Tecnología | Versión | Propósito |
|------------|------------|---------|-----------|
| **Lenguaje** | Node.js | 18.x+ | Ejecución de JavaScript en servidor |
| **Runtime** | JavaScript (ES6+) | - | Lenguaje de programación asíncrono |
| **Framework** | Express.js | 5.2.1 | Servidor HTTP y enrutamiento API REST |
| **Base de Datos** | PostgreSQL | 15-alpine | Sistema RDBMS para datos relacionales |
| **Driver DB** | pg (node-postgres) | 8.20.0 | Conexión y consultas a PostgreSQL |
| **Autenticación** | jsonwebtoken | 9.0.3 | Generación y validación de JWT |
| **Hashing** | bcryptjs | 3.0.3 | Encriptación de contraseñas |
| **Seguridad HTTP** | helmet | 8.1.0 | Cabeceras de seguridad HTTP |
| **CORS** | cors | 2.8.6 | Control de acceso entre orígenes |
| **Logging** | morgan | 1.10.1 | Logging de peticiones HTTP |
| **Tareas Programadas** | node-cron | 4.2.1 | Programación de cierres mensuales automáticos |
| **Email** | nodemailer | 9.0.1 | Envío de correos electrónicos |
| **Exportación Excel** | exceljs | 3.4.0 | Generación de reportes en formato .xlsx |
| **Variables de Entorno** | dotenv | 17.4.0 | Gestión de configuración |
| **Rate Limiting** | express-rate-limit | 8.5.2 | Prevención de abuso de API |

#### Frontend

| Componente | Tecnología | Versión | Propósito |
|------------|------------|---------|-----------|
| **Framework** | React | 18.3.1 | Biblioteca de UI component-based |
| **Lenguaje** | TypeScript | 6.0.2 | Tipado estático para JavaScript |
| **Build Tool** | Vite | 6.4.3 | Desarrollo rápido y build optimizado |
| **Estilos** | Tailwind CSS | 3.4.18 | Framework CSS utility-first |
| **Componentes UI** | Radix UI | Varias | Componentes accesibles sin estilos |
| **Iconos** | Lucide React | 0.487.0 | Biblioteca de iconos SVG |
| **HTTP Client** | Axios | 1.7.9 | Peticiones HTTP al backend |
| **Formularios** | React Hook Form | 7.55.0 | Gestión eficiente de formularios |
| **Gráficos** | Recharts | 2.15.2 | Visualización de datos financieros |
| **PDF** | @react-pdf/renderer | 4.3.2 | Generación de PDFs en cliente |
| **Notificaciones** | Sonner | 2.0.3 | Toast notifications modernas |
| **Utilidades CSS** | clsx, tailwind-merge | Varias | Gestión de clases dinámicas |

#### Infraestructura y DevOps

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| **Contenerización** | Docker + Docker Compose | Entornos consistentes de desarrollo y producción |
| **Base de Datos** | PostgreSQL 15-alpine | Imagen ligera de PostgreSQL |
| **Gestión de Paquetes** | npm | Instalación y gestión de dependencias |
| **Control de Versiones** | Git + GitHub | Control de código fuente |

### 2.3 Gestión de Entornos y Dependencias

#### Estructura de Archivos de Configuración

```
ruta-contable/
├── .env.example          # Plantilla de variables de entorno
├── .env.docker           # Variables para Docker
├── package.json          # Raíz del proyecto
├── backend/
│   ├── .env.example      # Plantilla backend
│   ├── package.json      # Dependencias backend
│   └── .dockerignore     # Archivos excluidos de Docker
└── frontend/
    ├── .env.example      # Plantilla frontend
    ├── package.json      # Dependencias frontend
    └── .dockerignore     # Archivos excluidos de Docker
```

#### Variables de Entorno Críticas

```bash
# Backend (.env)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ruta_contable
DB_USER=postgres
DB_PASSWORD=********
JWT_SECRET=********
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
CURRENCY=COP
CLUB_NAME=Ruta Contable
```

---

## 3. MODELADO DE DATOS Y REGLAS DE NEGOCIO

### 3.1 Diagrama Entidad-Relación Conceptual

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│     users       │     │      socio          │     │   transactions      │
├─────────────────┤     ├─────────────────────┤     ├─────────────────────┤
│ PK id           │     │ PK id_socio         │     │ PK id               │
│    username     │     │    nombre           │     │    tipo             │
│    password     │     │    documento        │     │    monto            │
│    email        │     │    tipo_documento   │     │    fecha            │
│    full_name    │     │    email            │     │    descripcion      │
│    role         │     │    telefono         │     │    categoria        │
│    active       │     │    direccion        │     │    metodo_pago      │
│    created_at   │     │    fecha_nacimiento │     │    creado_por       │
│    updated_at   │     │    fecha_ingreso    │     │    created_at       │
└─────────────────┘     │    tipo_membresia   │     └─────────────────────┘
         │              │    estado           │                │
         │              │    foto             │                │
         │              │    observaciones    │                │
         │              │    created_by (FK)  │                │
         │              │    created_at       │                │
         │              │    updated_at       │                │
         │              └─────────────────────┘                │
         │                         │                          │
         │              ┌──────────┘                          │
         │              │                                     │
         ▼              ▼                                     ▼
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   periodos      │     │  plan_cuentas       │     │ comprobante_contable│
├─────────────────┤     ├─────────────────────┤     ├─────────────────────┤
│ PK id           │     │ PK id_cuenta        │     │ PK id_comprobante   │
│    anio         │     │    codigo           │     │    numero           │
│    mes          │     │    nombre           │     │    fecha            │
│    nombre_mes   │     │    tipo             │     │    tipo             │
│    fecha_inicio │     │    naturaleza       │     │    periodo (FK)     │
│    fecha_fin    │     │    nivel            │     │    creado_por (FK)  │
│    activo       │     │    padre_id (FK)    │     │    total_debito     │
│    cerrado      │     │    estado           │     │    total_credito    │
│    fecha_cierre │     │    created_at       │     │    estado           │
│    total_ingresos│    └─────────────────────┘     │    created_at       │
│    total_gastos │                                  │    updated_at       │
│    balance      │                                  └─────────────────────┘
│    observaciones│                                           │
│    created_at   │                                           │
└─────────────────┘                                           │
                                                              ▼
                                                    ┌─────────────────────┐
                                                    │  detalle_comprobante│
                                                    ├─────────────────────┤
                                                    │ PK id_detalle       │
                                                    │    id_comprobante(FK)
                                                    │    cuenta_id (FK)   │
                                                    │    tercero_id (FK)  │
                                                    │    descripcion      │
                                                    │    debito           │
                                                    │    credito          │
                                                    │    created_at       │
                                                    └─────────────────────┘
```

### 3.2 Estructura de Tablas Principales

#### Tabla: `users`

| Campo | Tipo de Dato | Restricciones | Descripción |
|-------|--------------|---------------|-------------|
| `id` | SERIAL | PK, NOT NULL | Identificador único del usuario |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Nombre de usuario para login |
| `password` | VARCHAR(255) | NOT NULL | Contraseña hasheada con bcrypt |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL | Correo electrónico del usuario |
| `full_name` | VARCHAR(100) | NOT NULL | Nombre completo del usuario |
| `role` | VARCHAR(20) | DEFAULT 'user' | Rol: admin, contador, auxiliar, user |
| `active` | BOOLEAN | DEFAULT true | Estado de activación del usuario |
| `failed_attempts` | INTEGER | DEFAULT 0 | Intentos fallidos de login |
| `locked_until` | TIMESTAMP | NULL | Fecha de desbloqueo tras intentos fallidos |
| `reset_token` | VARCHAR(255) | NULL | Token para recuperación de contraseña |
| `reset_token_expires` | TIMESTAMP | NULL | Expiración del token de recuperación |
| `last_login` | TIMESTAMP | NULL | Fecha del último inicio de sesión |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de última actualización |

#### Tabla: `socio` (Terceros/Clientes/Proveedores)

| Campo | Tipo de Dato | Restricciones | Descripción |
|-------|--------------|---------------|-------------|
| `id_socio` | SERIAL | PK, NOT NULL | Identificador único del socio |
| `nombre` | VARCHAR(200) | NOT NULL | Nombre completo o razón social |
| `documento` | VARCHAR(50) | UNIQUE, NOT NULL | Número de identificación (CC, NIT, etc.) |
| `tipo_documento` | VARCHAR(10) | DEFAULT 'CC' | Tipo: CC, CE, NIT, PAS, RUT |
| `email` | VARCHAR(100) | NULL | Correo electrónico |
| `telefono` | VARCHAR(30) | NULL | Número telefónico |
| `direccion` | TEXT | NULL | Dirección física |
| `fecha_nacimiento` | DATE | NULL | Fecha de nacimiento/fundación |
| `fecha_ingreso` | DATE | NOT NULL | Fecha de ingreso al sistema |
| `tipo_membresia` | VARCHAR(50) | DEFAULT 'Básica' | Tipo de membresía/relación |
| `estado` | VARCHAR(20) | DEFAULT 'activo' | activo, inactivo, suspendido |
| `foto` | TEXT | NULL | URL de la fotografía |
| `observaciones` | TEXT | NULL | Notas adicionales |
| `created_by` | INTEGER | FK → users(id) | Usuario que creó el registro |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de actualización |

**Índices:**
```sql
CREATE INDEX idx_socio_documento ON socio(documento);
CREATE INDEX idx_socio_nombre ON socio(nombre);
```

#### Tabla: `transactions` (Movimientos básicos)

| Campo | Tipo de Dato | Restricciones | Descripción |
|-------|--------------|---------------|-------------|
| `id` | SERIAL | PK, NOT NULL | Identificador único de transacción |
| `tipo` | VARCHAR(20) | NOT NULL | 'ingreso' o 'gasto' |
| `monto` | DECIMAL(15,2) | NOT NULL | Valor de la transacción |
| `fecha` | DATE | NOT NULL | Fecha de la transacción |
| `descripcion` | TEXT | NULL | Descripción detallada |
| `categoria` | VARCHAR(100) | NULL | Categoría contable |
| `metodo_pago` | VARCHAR(50) | NULL | Efectivo, transferencia, tarjeta, etc. |
| `creado_por` | VARCHAR(100) | NULL | Nombre del usuario creador |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |

#### Tabla: `periodos` (Periodos contables)

| Campo | Tipo de Dato | Restricciones | Descripción |
|-------|--------------|---------------|-------------|
| `id` | SERIAL | PK, NOT NULL | Identificador único del periodo |
| `anio` | INTEGER | NOT NULL | Año del periodo |
| `mes` | INTEGER | NOT NULL, CHECK (1-12) | Mes del periodo |
| `nombre_mes` | VARCHAR(20) | NOT NULL | Nombre del mes (enero, febrero, etc.) |
| `fecha_inicio` | DATE | NULL | Primer día del periodo |
| `fecha_fin` | DATE | NULL | Último día del periodo |
| `activo` | BOOLEAN | DEFAULT true | Si el periodo está abierto |
| `cerrado` | BOOLEAN | DEFAULT false | Si el periodo fue cerrado |
| `fecha_cierre` | TIMESTAMP | NULL | Fecha del cierre |
| `total_ingresos` | DECIMAL(15,2) | DEFAULT 0.00 | Suma de ingresos del periodo |
| `total_gastos` | DECIMAL(15,2) | DEFAULT 0.00 | Suma de gastos del periodo |
| `balance` | DECIMAL(15,2) | DEFAULT 0.00 | Balance (ingresos - gastos) |
| `observaciones` | TEXT | NULL | Notas del cierre |
| `cerrado_by` | VARCHAR(100) | NULL | Usuario que realizó el cierre |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |

**Restricción Única:**
```sql
UNIQUE (anio, mes)
```

#### Tabla: `plan_cuentas` (Plan Único de Cuentas - PUC)

| Campo | Tipo de Dato | Restricciones | Descripción |
|-------|--------------|---------------|-------------|
| `id_cuenta` | SERIAL | PK, NOT NULL | Identificador único de cuenta |
| `codigo` | VARCHAR(20) | UNIQUE, NOT NULL | Código PUC (ej: 1105, 4135) |
| `nombre` | VARCHAR(200) | NOT NULL | Nombre de la cuenta |
| `tipo` | VARCHAR(20) | NOT NULL | Activo, Pasivo, Patrimonio, Ingreso, Gasto |
| `naturaleza` | VARCHAR(10) | NOT NULL | Deudora, Acreedora |
| `nivel` | INTEGER | NOT NULL | Nivel jerárquico (1-9) |
| `padre_id` | INTEGER | FK → plan_cuentas(id_cuenta) | Cuenta padre para jerarquía |
| `estado` | VARCHAR(20) | DEFAULT 'activo' | activo, inactivo |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |

#### Tabla: `comprobante_contable`

| Campo | Tipo de Dato | Restricciones | Descripción |
|-------|--------------|---------------|-------------|
| `id_comprobante` | SERIAL | PK, NOT NULL | Identificador único del comprobante |
| `numero` | VARCHAR(20) | UNIQUE, NOT NULL | Número consecutivo del comprobante |
| `fecha` | DATE | NOT NULL | Fecha del comprobante |
| `tipo` | VARCHAR(20) | NOT NULL | Ingreso, Egreso, Diario, Ajuste |
| `periodo_id` | INTEGER | FK → periodos(id) | Periodo contable asociado |
| `creado_por` | INTEGER | FK → users(id) | Usuario creador |
| `total_debito` | DECIMAL(15,2) | NOT NULL | Suma de débitos |
| `total_credito` | DECIMAL(15,2) | NOT NULL | Suma de créditos |
| `estado` | VARCHAR(20) | DEFAULT 'borrador' | borrador, aprobado, anulado |
| `observaciones` | TEXT | NULL | Notas del comprobante |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de actualización |

#### Tabla: `detalle_comprobante`

| Campo | Tipo de Dato | Restricciones | Descripción |
|-------|--------------|---------------|-------------|
| `id_detalle` | SERIAL | PK, NOT NULL | Identificador único del detalle |
| `id_comprobante` | INTEGER | FK → comprobante_contable(id_comprobante) | Comprobante asociado |
| `cuenta_id` | INTEGER | FK → plan_cuentas(id_cuenta) | Cuenta PUC afectada |
| `tercero_id` | INTEGER | FK → socio(id_socio) | Tercero asociado (opcional) |
| `descripcion` | VARCHAR(200) | NOT NULL | Descripción del movimiento |
| `debito` | DECIMAL(15,2) | DEFAULT 0.00 | Valor al débito |
| `credito` | DECIMAL(15,2) | DEFAULT 0.00 | Valor al crédito |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |

---

## 4. ESPECIFICACIÓN DE MÓDULOS Y LÓGICA DE PROGRAMACIÓN

### 4.1 Módulo: Registro de Asientos Contables

#### Flujo del Proceso

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. Recepción de Datos                         │
│  - Fecha, tipo, observaciones                                   │
│  - Array de detalles: [{cuenta_id, tercero_id, descripcion,    │
│                         debito, credito}]                       │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    2. Validaciones Iniciales                     │
│  - Verificar usuario autenticado                                │
│  - Validar fecha no futura                                      │
│  - Validar periodo abierto                                       │
│  - Validar cuentas existentes en PUC                            │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              3. VALIDACIÓN CRÍTICA: Partida Doble               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Σ DÉBITOS  ===  Σ CRÉDITOS  ?                          │   │
│  │                                                          │   │
│  │  if (total_debito !== total_credito) {                  │   │
│  │    return error: "La partida doble no cuadra";          │   │
│  │  }                                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    4. Cálculo de Totales                         │
│  - total_debito = SUM(detalle.debito)                           │
│  - total_credito = SUM(detalle.credito)                         │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    5. Transacción de Base de Datos              │
│  BEGIN TRANSACTION;                                             │
│    INSERT INTO comprobante_contable (...);                      │
│    INSERT INTO detalle_comprobante (...) FOR EACH detalle;      │
│  COMMIT;                                                        │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    6. Respuesta                                  │
│  - Retornar ID del comprobante creado                           │
│  - Actualizar estado en frontend                                │
└─────────────────────────────────────────────────────────────────┘
```

#### Implementación del Controlador (Node.js/Express)

```javascript
/**
 * POST /api/comprobantes
 * Crear nuevo comprobante contable
 * 
 * Body esperado:
 * {
 *   "fecha": "2024-06-26",
 *   "tipo": "diario",
 *   "observaciones": "Asiento de ajuste",
 *   "detalles": [
 *     { "cuenta_id": 1, "tercero_id": null, "descripcion": "Causación ingreso", "debito": 1000000, "credito": 0 },
 *     { "cuenta_id": 2, "tercero_id": 5, "descripcion": "Cliente Juan", "debito": 0, "credito": 1000000 }
 *   ]
 * }
 */
const crearComprobante = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { fecha, tipo, observaciones, detalles } = req.body;
    const usuarioId = req.user.id; // Desde JWT middleware
    
    // ─── 1. Validaciones iniciales ──────────────────────────────
    if (!fecha || !tipo || !detalles || detalles.length === 0) {
      return res.status(400).json({
        error: 'Datos incompletos. Se requiere fecha, tipo y al menos un detalle.'
      });
    }
    
    // Validar fecha no futura
    const fechaActual = new Date();
    const fechaComprobante = new Date(fecha);
    if (fechaComprobante > fechaActual) {
      return res.status(400).json({
        error: 'La fecha del comprobante no puede ser futura.'
      });
    }
    
    // Validar periodo abierto
    const anio = fechaComprobante.getFullYear();
    const mes = fechaComprobante.getMonth() + 1;
    const periodoResult = await client.query(
      'SELECT id, cerrado FROM periodos WHERE anio = $1 AND mes = $2',
      [anio, mes]
    );
    
    if (periodoResult.rows.length > 0 && periodoResult.rows[0].cerrado) {
      return res.status(400).json({
        error: `El periodo ${mes}/${anio} está cerrado. No se pueden registrar comprobantes.`
      });
    }
    
    // Validar cuentas existentes
    const cuentaIds = detalles.map(d => d.cuenta_id).filter(Boolean);
    const cuentasResult = await client.query(
      'SELECT id_cuenta FROM plan_cuentas WHERE id_cuenta = ANY($1)',
      [cuentaIds]
    );
    
    if (cuentasResult.rows.length !== cuentaIds.length) {
      return res.status(400).json({
        error: 'Una o más cuentas no existen en el Plan Único de Cuentas.'
      });
    }
    
    // ─── 2. VALIDACIÓN CRÍTICA: Partida Doble ──────────────────
    let totalDebito = 0;
    let totalCredito = 0;
    
    for (const detalle of detalles) {
      const debito = parseFloat(detalle.debito) || 0;
      const credito = parseFloat(detalle.credito) || 0;
      
      // Un detalle no puede tener ambos valores
      if (debito > 0 && credito > 0) {
        return res.status(400).json({
          error: 'Cada línea del comprobante debe ser solo débito O solo crédito, no ambos.'
        });
      }
      
      totalDebito += debito;
      totalCredito += credito;
    }
    
    // PRINCIPIO DE PARTIDA DOBLE
    if (totalDebito === 0 && totalCredito === 0) {
      return res.status(400).json({
        error: 'El comprobante debe tener al menos un valor (débito o crédito).'
      });
    }
    
    if (totalDebito !== totalCredito) {
      return res.status(400).json({
        error: 'La partida doble no cuadra.',
        detalles: {
          total_debito: totalDebito,
          total_credito: totalCredito,
          diferencia: totalDebito - totalCredito
        }
      });
    }
    
    // ─── 3. Generar número consecutivo ──────────────────────────
    const numeroResult = await client.query(
      "SELECT COALESCE(MAX(CAST(numero AS INTEGER)), 0) + 1 as siguiente FROM comprobante_contable"
    );
    const numero = numeroResult.rows[0].siguiente.toString().padStart(6, '0');
    
    // ─── 4. Transacción de Base de Datos ────────────────────────
    await client.query('BEGIN');
    
    // Insertar comprobante principal
    const comprobanteResult = await client.query(
      `INSERT INTO comprobante_contable 
       (numero, fecha, tipo, creado_por, total_debito, total_credito, observaciones)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id_comprobante`,
      [numero, fecha, tipo, usuarioId, totalDebito, totalCredito, observaciones]
    );
    
    const idComprobante = comprobanteResult.rows[0].id_comprobante;
    
    // Insertar detalles
    for (const detalle of detalles) {
      await client.query(
        `INSERT INTO detalle_comprobante 
         (id_comprobante, cuenta_id, tercero_id, descripcion, debito, credito)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          idComprobante,
          detalle.cuenta_id,
          detalle.tercero_id || null,
          detalle.descripcion,
          detalle.debito || 0,
          detalle.credito || 0
        ]
      );
    }
    
    await client.query('COMMIT');
    
    // ─── 5. Respuesta exitosa ───────────────────────────────────
    res.status(201).json({
      success: true,
      data: {
        id: idComprobante,
        numero: numero,
        fecha: fecha,
        total_debito: totalDebito,
        total_credito: totalCredito
      },
      message: 'Comprobante contable creado exitosamente'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear comprobante:', error);
    res.status(500).json({
      error: 'Error interno del servidor al crear el comprobante.'
    });
  } finally {
    client.release();
  }
};
```

### 4.2 Módulo: Autenticación y Autorización

#### Sistema de Roles (RBAC - Role-Based Access Control)

```javascript
// Roles disponibles en el sistema
const ROLES = {
  ADMIN: 'admin',        // Acceso total al sistema
  CONTADOR: 'contador',  // Gestión contable completa
  AUXILIAR: 'auxiliar',  // Registro básico de transacciones
  USER: 'user'           // Solo consulta
};

// Permisos por rol
const PERMISOS = {
  [ROLES.ADMIN]: {
    usuarios: ['crear', 'leer', 'actualizar', 'eliminar'],
    comprobantes: ['crear', 'leer', 'actualizar', 'eliminar', 'aprobar', 'anular'],
    periodos: ['crear', 'leer', 'actualizar', 'eliminar', 'cerrar'],
    reportes: ['leer', 'exportar'],
    configuracion: ['leer', 'actualizar']
  },
  [ROLES.CONTADOR]: {
    usuarios: ['leer'],
    comprobantes: ['crear', 'leer', 'actualizar', 'aprobar'],
    periodos: ['leer', 'cerrar'],
    reportes: ['leer', 'exportar'],
    configuracion: ['leer']
  },
  [ROLES.AUXILIAR]: {
    usuarios: [],
    comprobantes: ['crear', 'leer'],
    periodos: ['leer'],
    reportes: ['leer'],
    configuracion: []
  },
  [ROLES.USER]: {
    usuarios: [],
    comprobantes: ['leer'],
    periodos: ['leer'],
    reportes: ['leer'],
    configuracion: []
  }
};
```

#### Middleware de Autenticación JWT

```javascript
/**
 * Middleware: verificarToken
 * Valida que el token JWT sea válido y no haya expirado
 */
const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  
  if (!token) {
    return res.status(401).json({
      error: 'No se proporcionó token de autenticación'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username, role, email }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado. Por favor inicie sesión nuevamente.'
      });
    }
    return res.status(403).json({
      error: 'Token inválido'
    });
  }
};

/**
 * Middleware: verificarPermiso
 * Valida que el usuario tenga el permiso requerido
 */
const verificarPermiso = (recurso, accion) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const permisosRol = PERMISOS[userRole];
    
    if (!permisosRol) {
      return res.status(403).json({
        error: 'Rol no reconocido'
      });
    }
    
    const permisosRecurso = permisosRol[recurso];
    
    if (!permisosRecurso || !permisosRecurso.includes(accion)) {
      return res.status(403).json({
        error: `No tiene permisos para ${accion} ${recurso}`
      });
    }
    
    next();
  };
};

// Uso en rutas
router.post('/comprobantes',
  verificarToken,
  verificarPermiso('comprobantes', 'crear'),
  crearComprobante
);

router.get('/comprobantes',
  verificarToken,
  verificarPermiso('comprobantes', 'leer'),
  listarComprobantes
);
```

#### Control de Sesiones y Bloqueo por Intentos Fallidos

```javascript
/**
 * POST /api/auth/login
 * Autenticación de usuarios
 */
const login = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // 1. Buscar usuario
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND active = true',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Usuario o contraseña incorrectos'
      });
    }
    
    const user = result.rows[0];
    
    // 2. Verificar si está bloqueado
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      return res.status(423).json({
        error: `Usuario bloqueado hasta ${user.locked_until}`
      });
    }
    
    // 3. Verificar contraseña
    const passwordValida = await bcrypt.compare(password, user.password);
    
    if (!passwordValida) {
      // Incrementar intentos fallidos
      const nuevosIntentos = (user.failed_attempts || 0) + 1;
      let lockedUntil = null;
      
      // Bloquear tras 5 intentos fallidos (15 minutos)
      if (nuevosIntentos >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
      }
      
      await pool.query(
        'UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3',
        [nuevosIntentos, lockedUntil, user.id]
      );
      
      return res.status(401).json({
        error: 'Usuario o contraseña incorrectos',
        intentos_restantes: Math.max(0, 5 - nuevosIntentos)
      });
    }
    
    // 4. Resetear intentos fallidos y actualizar último login
    await pool.query(
      'UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = $1',
      [user.id]
    );
    
    // 5. Generar JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};
```

---

## 5. DICCIONARIO DE DATOS TÉCNICO

### 5.1 Tabla: `comprobante_contable`

| Campo | Tipo de Dato | Longitud | PK/FK | Descripción | Permite Nulos |
|-------|--------------|----------|-------|-------------|---------------|
| `id_comprobante` | SERIAL | - | PK | Identificador único autoincremental del comprobante | No |
| `numero` | VARCHAR | 20 | - | Número consecutivo único del comprobante (ej: 000001) | No |
| `fecha` | DATE | - | - | Fecha en que se realiza el asiento contable | No |
| `tipo` | VARCHAR | 20 | - | Tipo de comprobante: 'ingreso', 'egreso', 'diario', 'ajuste' | No |
| `periodo_id` | INTEGER | - | FK → periodos(id) | Referencia al periodo contable al que pertenece | Sí |
| `creado_por` | INTEGER | - | FK → users(id) | ID del usuario que creó el comprobante | No |
| `total_debito` | DECIMAL | 15,2 | - | Suma total de los valores al débito (debe igualar total_credito) | No |
| `total_credito` | DECIMAL | 15,2 | - | Suma total de los valores al crédito (debe igualar total_debito) | No |
| `estado` | VARCHAR | 20 | - | Estado del comprobante: 'borrador', 'aprobar', 'anulado' | No (DEFAULT 'borrador') |
| `observaciones` | TEXT | - | - | Notas o descripción adicional del comprobante | Sí |
| `created_at` | TIMESTAMP | - | - | Fecha y hora de creación del registro | No (DEFAULT CURRENT_TIMESTAMP) |
| `updated_at` | TIMESTAMP | - | - | Fecha y hora de última modificación | No (DEFAULT CURRENT_TIMESTAMP) |

**Restricciones:**
- PRIMARY KEY: `id_comprobante`
- UNIQUE: `numero`
- FOREIGN KEY: `periodo_id` → `periodos(id)`
- FOREIGN KEY: `creado_por` → `users(id)`
- CHECK: `total_debito = total_credito` (validación a nivel de aplicación)

### 5.2 Tabla: `detalle_comprobante`

| Campo | Tipo de Dato | Longitud | PK/FK | Descripción | Permite Nulos |
|-------|--------------|----------|-------|-------------|---------------|
| `id_detalle` | SERIAL | - | PK | Identificador único autoincremental del detalle | No |
| `id_comprobante` | INTEGER | - | FK → comprobante_contable(id_comprobante) | Referencia al comprobante padre | No |
| `cuenta_id` | INTEGER | - | FK → plan_cuentas(id_cuenta) | ID de la cuenta PUC afectada en este movimiento | No |
| `tercero_id` | INTEGER | - | FK → socio(id_socio) | ID del tercero (cliente/proveedor) asociado | Sí |
| `descripcion` | VARCHAR | 200 | - | Descripción específica del movimiento contable | No |
| `debito` | DECIMAL | 15,2 | - | Valor del movimiento al débito (0 si es crédito) | No (DEFAULT 0.00) |
| `credito` | DECIMAL | 15,2 | - | Valor del movimiento al crédito (0 si es débito) | No (DEFAULT 0.00) |
| `created_at` | TIMESTAMP | - | - | Fecha y hora de creación del registro | No (DEFAULT CURRENT_TIMESTAMP) |

**Restricciones:**
- PRIMARY KEY: `id_detalle`
- FOREIGN KEY: `id_comprobante` → `comprobante_contable(id_comprobante)` ON DELETE CASCADE
- FOREIGN KEY: `cuenta_id` → `plan_cuentas(id_cuenta)`
- FOREIGN KEY: `tercero_id` → `socio(id_socio)`
- CHECK: `debito = 0 OR credito = 0` (no pueden ser ambos > 0)

---

## ANEXOS

### A. Normativa Contable Aplicable

Este sistema está diseñado considerando:
- **Plan Único de Cuentas (PUC) de Colombia** - Decreto 2420 de 2015
- **Normas Internacionales de Información Financiera (NIIF/IFRS)**
- **Principios de Contabilidad Generalmente Aceptados (PCGA)**

### B. Convenciones de Desarrollo

1. **Nomenclatura de Base de Datos:**
   - Tablas: `snake_case` plural (ej: `comprobante_contable`)
   - Columnas: `snake_case` (ej: `id_comprobante`, `fecha_creacion`)
   - Claves foráneas: `tabla_id` o `id_tabla` según contexto

2. **API REST:**
   - Endpoints: `/api/{recurso}`
   - Métodos HTTP semánticos (GET, POST, PUT, DELETE)
   - Respuestas JSON estandarizadas

3. **Código Backend:**
   - JavaScript ES6+ con async/await
   - Manejo de errores con try/catch
   - Validaciones en capas (middleware + controlador)

### C. Consideraciones de Seguridad

1. **Contraseñas:** Hash con bcrypt (cost factor 12)
2. **Tokens JWT:** Expiración a 24 horas
3. **CORS:** Configuración restrictiva por entorno
4. **Rate Limiting:** Prevención de brute force
5. **Helmet.js:** Cabeceras de seguridad HTTP
6. **SQL Injection:** Uso de consultas parametrizadas

---

**FIN DEL DOCUMENTO**

*Documento generado para fines académicos del programa ADSO SENA*  
*Proyecto: Ruta Contable - Sistema de Gestión Contable*  
*Versión 1.0.0 - Junio 2024*