# ANOMALIAS (borrador T4, no commiteado)

Fecha de revisión: 6 nov 2026. Fuentes leídas:
- Matriz de requisitos (Drive, id 1nXJ7u5gQb2XSq1pVsM6VYh_cEOQxWtzr, .xlsx). Texto completo leído (hojas RNF, RF y RS/trazabilidad).
- Los 8 planes de prueba (Drive, carpeta "Planes de prueba", ids en la tabla de fuentes). Texto completo leído.
- Código y aplicativo: NO revisados en esta pasada. Lo que los planes dicen del código o de la pantalla se marca "reportado por plan, NO VERIFICADO".

Criterio: "verificado" = contrastado con el texto de la matriz o de los planes (archivo y celda/ID citados). Nada más.

## A. Contradicciones internas de la matriz (verificado en el texto)

| # | Hallazgo | Evidencia | Acción sugerida |
|---|---|---|---|
| A1 | RF-088 a RF-097 (landing) no tienen descripción en la hoja RF; aparecen solo como IDs en la hoja de trazabilidad (Proceso 8 y 9). | Hoja RF termina en RF - 087 (fila 209). Trazabilidad: "RF-8 088…090", "RF-9 091…097" sin texto. | Agregar proceso Landing con RI/RN (decisión D6). |
| A2 | RF-013 y RF-022 con la misma descripción y mismas reglas. | Filas 31-32 y 40-41: "Visualización de transacciones contables". | Fusionar o diferenciar (plan 06 ya lo anota). |
| A3 | RF-024 y RF-025 con RI/RN idénticos (ingreso y egreso). | Filas 42-46. RN-001.1 a 001.3 copiadas en RN- 024 y RN- 025. | Decidir si es un requisito o dos. |
| A4 | RF-055 y RF-058 con texto casi idéntico ("Gestión de facturación"); solo cambia "socio o proveedor" por "proveedor". | Filas 119-136. | Fusionar (plan 08 ya lo anota). |
| A5 | RF-029, RF-045 y RF-048 son "registro de socios". RF-047 y RF-049 son "consulta de socios". | Filas 58, 94-103. | Fusionar en uno por función. |
| A6 | RF-033 y RF-046 con RI y RN idénticos ("Visualizar reportes y estadísticas"). | Filas 69-70 y 99-100. | Fusionar (plan 07 lo anota). |
| A7 | RF-021 (jersey, "escoger especificaciones") sin RI ni RN. | Fila 39: RI-021 y RN-021 vacías. | Completar RI-021 y RN-021 o marcar RF como incompleto (plan 05). |
| A8 | Columna "RN" no coincide con los identificadores escritos dentro de la celda. | Fila 52: la columna RN dice "RN- 027" pero el texto usa "RN-005.1 … RN-005.3". Fila 49: columna "RN- 026" con texto "RN-002.1 … RN-002.4". Fila 42: "RN- 023" con "RN - 001…004". | Renumerar RN de forma única. |
| A9 | El mismo ID de regla se usa para reglas distintas. "RN-005" es "Solo gestores… editar administrador" (RF-005), y "RN-005.x" también aparece en RF-027 (campos vacíos). "RN-006" es RF-006, y "RN-006.x" es RF-028 (rango de fechas). "RN-002" es RF-002, y "RN-002.x" es RF-026. | Filas 24-26, 52-57, 56-58, 20-21, 49-52. | Esquema único de IDs de regla. |
| A10 | Bloqueo tras 3 intentos fallidos está en la regla de transacciones (RF-027), no en la de inicio de sesión. | Fila 55: "RN-005.3 … El sisema bloqueara al usuario tras 3 intentos fallidos" dentro de RF-027. RF-002 (fila 21) no menciona bloqueo. | Decidir si el bloqueo es de login (y moverlo a RF-002) o de transacciones. Hoy no es coherente. |
| A11 | Nota editorial dentro de la matriz. | Fila 28, RN-009 Rn1: "(La redacción original, 'pero no tenga gestión sobre el aplicativo', es ambigua.)" | Quitar la nota y redactar la regla. Plan 03 dice que usa una "redacción ajustada". |
| A12 | RN-014 salta de RN4 a RN6 (no existe RN5). | Fila 33: "RN1… RN2… RN3… RN4… RN6". | Corregir numeración o agregar la regla que falta. |
| A13 | Contraseña mínima: matriz 6 caracteres. | Fila 20 (RN- 001 Rn4) "mínimo 6 caracteres"; fila 22 (RN- 003) "mínimo 6". Reportado por plan 01 y plan 05: la app pide 8 en registro público. | Decidir valor único (D1). Ver B4. |
| A14 | RNF-010 pide "MD5 o SHA1 o superior". | Fila 14. El README declara bcrypt (plan maestro §1.5, NO VERIFICADO aquí). | Redactar con el algoritmo real. |
| A15 | RF-016 pide validar unicidad de "documento", y la RI-016 pide validación en tiempo real. | Filas 34-35. Plan 05 indica que la app no tiene campo documento (reportado, NO VERIFICADO). | Ajustar matriz o agregar campo. |
| A16 | Errores de redacción que aparecen en la matriz. | "admnistradores" (RNF-009, fila 13); "sisema" (fila 55); "encriptará" (fila 14); "Resquisitos - Proceso 7" (hoja RS); "solo." suelto en RI-063 (fila 153); "Categoria" singular y "compras"/"inventario" en minúscula (filas 137, 170, 158). | Corregir en matriz v2. |
| A17 | Nombres de proceso inconsistentes. | "Administrador", "Configuracion del sistema", "Categoria" (singular), "compras", "inventario". Mayúsculas y tildes irregulares. | Normalizar (L2/L1). |
| A18 | RF-069 (gestionar proveedores), RF-070 y RN-069 a 070 siguen en la matriz. | Filas 163-170. D7 decidió quitar la tabla proveedores. | Retirar o marcar fuera de alcance en matriz v2 (plan §9.4). |
| A19 | RF-059 y RF-070 repiten reglas de compra (proveedor obligatorio, pendiente de aprobación). | Filas 138-141 y 166-169: texto idéntico. | Fusionar; D7 cambia el proveedor a texto libre. |
| A20 | RF-001 aparece bajo el subproceso "Inicio De Sesion" pero describe "registrar un administrador". | Fila 19. | Mover a Gestión de administrador o aclarar. |

