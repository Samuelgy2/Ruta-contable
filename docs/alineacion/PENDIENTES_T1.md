# Pendientes detectados por T1 fuera de sus rutas

Actualizado: 2026-11-06, tras el Gate G1. Rama: `entrega/rf-faltantes`.
Las líneas citadas son de la base común `9987c587`, salvo que se indique otra rama. T3 no modificó esos archivos en `entrega/t3-codigo`, excepto los marcados.

## Para T3: tareas de código aprobadas en G1

Cada tarea sale de `docs/alineacion/brechas.csv` (columna `accion = AJUSTAR_CODIGO`) y de `docs/alineacion/DECISIONES_G1.md`. Como comprobación mínima de cada una: `cd backend && npm test` en verde, `node --check` del archivo tocado y la prueba indicada.

### T3-01 · RF-007 · Buscador de usuarios (Media)
- **Archivo:** `frontend/src/pages/admin/system/UsersPanel.tsx:46` (`visibleUsers`).
- **Qué hacer:** un campo de búsqueda que filtre por `username`, `fullName` y `email`, sin distinguir mayúsculas y en el cliente; la lista ya llega completa de `GET /api/users`.
- **Comprobación:** `npx tsc --noEmit -p frontend` sin errores nuevos. A mano: escribir parte de un correo deja solo ese usuario, y borrar el texto vuelve a mostrar todos.

### T3-02 · RF-015 (y RF-014) · Validar Datos del Club (Media)
- **Archivo:** `backend/controllers/ClubDataController.js:26-52`.
- **Qué validar, solo si el campo llega en el cuerpo:**
  - `email` con el mismo `FORMATO_EMAIL` de `AuthController.js:7`;
  - `nit` con formato de NIT;
  - `porcentajeMora` numérico entre 0 y 100;
  - `diaVencimientoDefault` entero entre 1 y 31.
  - Si algo falla, responder 400 con el campo.
- **Regla del NIT:** la matriz no la define (NO VERIFICADO). Propuesta: `^\d{6,10}(-\d)?$` aceptando puntos de miles, igual que el valor que ya hay en `factura.nit_club` (`900.000.000-1`). Si se quiere validar el dígito de verificación, que lo confirme Samuel.
- **Comprobación:** prueba `node --test` de la función de validación, sin base: correo inválido → error, NIT `900.000.000-1` → ok, NIT `abc` → error, mora 150 → error.

### T3-03 · RF-024 y RF-025 · Descripción obligatoria en transacciones (Media)
- **Archivo:** `backend/controllers/TransactionController.js:145-226` (create) y `:250-313` (update).
- **Qué validar:**
  - en create, `descripcion` obligatoria y no vacía después de `trim` → 400 "La descripción es obligatoria";
  - en update, si llega `descripcion`, que no quede vacía.
  - Mantener el resto de validaciones.
- **Ojo:** `registrar_pago_mensual` y `registrar_pago_cartera` en la BD, y la captura de PayPal, insertan transacciones con descripción propia y no pasan por este controlador.
- **Comprobación:** `curl` o prueba: POST sin descripción → 400; con descripción → 201.

### T3-04 · RF-048 · Fecha de nacimiento obligatoria del socio (Media)
- **Archivos:**
  - `backend/controllers/Membercontroller.js:64-68` (create);
  - `frontend/src/pages/admin/AdminMembers.tsx:203` (formulario: marcar el campo como obligatorio).
- **Qué validar:** `fecha_nacimiento` obligatoria, fecha válida y no futura → si no, 400. En update, no permitir dejarla vacía si llega.
- **Ojo:** los 4 socios actuales podrían no tener fecha. Consultarlo con `SELECT count(*) FROM socio WHERE fecha_nacimiento IS NULL` antes de exigirla en update.
- **Comprobación:** POST sin `fecha_nacimiento` → 400; con fecha futura → 400; con fecha válida → 201.

### T3-05 · RF-056 · Guardar el método de pago al registrar un pago (Media)
- **Archivos:**
  - backend:
    - `backend/controllers/PagoMensualController.js:137-139` y `:180-206` (paso a `pagado`);
    - `backend/controllers/CarteraController.js:119-125` en `entrega/rf-faltantes` (paso a `pagado`; esta rama agregó líneas, buscar `estado === 'pagado'`);
  - frontend:
    - `frontend/src/pages/admin/AdminMonthlyPayments.tsx:157`;
    - `frontend/src/pages/admin/AdminCartera.tsx` (`handlePagar`).
