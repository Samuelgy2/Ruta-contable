# Pendientes de T2 en rutas ajenas

T2 escribe solo en `backend/migrations/**` y `docs/bd/**`. Lo de abajo lo encontró T2, pero lo resuelve quien es dueño de la ruta. Detalle y evidencia: `docs/bd/bd-estandar.md`.

## Para T3 (backend) — Estado al cierre

1. **Resuelto (DDL en `server.js`):** T3 reemplazó `setupDatabase()` por `verificarEsquema()` en `backend/server.js`.
2. **Resuelto (Fase 2 de proveedores):** Tras desplegar en Render el código sin `/api/proveedores`, se aplicó `backend/migrations/20261105_proveedores_fase2_eliminar.up.sql` en Supabase (versión `20261106202639`) y se regeneraron `docs/bd/diccionario.md` y `docs/bd/er.md`.
3. **Verificado (`transactions_metodo_pago_check`):** `controllers/PagoController.js` registra pagos de pasarela con `'tarjeta'`, que cumple el CHECK (`efectivo/transferencia/tarjeta/cheque`).
4. **Resuelto (`users.reset_token`):** `routes/forgotPassword.js` almacena `reset_token` como hash SHA-256 (`crypto.createHash('sha256')`) y sin trazas de diagnóstico en consola.

## Para T1 (brechas.csv) — Estado al cierre

| Tema | Evidencia | Nota |
|---|---|---|
| RNF-009 (avisar errores a los administradores) | `server.js`, `routes/admin.js` y `useAlerts.ts` | Implementado: errores 5xx se registran en `alerta_sistema` y se muestran en la campana |
| RNF-007 (logs) | `auditoria` en `LandingController.js` + `morgan` y `security.log` | Alineado en `matriz_v2.xlsx` |
| RF-055/058 (facturación) | `FacturaController.js`, `routes/facturas.js`, `AdminFacturas.tsx` | Implementado e integrado |
| `camerino`, `poliza_salud` | tablas sin código, 0 filas | Documentadas como reserva para versiones futuras |
| `tipo_cartera`, `cartera.id_tipo_cartera` | `CarteraController.js`, `AdminCartera.tsx` | Implementado (RF-081) |
| `movimiento_inventario` | `InventarioController.js`, `CompraController.js`, `AdminInventario.tsx` | Implementado (RF-072, Kardex de movimientos) |
| `config_mensualidad` | sin código; se usa `system_data.dia_vencimiento_default` | Documentado en `diccionario.md` |
| Función `sp_registrar_pago_mensual` | reemplazada en uso por `registrar_pago_mensual` | Documentado en `bd-estandar.md` |

## Para T4 (README y manuales)

- Resuelto: `README.md`, `MANUAL_TECNICO.md` y `MANUAL_INSTALACION.md` enlazan a `docs/bd/er.md`, `docs/bd/diccionario.md`, `backend/migrations/0000_baseline.sql` y `docs/bd/CAMBIOS.md`.

## Para quien administre `graphify-out/`

- Resuelto: `graphify update .` ejecutado tras la integración.