## B. Matriz vs planes (citas que no coinciden con el texto de la matriz)

| # | Plan | Caso | Problema | Evidencia |
|---|---|---|---|---|
| B1 | 01 Inicio de sesión | EP-ISE-02, CP-ISE-11, riesgo | Cita "RN-027.3" para el bloqueo de 3 intentos. La ID no existe; el texto está en RN-005.3 (celda RN- 027). Mismo plan dice en EP-ISE-02 que la matriz pide 3 intentos y en el riesgo dice que la matriz "no lo define". Se contradice dentro del propio plan. | Plan 01 §3, §8 y §11; matriz fila 55. |
| B2 | 01 Inicio de sesión | CP-ISE-09 | Cita "RN-002.3" para credenciales incorrectas. RN-002.3 (con punto) es de RF-026 (reportes). La regla correcta es RN- 002 Rn3 (texto igual). | Matriz fila 21 y fila 50. |
| B3 | 02 Gestión de admin | CP-ADM-11, CP-ADM-12, EP-ADM-04 | Cita "RN-005.1/.2/.3" y "RN-006.2" como reglas de administrador. En la matriz, RN-005.1 a 005.3 son reglas de transacciones (RF-027), y RN-006.1 y 006.2 son de RF-028. El texto de RN- 005 y RN- 006 (sin punto) sí corresponde a administrador. | Matriz filas 24-25, 52-58. |
| B4 | 01, 05 | CP-ISE-04, CP-USR-04, CP-USR-10 | Política de contraseña: la app pide 8 en registro público y 6 en panel (reportado). La matriz dice 6. | Ver A13. |
| B5 | 04 Datos del club | EP-DCL-02, riesgo | Cita RN1 a RN4 y RN6 de RN-014. Las citas son correctas, pero la matriz no tiene RN5 (ver A12). El plan no lo señala. | Matriz fila 33. |
| B6 | 06 Gestión financiera | CP-FIN-37 | Cita "RF-027 bloqueo 3 intentos fallidos" para el login de administrador. El texto está en la regla de transacciones (RN-005.3 de RF-027). Mismo problema que B1. | Matriz fila 55. |
| B7 | 08 Pagos | CP-PAG-21 | Cita "RN-004 de RF-054" para exento y cancelado. La RN-004 de RF-054 es "no dos pagos activos" y no menciona exento ni cancelado. | Matriz fila 119 (RN-054 RN-004). |
| B8 | 03 Visualización | CP-VIS-02, CP-VIS-05, CP-VIS-08 (y otros) | Citas "RN-008.3", "RN-009.1", "RN-011.1/.2/.4", "RN-013.2/.3/.4". Usan notación con punto que no existe en RN-008 a 013 (la matriz usa "Rn1", "RN - 001"). | Matriz filas 27-33. |
| B9 | 05 Gestión de usuario | CP-USR-21 | Cita "RF-020 / RN-01" para inicio de sesión de usuario inactivo. RF-020 RN-01 (fila 39) sí dice que no puede iniciar sesión. Correcto, pero el login de administrador (plan 01) no cubre este caso. | Matriz fila 39. |
| B10 | 07 Socios | CP-SOC-06, CP-SOC-07, CP-SOC-14 | Cita "RN-004 de RF-045" para vincular usuario con socio. El texto de RN-004 dice que el socio no gestiona el aplicativo ("sin rol de sistema"). El plan usa esa regla para una función que la matriz no describe (ver C7). | Matriz fila 99 (RN-045 RN-004). |
| B11 | 08 Pagos | CP-PAG-31 | Cita "RF-058 / RN-001" y "RN-002 a RN-006" de facturas de proveedores. Esas reglas son de RF-058 (facturación), que sigue en la matriz aunque D7 quitó proveedores. | Matriz filas 131-136. |