- **Qué hacer:**
  - en el backend, cuando el estado pasa a `pagado`, exigir `metodoPago` dentro de `METODOS_PAGO_VALIDOS` → si falta, 400;
  - en las dos pantallas, pedir el método (efectivo, transferencia, tarjeta o cheque) y, opcionalmente, la referencia antes de confirmar.
- **Comprobación:** PUT `{estado:'pagado'}` sin método → 400. Con `metodoPago:'efectivo'`, la transacción creada tiene `metodo_pago = 'efectivo'` (consultar `transactions` por `id_transaccion`).

### T3-06 · RF-071 · Producto con nombre único y stock no negativo (Media)
- **Archivo:** `backend/controllers/InventarioController.js:65-90` (createProduct).
- **Qué validar:**
  - nombre único sin distinguir mayúsculas (`SELECT 1 FROM products WHERE LOWER(name) = LOWER($1)`) → 409;
  - `stock` entero mayor o igual a 0 → 400.
- **Para T2, opcional:** índice único `LOWER(name)` y `CHECK (stock >= 0)` por migración. Hoy no hay nombres duplicados ni stock negativo en la BD (consultado el 2026-11-06).
- **Comprobación:** crear dos productos con el mismo nombre → el segundo da 409; `stock: -1` → 400.

### T3-07 · RF-074 · Stock no negativo al editar (Media)
- **Archivo:** `backend/controllers/InventarioController.js:92-121` (updateProduct).
- **Qué validar:** si llega `stock`, que sea entero mayor o igual a 0 → 400; si llega `name`, que no choque con otro producto → 409.
- **Comprobación:** PUT `{stock:-5}` → 400.

### T3-08 · RF-034 · El cierre contable no sobrescribe ni cierra el mes en curso (Media)
- **Archivos:**
  - `backend/routes/admin.js:105-163` (`POST /api/admin/cierre-mensual`);
  - `backend/server.js` en `entrega/t3-codigo:226-281` (`runMonthlyClose`, también usa `ON CONFLICT ... DO UPDATE`);
  - `frontend/src/pages/admin/AdminReports.tsx:208-241, :437-465` (botón "Cerrar Mes Actual").
- **Qué hacer:**
  1. Rechazar con 400 el cierre de un mes en curso o futuro: (año, mes) debe ser anterior al mes actual.
  2. Si (año, mes) ya está `cerrado = true`, responder 409 y no cambiar nada. Hoy `ON CONFLICT (anio, mes) DO UPDATE` lo sobrescribe en los dos sitios. Usar `DO NOTHING` o comprobar antes.
  3. En la pantalla, cambiar a "Cerrar mes anterior" o a un selector de mes ya terminado.
- **Comprobación:**
  - POST con el mes actual → 400;
  - POST de un mes ya cerrado → 409, y `fecha_cierre` y `total_*` no cambian;
  - POST de un mes anterior sin cierre → 200.
  - Probar contra un esquema de pruebas, nunca contra `public` sin respaldo.

## Para T3: otros pendientes

- **Resuelto en `entrega/t3-codigo` (verificado):**
  - bloqueo de cuenta y usuario inactivo en el login (commit `0e14615d`, `auth.js:43-89`);
  - `backend/node_modules` fuera del índice (0 archivos en el árbol de esa rama);
  - `npm test` ejecuta `node --test "tests/**/*.test.js"`.
- **Sigue abierto:** `backend/routes/forgotPassword.js` escribe en el log un diagnóstico con `token_preview` (los primeros 20 caracteres del hash del OTP). En `entrega/t3-codigo` sigue presente (2 apariciones).
- **Sigue abierto:** bcrypt con 10 rondas en `backend/routes/users.js:121` y `:213`, contra 12 en el resto. RNF-010 se redacta como "factor de costo de al menos 10"; si se sube a 12, avisar a T1 para ajustar la matriz.

## Para T2 (base de datos)

1. `factura` tiene dos columnas para el número: `nro_factura` (60) y `numero_factura` (50). El módulo nuevo escribe ambas con el mismo valor. Hay que elegir una.
2. `detalle_factura.descuento` e `iva` son `numeric(5,2)` sin comentario. El código nuevo los trata como porcentajes; falta el `COMMENT ON COLUMN`.
3. La fila `factura` id 1 (`FAC-2026-0001`) no salió de ningún código del repo. Ver `docs/alineacion/origen_datos_factura.md`. Preguntar a Samuel si se borra.
4. `alerta_sistema` solo guarda alertas de tipo `error_sistema`. Las alertas de pagos (RF-031) se calculan en vivo y no usan esa tabla.
5. Opcional, ligado a T3-06 y T3-07: índice único `LOWER(products.name)` y `CHECK (products.stock >= 0)`.
