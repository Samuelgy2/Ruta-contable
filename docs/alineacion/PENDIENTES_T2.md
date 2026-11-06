# Pendientes de T2 en rutas ajenas

T2 escribe solo en `backend/migrations/**` y `docs/bd/**`. Lo de abajo lo encontró T2, pero lo resuelve quien es dueño de la ruta. Detalle y evidencia: `docs/bd/bd-estandar.md`.

## Para T3 (backend)

1. **Bloqueo de D4 y del paso 7 de L2b.** `setupDatabase()` en `backend/server.js:118-207` hace:
   - `CREATE TABLE IF NOT EXISTS users` (`:121`) y `transactions` (`:184`);
   - siembra `admin`/`admin123` (`:147-151`);
   - recrea `idx_socio_documento` (`:178`).

   Si T2 renombra tablas (D4) o borra ese índice antes de que se quite este DDL (plan §9.1.2), el siguiente arranque recrea los objetos, incluidas las tablas vacías con el admin por defecto. **Orden obligatorio: primero T3 quita el DDL y lo despliega; después T2 migra.**
2. `transactions_metodo_pago_check` solo admite `efectivo/transferencia/tarjeta/cheque`. Revisar qué `metodo_pago` manda `controllers/PagoController.js` cuando una pasarela aprueba un pago. NO VERIFICADO.
3. `users.reset_token`: confirmar si se guarda en claro o con hash (`routes/forgotPassword.js`). NO VERIFICADO.

## Para T1 (brechas.csv)

| Tema | Evidencia | Nota |
|---|---|---|
| RNF-009 (avisar errores a los administradores) | tabla `alerta_sistema` (2 filas), sin código que escriba en ella | La estructura existe, pero el código no la usa |
| RNF-007 (logs) | `auditoria` solo la escribe `controllers/LandingController.js:149` | Auditoría parcial: solo el módulo landing |
| RF-055/058 (facturación) | `factura`, `detalle_factura` y `pago_factura` existen, sin código | El esquema existe y la API no |
| `camerino`, `poliza_salud` | tablas sin código, 0 filas | El README las declara como API pendiente |
| `tipo_cartera`, `cartera.id_tipo_cartera`, `cartera.forma_pago` | sin uso en `backend/` | Ver si algún RF de cartera las pide |
| `movimiento_inventario` | 5 filas, sin código | Ver si el RF de inventario pide movimientos o kardex |
| `config_mensualidad` | sin código; se solapa con `system_data.dia_vencimiento_default` | — |
| Función `sp_registrar_pago_mensual` | inserta en `transaccion_fin`, tabla que no existe | Rota y sin uso |

## Para quien administre `graphify-out/`

`graphify-out/graph.json` no existe en este árbol, así que `graphify query` falla y T2 usó grep (regla del CLAUDE.md: aplica "cuando graph.json existe"). Para regenerarlo: `graphify update .`