## C. Inconsistencias entre planes y con las decisiones de Samuel (verificado en el texto de los planes)

| # | Hallazgo | Evidencia | Acción sugerida |
|---|---|---|---|
| C1 | Cuenta de administrador de prueba con dos nombres: "admin_test" en planes 01 a 04 y "admin_demo" en planes 05 a 08. Ambos descritos como "dueño (owner)". | Plan 01 §5; plan 02 §5; plan 05 §5; plan 06 §5. | Samuel decidió (6 nov) usar la cuenta `admin` para las capturas. Falta cambiar en los planes 01–08 los nombres `admin_test` y `admin_demo`. |
| C2 | Cronograma vencido en los 8 planes: fechas 22/10 a 10/11/2026, y estados "En curso" o "En revisión". Hoy es 6 nov. | Sección 12 de los 8 planes. | Actualizar cronograma con el de F2 a F4 del plan maestro (sección 4). |
| C3 | Captura pendiente dentro del texto de un plan. | Plan 01, sección 8 (Figura 4): "[Captura pendiente: … 33-usuarios-cambio-rol.png … paso pasos-rol-usuario.json]". Choca con el comprobador de L4 (sin corchetes de plantilla). | Generar captura con scripts/tmp o quitar la nota. |
| C4 | Los planes 02 a 08 mencionan menú "Proveedores" y "Compras" (plan 03 CP-VIS-10 lista Proveedores). D7 quitó la tabla proveedores. | Plan 03 §8, CP-VIS-10. Plan 08 CP-PAG-31 (compras). | Actualizar menú de prueba cuando se ejecute la fase 2 de la migración D7. |
| C5 | Conteo de planes: plan maestro §7 exige 16 planes (8 existentes más 8 pendientes: compras, jersey, categorías, proveedores, inventario, cartera, asistencia y landing). Con D7 quedan 15. | Plan maestro §5 (L4) y §7 (punto 4), §9.4. | Corregir el número en §7 del plan maestro (se lo señalo a T1). |
| C6 | Los planes citan la matriz como "redacción ajustada" o "matriz actualizada" (planes 03 y 04), pero la matriz de Drive sigue con las notas y duplicados de A1 a A20. | Plan 03 §11 (riesgo 1); matriz fila 28. | Pedir a Samuel que confirme si la matriz v2 ya existe. Hasta entonces los planes usan la v1. |
| C7 | Vincular usuario a socio (función de la pantalla Socios) no aparece en la matriz. Plan 07 la prueba (CP-SOC-06/07) y la cita a RN-004 de RF-045. | Plan 07 §3 (EP-SOC-06). | Registrar como FUERA_DE_MATRIZ en brechas.csv (L1) o agregar RF. |
| C8 | Plan 01 da por hecho un campo "usuario" que el registro público no pide (genera el usuario desde la parte del correo). Matriz RI-001 pide usuario explícito. | Plan 01 CP-ISE-01 (paso 2 y resultado) frente a matriz fila 20 (RI-001, "usuario"). Plan 05 CP-USR-01 confirma la generación automática. | Anotar como diferencia matriz vs app en brechas. |

