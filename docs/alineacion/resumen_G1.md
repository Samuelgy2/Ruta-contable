# Resumen de brechas para el Gate G1

Fecha: 2026-11-06. Rama: `entrega/rf-faltantes`. Fuente: `docs/alineacion/brechas.csv` (116 filas).
Comprobador: `python scripts/check_cobertura.py` → `OK: 97 requisitos cubiertos una vez, sin evidencias vacías`.

Este documento no decide nada: para cada brecha, la columna `accion` del CSV es una propuesta de T1. Las decisiones son de Samuel.

## 1. Números

| Estado | Filas |
|---|---|
| OK | 29 |
| PARCIAL | 61 |
| DUPLICADO | 5 (RF-022, RF-029, RF-046, RF-058, RF-070) |
| NO_IMPLEMENTADO | 2 (RF-069 retirado por D7, RNF-009) |
| FUERA_DE_MATRIZ | 19 (RF-088 a RF-097, RNF-011, RNF-012 y 7 módulos) |

| Acción propuesta | Filas |
|---|---|
| AJUSTAR_MATRIZ | 61 |
| AMBOS | 25 |
| AJUSTAR_CODIGO | 23 |
| SIN_CAMBIO | 7 |

Ya implementados en esta rama (2026-11-05): RF-050, RF-055/058 y RF-081. RF-031 ya existía.

## 2. Hallazgos que conviene ver antes que el resto

1. **El bloqueo de cuenta no funciona** (RF-002). `auth.js` guarda `locked_until` y nunca lo consulta, y el README dice lo contrario ("5 intentos → bloqueo 15 min"). Tampoco se revisa `active` al iniciar sesión (RF-020). Va para T3 con prioridad alta (`PENDIENTES_T1.md`).
2. **Hay datos en Supabase que no salieron de este repositorio.** La factura `FAC-2026-0001`, 5 filas de `movimiento_inventario` y 2 alertas `error_sistema` ("column nro_factura does not exist"), todas del 5 y 6 de noviembre. Nada en git, ni en los worktrees ni en las ramas remotas, escribe en esas tablas. Origen NO VERIFICADO. ¿Hay otra versión del backend desplegada en Render o en el equipo de alguien? Conviene aclararlo antes de integrar la facturación de esta rama.
3. **El método de pago no se guarda** al marcar una mensualidad o un cargo de cartera como pagado (RF-056, prioridad Media): la transacción queda con `metodo_pago` NULL.
4. **El resumen financiero no filtra `transactions.estado`** (RF-008, RF-044). Hoy no se nota porque las 18 transacciones están "confirmada".

## 3. Decisión 1: código en RF de prioridad Media (D1)

D1 dice que el código se toca solo en RF de prioridad Media a los que les falta poco. Estos 8 cumplen esa condición:

| RF | Qué falta |
|---|---|
| RF-007 | Buscador por nombre, usuario o correo en el panel de usuarios |
| RF-015 | Validar el formato del correo y del NIT en Datos del Club |
| RF-024 / RF-025 | Exigir la descripción en el backend |
| RF-048 | Exigir la fecha de nacimiento del socio |
| RF-056 | Selector de método de pago y validación en el backend |
| RF-071 | Nombre de producto único y stock no negativo |
| RF-074 | Stock no negativo al editar |

Los otros 15 marcados AJUSTAR_CODIGO son de prioridad Baja. Con D1, por defecto se resuelven ajustando la matriz salvo que decidas otra cosa: RF-008, RF-018, RF-020, RF-026, RF-028, RF-042, RF-043, RF-060, RF-061, RF-064, RF-065, RF-068, RF-079, RF-087 y RNF-007.

## 4. Decisión 2: las 25 filas AMBOS

En estas filas la matriz pide algo que el sistema hace distinto, y hay que elegir el lado. Las que más pesan:

- **Auditoría** (RF-006, RF-017, RF-037, RF-051, RF-075, RF-080, MOD-AUDITORIA): varias RN la piden y solo la landing la registra. Hay dos caminos: extender `auditar()` o quitar esas RN.
- **Cierre contable** (RF-034): el botón manual cierra el mes en curso a medias y los cierres se sobrescriben. Hay dos caminos: restringir el botón o cambiar la RN.
- **Eliminar socio** (RF-052): la RN pide eliminación lógica y el sistema borra la fila. Hay dos caminos: cambiar el código o la RN.
- **Generar mensualidades** (RF-053): la función `sp_generar_mensualidades_anual` ya existe en la base y nada la llama. Hay dos caminos: exponerla o redactar el RF como "registrar".
- **Inventario** (RF-072): aprobar una compra no suma stock y `movimiento_inventario` no se usa. Hay dos caminos: implementarlo o declararlo fuera de alcance.
- **Seguridad** (RF-001, RF-002, RF-004, RF-005, RNF-010): una parte va a T3 y otra es redacción de la matriz.
- **RNF sin medición** (RNF-004, RNF-005, RNF-008, RNF-009): definir cómo se miden o si se reescriben.

## 5. Anomalías conocidas de la matriz: confirmadas con evidencia

| Anomalía (PLAN §1.1) | Resultado |
|---|---|
| RF-013 y RF-022 con la misma descripción | Confirmada. RF-022 marcado DUPLICADO. |
| RF-055 y RF-058 con la misma descripción | Confirmada. Además RF-058 exige "proveedor existente", que D7 elimina. |
| RF-029, RF-045 y RF-048: tres veces "registrar socios" | Confirmada. RF-029 está además en el proceso Financiera. |
| RF-001 bajo "Inicio de Sesión", habla de "gestor", celdas sueltas | Confirmada: `51/66` en la columna L de RF-001. Hay una "X" suelta en la columna J de 15 RF: 002, 003, 004, 008, 014, 015, 028, 031, 040, 057, 069, 070, 071, 072 y 073. |
| Nombres de proceso inconsistentes | Confirmada: `compras`, `inventario`, `Categoria`, y "Proveedores" queda vacío tras D7. El proceso "Categoria" mezcla dos catálogos distintos (`categories` y `categoria_producto`). |
| Reportes solapados (RF-023, 026, 033, 035, 036, 039, 044, 046) | Confirmada: solo hay una pantalla de reportes y no tiene filtros. Propuesta: dejar 2 RF, "consultar/generar" y "exportar". |
| RNF-010 dice "MD5 o SHA1 o superior" | Corregida: el sistema usa bcrypt (es "superior"). Pero `users.js` usa 10 rondas y el resto 12: el README dice 12. |

**Anomalías nuevas encontradas en L1:**
- La RI de RF-062 y la de RF-063 están corridas una fila.
- RF-021 tiene la RI y las RN vacías.
- La RN1 de RF-009 contiene una nota editorial.
- En RF-014 la numeración de las RN salta de RN4 a RN6.
- La RN-005.3 de RF-027 habla de bloquear al usuario en un formulario de transacciones.
- RF-044 menciona un rol "tesorero" que no existe.
- Las RN de RF-082 a RF-087 son solo títulos.
- Cartera habla de "clientes" y el sistema solo tiene socios.
- Varios comentarios del código citan números de RF que no corresponden (por ejemplo, "RF-017" en lugar de RF-028, "RF-066" en lugar de RF-084 y "RF-025" en lugar de RF-031).

## 6. Fuera de la matriz (para la matriz v2)

- **Landing:** RF-088 a RF-097 y RNF-011/012. D6 decide agregarlos como proceso propio. La definición de RF-096 es NO VERIFICADO; el candidato es la auditoría de la landing.
- **Módulos sin RF:** portal del socio, pagos en línea (PayPal), auditoría, alertas, vínculo usuario–socio, periodos mensuales y campañas de jersey.

## 7. Qué sigue después de G1

Con tus decisiones, T1 arma `docs/matriz/matriz_v2.xlsx` y el registro de cambios fila por fila. Los cambios de código aprobados van a T3. Los pendientes para T2 y T3 ya están en `docs/alineacion/PENDIENTES_T1.md`.