## D. Matriz vs aplicativo: reportado por los planes, NO VERIFICADO por T4

Estas diferencias las afirman los planes. T4 no revisó el código ni la app en esta pasada. Antes de usarlas en un manual o en brechas.csv, T1 o T3 deben confirmarlas con código o con la app.

| # | Afirmación del plan | Requisito de la matriz | Plan |
|---|---|---|---|
| D1 | No hay buscador ni filtros en Usuarios (solo paginación de 5). | RF-018 / RI-018 y RF-007 / RI-007 | 02, 05 |
| D2 | No hay acción "Inhabilitar" con confirmación; el estado se cambia en Editar. | RF-020 | 05 |
| D3 | Login no revisa si la cuenta está activa. | RF-020 RN-01 | 05 |
| D4 | No hay verificación de procesos activos al eliminar administrador ni registro de auditoría. | RN-006.1 y RN-006.3 | 02 |
| D5 | Bloqueo de login de 5 intentos por 15 minutos. Matriz dice 3 (ambiguo, ver A10). | RN-005.3 de RF-027 | 01, 06 |
| D6 | No hay recuperación con validación de la contraseña actual; solo recuperación por código. | RF-004 / RN-004.2 | 01 |
| D7 | NIT no se valida; el correo y los límites solo se validan en pantalla, no en servidor. | RN-014 RN2 | 04 |
| D8 | RN-015 (restricción de datos críticos) no existe. | RN-015 RN-003/004 y RN-014 RN6 | 04, 07 |
| D9 | Reportes sin selector de periodo ni tipo, sin Excel ni gráficos. Exporta CSV, PDF y JSON. | RF-023, RF-026, RF-033, RF-035, RF-036 | 06 |
| D10 | Cierre de mes manual, sobre el mes en curso, sin validar periodo completo. | RF-034 / RN-018.2 | 06 |
| D11 | Filtro de transacciones permite fecha final menor que inicial, sin validar. | RF-028 / RN-006.2 | 06 |
| D12 | Transacciones sin columna Estado ni detalle completo (solo pasarela). | RF-022 / RI-022 | 06 |
| D13 | Socios sin fecha de nacimiento obligatoria; sin registro de documentos múltiples; borrado físico sin eliminación lógica; sin validación de dependencias financieras. | RF-048 RN-001, RF-050 RN-002, RF-052 RN-002/003 | 07 |
| D14 | Mensualidades: no pide fecha ni valor de pago (usa hoy y valor completo); no admite abonos; no pide método. | RF-054 / RI-054, RF-056 | 08 |
| D15 | No existe cartera masiva por periodo ni subproceso de facturación para socios. | RF-053, RF-055, RF-058 | 08 |
| D16 | No hay confirmación antes de guardar transacción. | RI-019 (RF-019) y RF-024/025 | 05, 06 |
| D17 | No hay registro de quién, cuándo y qué cambió al editar usuario. | RF-017 RN-02 | 05 |
| D18 | Alertas en campana de barra superior, no en el panel principal. | RN-014.2 | 06 |
| D19 | Validación en navegador (atributo required) impide ver los mensajes propios de error del aplicativo. | Código muerto de mensajes | 02, 04, 05, 06, 07, 08 |

## E. Estado de las fuentes y pendientes (actualizado el 6 de noviembre de 2026)

- Matriz v2 (incluye landing y D7): no existe todavía. Los planes y este documento usan la matriz v1 de `docs/fuentes/`.
- Plantilla `Formato_Plan_de_Pruebas.docx`: está en `docs/fuentes/plantillas/` (copiada por T1 desde Descargas). Según el README de fuentes, que sea la versión final es NO VERIFICADO. T4 la usó y su estructura coincide con la de los 8 planes (13 secciones).
- `docs/fuentes/` existe en el repositorio principal (sin versionar), no en el worktree `rc-t4`. T4 lee de ahí por ruta absoluta.
- Otros dos juegos de planes (Drive de un compañero, 29 oct, y `Plan  de prueba definitivo` en disco): Samuel decidió el 5 de noviembre que ninguno está vigente. Solo valen los 8 de `docs/fuentes/planes/`. El hallazgo anterior sobre `14_Plan_de_Pruebas_Gestion_de_cartera.docx` y `04_Plan_de_Pruebas_Datos_del_club.docx` queda cerrado por esa decisión.
- Cuenta de captura: Samuel indicó usar `admin` (6 nov). Falta cambiar en los planes 01 a 08 los nombres `admin_test` y `admin_demo`; no se ha hecho.
- Plan 11 de categorías: redactado (ver sección F). Faltan jersey (10), inventario (13), cartera (14) y asistencia (15). Compras (09) y landing (16) esperan a D7 y a la matriz v2.

## F. Categorías (plan 11): matriz contra código

Verificado leyendo el código del worktree. Detalle y líneas en `docs/pruebas/evidencia/11-categorias.md`. Nada se ha ejecutado.

| # | Hallazgo | Evidencia | Acción sugerida |
|---|---|---|---|
| F1 | RF-042 y RF-043 (Financiera) y RF-065 a RF-068 (Categoria) describen la misma función en dos procesos. | Hoja RF de la matriz, filas de RF-042, RF-043 y RF-065 a RF-068. | Fusionar en matriz v2 (L1). |
| F2 | RN-066 a RN-068 son listas de campos ("RN.1 Nombre…"), no reglas de negocio. Las reglas reales están en RF-042 y RF-043. | `docs/fuentes/matriz_rf_plano.csv`, filas de RF-066 a RF-068. | Reescribir las reglas o apoyarse en RF-042 y RF-043. |
| F3 | RI-065 pide alerta cuando no hay categorías de gasto activas. La pantalla solo avisa si no existe ninguna categoría de gasto. | `AdminCategories.tsx:109,227-232`. | AJUSTAR_MATRIZ por defecto (RF de prioridad Baja). |
| F4 | RF-042 RN-001 y RN-003 piden unicidad y nombre no vacío también al editar. El servidor no valida ninguna de las dos al actualizar. | `CategoryController.js:90-120`. Efecto en ejecución: NO VERIFICADO. | AJUSTAR_MATRIZ por defecto; si Samuel prefiere código, es un cambio chico en `update`. |
| F5 | La matriz usa `expense` e `income` (RF-042, RF-043) y "Gasto" e "Ingreso" (RF-065 a RF-068). | Matriz. | Un solo vocabulario. |
| F6 | El tipo de una categoría se puede cambiar al editar, aunque tenga transacciones. La matriz no lo dice. | `CategoryController.js:99-113`. | FUERA_DE_MATRIZ: decidir si se bloquea. |
| F7 | La comparación de duplicados distingue mayúsculas (`name = $1`). La matriz no lo define. | `CategoryController.js:68-70`. | Observación. |
| F8 | Eliminar categoría existe en la pantalla y en la API. No hay RF propio, solo la regla RN-002 de RF-042 y RF-043. | `AdminCategories.tsx:175-182`, `CategoryController.js:123-146`. | Agregar RF de eliminación en matriz v2 o dejarlo bajo RF-042 y RF-043. |

## G. Ambiente y seguridad (afecta a todos los planes)

| # | Hallazgo | Evidencia | Acción sugerida |
|---|---|---|---|
| G1 | El frontend de `http://localhost:5173` usa el backend publicado en Render. El login de las capturas fue a `https://ruta-contable.onrender.com/api/auth/login`. El ambiente de capturas es el publicado. | `scripts/tmp/capturas-cat/resumen.json`, campo `peticionesAuthPermitidasDuranteLogin`. | Informar a T1 y a Samuel. Los casos que escriben afectan datos reales. |
| G2 | La cuenta `admin` con la contraseña por defecto del sembrado de `server.js` inicia sesión en ese backend. El plan de entrega (§1.4) decía que esa cuenta no la usaba. | Login automático exitoso del 6 de noviembre ("Sesión detectada") en el log de la corrida. Qué base usa Render: NO VERIFICADO. | Hallazgo crítico para T3 y `seguridad.md`: rotar la contraseña. |

## H. Asistencia (plan 15): matriz contra código

Verificado leyendo el código del worktree y mirando la pantalla el 6 de noviembre de 2026. Líneas en `docs/pruebas/evidencia/15-asistencia.md`. Nada se ha ejecutado.

| # | Hallazgo | Evidencia | Acción sugerida |
|---|---|---|---|
| H1 | **Defecto visible:** el mismo registro muestra 26/08/2026 en el listado y 27/08/2026 en el formulario de edición. Causa probable (no verificada): la fecha llega como marca de tiempo UTC y el listado la convierte a la zona horaria del navegador. | Capturas `150-asistencia-lista.png` y `152-asistencia-editar.png`; `utils/format.ts:14-21`, `AdminAsistencia.tsx:153,325`. | AJUSTAR_CODIGO: corregir el formato de fechas y revisar otros listados con fechas. Para T3. |
| H2 | RF-082 y RF-085 repiten las mismas cinco reglas (títulos sin desarrollar). RI-082 nombra dos estados y RI-085 y la pantalla usan cuatro. | Matriz, hoja RF, RF-082 y RF-085. | Fusionar y unificar estados en matriz v2. |
| H3 | RN-086 RN3: no eliminar registros ligados a alertas activas. RN2: la eliminación queda registrada. El servidor elimina directo, sin ninguna de las dos. | `AsistenciaController.js:135-151`. | AJUSTAR_MATRIZ por defecto (RF de prioridad Baja). |
| H4 | RN-087 RN2 y RN3: el reporte incluye el periodo y conserva lo que muestra la pantalla. El archivo no trae el periodo y la exportación ignora el estado y el buscador. | `AsistenciaController.js:284-330`; `AdminAsistencia.tsx:192`. | AJUSTAR_MATRIZ por defecto. |
| H5 | RN-003 de RF-084 pide configurar los parámetros de la alerta. Los umbrales son fijos en la pantalla (3, 5 y 30 días). | `AsistenciaController.js:227-229`; `asistenciaService.ts:35-38`. | AJUSTAR_MATRIZ por defecto. |
| H6 | RN-004 de RF-082 (restricción por estado del socio): solo se cumple en la pantalla. El servidor acepta cualquier socio y permite duplicados de socio y fecha. | `AsistenciaController.js:72-90`. | Observación; validar en servidor si Samuel lo pide. |
| H7 | Al editar, el formulario deja cambiar el socio pero el servidor lo ignora y avisa éxito. | `AdminAsistencia.tsx:169-173`; `AsistenciaController.js:103,116-125`. | AJUSTAR_CODIGO menor: quitar el campo en edición o guardarlo. |
| H8 | RI-083 pide consultar por socio o por actividad. La pantalla busca solo por nombre del socio. | `AdminAsistencia.tsx:147,297`. | AJUSTAR_MATRIZ por defecto. |
| H9 | `saveChecklist` (checklist masiva) está en el controlador y no tiene ruta ni pantalla. Los comentarios del controlador citan RF-064 a RF-069, que no existen con ese sentido en la matriz (la asistencia es RF-082 a RF-087). | `AsistenciaController.js:10,67,99,134,153-220,222,281`; `routes/asistencia.js:8-14`. | FUERA_DE_MATRIZ. Decidir si se publica o se elimina; actualizar comentarios. |
| H10 | RF-082 a RF-087 no están en el orden de uso real: RF-085 y RF-086 (editar y eliminar) van tras las alertas, y el plan 15 los sigue por la ruta de uso. | Matriz, orden de filas. | Solo informativo. |
