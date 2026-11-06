"""Genera docs/matriz/matriz_v2.xlsx y docs/matriz/CAMBIOS_MATRIZ.md.

Fuente: docs/fuentes/matriz_requisitos.xlsx (Drive, 2026-11-03), sin modificarla.
Cada cambio lleva su motivo: una decisión (G1, D6, D7) o la evidencia de
docs/alineacion/brechas.csv. Ningún RF existente se renumera.

Uso: python scripts/genera_matriz_v2.py
"""
import re
import sys
from copy import copy
from pathlib import Path

import openpyxl
from openpyxl.styles import PatternFill

RAIZ = Path(__file__).resolve().parent.parent
FUENTE = RAIZ / "docs/fuentes/matriz_requisitos.xlsx"
DESTINO = RAIZ / "docs/matriz/matriz_v2.xlsx"
CAMBIOS_MD = RAIZ / "docs/matriz/CAMBIOS_MATRIZ.md"

COL = {"proceso": 1, "subproceso": 2, "rf": 3, "descripcion": 4, "prioridad": 5,
       "ri_nro": 6, "ri": 7, "rn_nro": 8, "rn": 9, "estado_v2": 10}
G1 = "Decisión G1 (2026-11-06)"
BR = "brechas.csv"
cambios = []  # (rf, campo, antes, despues, motivo)


def norm_id(v):
    m = re.fullmatch(r"\s*RF\s*-\s*(\d{1,3})\s*", str(v or ""))
    return f"RF-{int(m.group(1)):03d}" if m else None


# ─── Cambios a RF existentes ──────────────────────────────────────────────────
# rf -> dict(campo -> (nuevo_valor, motivo)). Campos: descripcion, ri, rn, estado_v2.
RF = {
    "RF-001": {
        "ri": ("Nombre completo, nombre de usuario, correo electrónico, rol (Usuario o Administrador) y contraseña (mínimo 6 caracteres).",
               f"{G1}: RF-001 se ajusta a la matriz (AMBOS). Evidencia backend/routes/users.js:91-127."),
        "rn": ("Rn1: El nombre completo es obligatorio.\nRn2: El nombre de usuario es obligatorio y no puede repetirse.\n"
               "Rn3: El correo electrónico es obligatorio y no puede repetirse.\nRn4: La contraseña debe tener mínimo 6 caracteres (el formulario del panel no pide confirmarla).\n"
               "Rn5: Solo un administrador puede registrar usuarios y asignarles el rol Administrador.",
               f"{G1}: sin doble digitación de la contraseña; 'nombre y apellido' pasa a 'nombre completo'. Evidencia users.js:95-117."),
    },
    "RF-002": {
        "rn": ("Rn1: Para el inicio de sesión, el administrador ingresa su usuario o correo.\nRn2: El administrador ingresa su contraseña.\n"
               "Rn3: El sistema no permite el inicio de sesión si el usuario o la contraseña son incorrectos.\n"
               "Rn4: Tras 5 intentos fallidos la cuenta se bloquea 15 minutos.\nRn5: Un usuario inactivo no puede iniciar sesión.",
               f"{G1}: RF-002 OK tras la corrección de T3 (commit 0e14615d, entrega/t3-codigo:backend/routes/auth.js:43-89); se agrega el bloqueo como RN."),
    },
    "RF-004": {
        "descripcion": ("El sistema permitirá a cada usuario cambiar su propia contraseña validando la contraseña actual.",
                        f"{G1}: se precisa que es el cambio de la propia contraseña (se solapaba con RF-003). Evidencia backend/controllers/PortalController.js:182-221."),
        "ri": ("Contraseña actual, nueva contraseña (mínimo 8 caracteres) y su confirmación.", f"{G1}. Evidencia PortalController.js:4 (LONGITUD_MINIMA_PASSWORD = 8)."),
        "rn": ("Rn1: La nueva contraseña debe tener mínimo 8 caracteres.\nRn2: El sistema valida que la contraseña actual sea correcta antes de cambiarla.\n"
               "Rn3: El cambio se hace desde Configuración del portal (rol Usuario). El administrador recupera su contraseña con RF-003 o el gestor la cambia con RF-005.",
               f"{G1}. Evidencia PortalController.js:182-221; frontend/src/features/admin/components/AdminLayout.tsx:42."),
    },
    "RF-005": {
        "rn": ("Rn1: Solo los administradores pueden editar la información de un usuario.\nRn2: El rol debe ser Usuario o Administrador.\n"
               "Rn3: No se permiten nombre de usuario ni correo repetidos.",
               f"{G1}: RN2 queda con lo que valida el sistema. Evidencia users.js:158-247 y CHECK users_role_check."),
    },
    "RF-006": {
        "rn": ("Rn1: Solo los administradores pueden eliminar usuarios.\nRn2: No se puede eliminar el usuario 'admin'.\n"
               "Rn3: No se puede eliminar un usuario que tenga transacciones, compras aprobadas o campañas registradas (restricción de la base de datos).\n"
               "Mejora futura: registrar la eliminación en auditoría.",
               f"{G1}: auditoría como mejora futura; RN1 como restricción por claves foráneas. Evidencia users.js:249-269."),
    },
    "RF-008": {
        "ri": ("Ingresos y egresos registrados en el mes en curso.", f"{G1}: prioridad Baja, se ajusta la matriz. Evidencia backend/routes/admin.js:22-30."),
        "rn": ("Rn1: El saldo actual se calcula automáticamente (ingresos menos egresos).\nRn2: Solo el administrador puede consultar el saldo actual.\n"
               "Rn3: El saldo considera todas las transacciones registradas en el mes en curso.",
               f"{G1}: el cálculo no filtra por estado de la transacción (riesgo anotado en {BR})."),
    },
    "RF-009": {
        "rn": ("Rn1: Se considera socio activo el que tiene estado activo.\nRn2: El sistema contabiliza automáticamente el número de socios activos.\n"
               "Rn3: Solo el administrador puede visualizar los socios activos del club.",
               f"Se quita la nota editorial de la RN1 ({BR}: RF-009)."),
    },
    "RF-013": {
        "descripcion": ("El sistema permitirá consultar las transacciones contables.", "Unificación de descripciones duplicadas RF-013/RF-022 (instrucción de G1)."),
        "ri": ("Fecha, tipo, categoría, monto, descripción, método de pago, registrado por y origen (manual o pasarela).",
               "Evidencia frontend/src/pages/admin/AdminTransactions.tsx:649."),
        "rn": ("RN-001: Solo los administradores acceden a las transacciones.\nRN-002: Filtros por tipo, texto y rango de fechas.\n"
               "RN-003: Las transacciones de la pasarela muestran el detalle del pago en línea.\nRN-004: La edición y el borrado se rigen por RF-037.",
               f"Unificación con RF-022; 'solo lectura' no aplica (la pantalla edita). Evidencia {BR}: RF-013."),
    },
    "RF-014": {"estado_v2": ("Reemplazado por RF-015", f"{G1}: se fusiona con RF-015 (Datos del club).")},
    "RF-015": {
        "descripcion": ("El sistema permitirá configurar y actualizar los datos del club.", f"{G1}: fusión de RF-014 y RF-015."),
        "ri": ("Nombre del club, NIT, dirección, teléfono, correo electrónico, logo, moneda, día de vencimiento por defecto y porcentaje de mora.",
               "Evidencia backend/controllers/ClubDataController.js:26-52."),
        "rn": ("RN-001: Solo los administradores pueden actualizar los datos del club.\nRN-002: El nombre del club es obligatorio.\n"
               "RN-003: El correo, el NIT, el porcentaje de mora y el día de vencimiento deben tener un formato válido.\nRN-004: Los campos que no se envían conservan su valor.",
               f"{G1}: RF-015 va a código (tarea T3-02); RN-003 queda como objetivo de esa tarea. Numeración de RN corregida (en RF-014 saltaba de RN4 a RN6)."),
    },
    "RF-016": {
        "rn": ("RN-01: El registro debe completarse en menos de 3 segundos bajo condiciones normales de red.\nRN-02: La contraseña se almacena cifrada (hash) y nunca en texto plano; mínimo 8 caracteres.\n"
               "RN-03: El sistema valida el formato del correo y que el usuario y el correo no estén registrados.",
               "users no tiene documento; se valida usuario y correo. Evidencia backend/controllers/AuthController.js:6-50."),
    },
    "RF-017": {
        "rn": ("RN-01: Solo el administrador o el propio usuario pueden editar los datos.\nRN-02: Se guarda la fecha y hora de la última modificación; el registro del usuario responsable queda como mejora futura.\n"
               "RN-03: La actualización debe reflejarse en la interfaz en menos de 2 segundos tras confirmarse.",
               f"{G1}: auditoría como mejora futura. Evidencia trigger update_users_updated_at."),
    },
    "RF-018": {
        "ri": ("Listado de usuarios con nombre de usuario, nombre, correo, rol y estado.", f"{G1}: prioridad Baja, se ajusta la matriz (el panel no tiene buscador ni filtros). Evidencia UsersPanel.tsx:46."),
    },
    "RF-019": {
        "descripcion": ("El sistema permitirá generar transacciones: el administrador las registra y el socio las origina al pagar en línea.",
                        f"Se precisa el actor ({BR}: RF-019). Evidencia TransactionController.js:210-219 y PagoController.js:243."),
    },
    "RF-020": {
        "ri": ("Selector Activo/Inactivo en el formulario de edición del usuario.", f"{G1}: prioridad Baja, se ajusta la matriz. Evidencia UsersPanel.tsx:114."),
        "rn": ("RN-01: Un usuario inactivo no puede iniciar sesión y recibe el mensaje 'Usuario inactivo'.\nRN-02: Solo un administrador puede inhabilitar o reactivar usuarios.\n"
               "RN-03: El cambio de estado debe reflejarse de inmediato (menos de 2 segundos) en toda la interfaz.",
               f"{G1}: RN-01 corregida por T3 (entrega/t3-codigo:backend/routes/auth.js:87-89)."),
    },
    "RF-021": {
        "ri": ("Campaña activa, talla, estampado (opcional, hasta 60 caracteres) y cantidad.", "RI vacía en la fuente; se completa con backend/controllers/JerseyController.js:434-499."),
        "rn": ("RN-001: La cuenta debe estar vinculada a una ficha de socio.\nRN-002: La campaña debe existir y estar activa.\nRN-003: La talla debe ser una de las tallas de la campaña.\n"
               "RN-004: La cantidad es un entero entre 1 y 10.\nRN-005: Un pedido que ya pasó de 'Solicitado' no se puede modificar.",
               "RN vacías en la fuente; se completan con JerseyController.js:8-9 y :434-499."),
    },
    "RF-022": {"estado_v2": ("Reemplazado por RF-013", "Unificación de descripciones duplicadas RF-013/RF-022.")},
    "RF-023": {"estado_v2": ("Reemplazado por RF-036", "Unificación de reportes solapados en 'consultar/generar' (RF-036) y 'exportar' (RF-035).")},
    "RF-026": {"estado_v2": ("Reemplazado por RF-035", "Unificación de reportes solapados; su RN-002.4 pasa a RF-037.")},
    "RF-027": {
        "rn": ("RN-005.1: El sistema no permite guardar una transacción si falta algún campo obligatorio.\nRN-005.2: Campos obligatorios: fecha, monto, tipo de transacción, categoría y descripción.\n"
               "RN-005.3: El sistema muestra un mensaje que indica el campo faltante.",
               f"{G1}: se quita el bloqueo tras 3 intentos; la descripción obligatoria la implementa T3-03. Evidencia TransactionController.js:147-203."),
    },
    "RF-028": {
        "rn": ("RN-006.1: El administrador puede indicar una fecha inicial, una final o ambas.\nRN-006.2: Si la fecha final es menor que la inicial, no se muestran resultados.\n"
               "RN-006.3: Solo se muestran las transacciones dentro del rango seleccionado.",
               f"{G1}: prioridad Baja, se ajusta la matriz. Evidencia AdminTransactions.tsx:274-282."),
    },
    "RF-029": {"estado_v2": ("Reemplazado por RF-048", "Unificación de RF-029/RF-045/RF-048 (registrar socios).")},
    "RF-030": {
        "rn": ("RN-010.1: El dashboard lo ven los usuarios con rol Administrador.\nRN-010.2: Los indicadores se calculan con las transacciones registradas al abrir el Resumen.\n"
               "RN-010.3: Se muestra el mes en curso (sin selector de periodo en v1.0).",
               f"Se ajusta la matriz ({BR}: RF-030). Evidencia backend/routes/admin.js:9-100."),
    },
    "RF-031": {
        "rn": ("RN-014.1: El sistema genera una alerta cuando una mensualidad está pendiente o morosa.\n"
               "RN-014.2: Las alertas se muestran en la campana de notificaciones del encabezado del panel de administración.",
               f"Se precisa dónde se muestran ({BR}: RF-031). Evidencia useAlerts.ts:35; AdminLayout.tsx:313."),
    },
    "RF-033": {"estado_v2": ("Reemplazado por RF-036", "Unificación de reportes solapados.")},
    "RF-035": {
        "descripcion": ("El sistema permitirá exportar los reportes financieros y de socios del club.", "Unificación de reportes: RF-035 queda como el RF de 'exportar'."),
        "ri": ("Transacciones (CSV), reporte financiero (PDF), reporte de socios (PDF), respaldo completo (JSON) y Excel de un periodo cerrado.",
               "Evidencia frontend/src/pages/admin/AdminReports.tsx:167-199; backend/routes/admin.js:188."),
        "rn": ("RN-001: Solo los administradores pueden exportar.\nRN-002: Formatos: CSV, PDF y JSON desde la pantalla de Reportes; Excel por periodo cerrado disponible en la API (sin botón en la interfaz).\n"
               "RN-003: Se exporta toda la información registrada, sin filtros.\nRN-004: El nombre del archivo incluye la fecha de exportación.",
               "Unificación de RF-026 y RF-035. Evidencia AdminReports.tsx:176, :198."),
    },
    "RF-036": {
        "descripcion": ("El sistema permitirá consultar y generar los reportes y estadísticas financieras del club.", "Unificación de reportes: RF-036 queda como el RF de 'consultar/generar'."),
        "ri": ("Balance general (ingresos, egresos y saldo), cuotas de cartera (pagadas, pendientes y vencidas), indicadores del mes en el Resumen y periodos cerrados.",
               "Evidencia AdminReports.tsx:336-410, :493; backend/routes/admin.js:9-100, :165."),
        "rn": ("RN-001: Solo los administradores consultan los reportes.\nRN-002: Se calculan con la información registrada al momento de la consulta.\n"
               "RN-003: La consulta es de solo lectura.\nRN-004: En v1.0 no hay filtros de periodo ni de tipo de reporte (mejora futura).",
               "Unificación de RF-023, RF-033, RF-036, RF-039, RF-044 y RF-046."),
    },
    "RF-037": {
        "rn": ("RN-001: Solo los administradores gestionan transacciones.\nRN-002: Toda transacción tiene fecha, monto, tipo, categoría y descripción.\nRN-003: Cada transacción se clasifica por categoría de ingreso o gasto.\n"
               "RN-004: El monto debe ser mayor a cero.\nRN-005: La edición usa las mismas validaciones del registro; la auditoría de cambios queda como mejora futura.\nRN-006: Solo el administrador puede eliminar transacciones.",
               f"{G1}: auditoría como mejora futura; RN-006 viene de RF-026 (RN-002.4)."),
    },
    "RF-039": {"estado_v2": ("Reemplazado por RF-036", "Unificación de reportes solapados.")},
    "RF-040": {
        "descripcion": ("El sistema permitirá clasificar a los socios por nivel de aprendizaje (Iniciación, Rider School, Club).",
                        f"La descripción se alinea con sus RN ({BR}: RF-040). Evidencia CHECK socio.nivel_aprendizaje."),
    },
    "RF-041": {
        "rn": ("RN-001: El sistema muestra los movimientos financieros ordenados por fecha, del más reciente al más antiguo.\nRN-002: La consulta se hace en la pantalla de transacciones; la edición se rige por RF-037.\n"
               "RN-003: Solo los administradores acceden a esta información.",
               f"Se ajusta la matriz ({BR}: RF-041). Evidencia TransactionController.js:110-111."),
    },
    "RF-042": {
        "rn": ("RN-001: No pueden existir dos categorías con el mismo nombre y tipo (validado al crear).\nRN-002: Una categoría con transacciones asociadas no se puede eliminar; solo desactivar.\n"
               "RN-003: El nombre es obligatorio y no puede quedar vacío.",
               f"{G1}: prioridad Baja, se ajusta la matriz. Evidencia CategoryController.js:57-138."),
    },
    "RF-043": {
        "rn": ("RN-001: No pueden existir dos categorías con el mismo nombre y tipo (validado al crear).\nRN-002: Una categoría con transacciones asociadas no se puede eliminar; solo desactivar.\nRN-003: El nombre es obligatorio.",
               f"{G1}: prioridad Baja, se ajusta la matriz. Evidencia CategoryController.js:57-138."),
    },
    "RF-044": {"estado_v2": ("Reemplazado por RF-036", "Unificación de reportes solapados.")},
    "RF-045": {"estado_v2": ("Reemplazado por RF-048", "Unificación de RF-029/RF-045/RF-048 (registrar socios).")},
    "RF-046": {"estado_v2": ("Reemplazado por RF-036", "Unificación de reportes solapados (misma RI y RN que RF-033).")},
    "RF-047": {
        "rn": ("RN-001: Solo los administradores visualizan los socios.\nRN-002: La edición se rige por RF-051.\nRN-003: Búsqueda por nombre, correo o documento.\n"
               "RN-004: El perfil del socio se ve en su formulario.\nRN-005: La información se consulta en cada carga.",
               f"Se ajusta la matriz ({BR}: RF-047). Evidencia Membercontroller.js:16-49."),
    },
    "RF-048": {
        "ri": ("Nombre completo, documento de identidad (único), tipo de documento, fecha de nacimiento, fecha de ingreso, datos de contacto, tipo de membresía y nivel de aprendizaje.",
               "Unificación de RF-029/RF-045/RF-048. Evidencia Membercontroller.js:54-105."),
        "rn": ("RN-001: Son obligatorios el nombre completo, el documento de identidad, la fecha de ingreso y la fecha de nacimiento.\nRN-002: El documento de identidad debe ser único.\n"
               "RN-003: No se permiten campos obligatorios vacíos.\nRN-004: El socio no tiene rol en el aplicativo; se clasifica por tipo de membresía y nivel de aprendizaje.",
               f"{G1}: RF-048 va a código (fecha de nacimiento obligatoria, tarea T3-04); RN-004 viene de RF-045."),
    },
    "RF-049": {
        "rn": ("RN-001: Solo los administradores consultan socios.\nRN-002: La edición se rige por RF-051.\nRN-003: Búsqueda por nombre, correo o documento.\nRN-004: El perfil del socio se ve en su formulario.",
               f"Se ajusta la matriz ({BR}: RF-049)."),
    },
    "RF-050": {
        "ri": ("Tipo de documento, archivo (PDF, JPG o PNG de hasta 5 MB) y observaciones.",
               "La RI de la fuente describía la identificación del socio. Evidencia backend/controllers/SocioDocumentoController.js (entrega/rf-faltantes)."),
    },
    "RF-051": {
        "rn": ("RN-001: Solo los administradores pueden editar socios.\nRN-002: El documento no puede repetirse.\nMejora futura: registrar los cambios realizados.",
               f"{G1}: RN-003 se retira por no estar definida; auditoría como mejora futura. Evidencia Membercontroller.js:110-174."),
    },
    "RF-052": {
        "rn": ("RN-001: Solo los administradores pueden eliminar socios.\nRN-002: La eliminación es física; la base de datos la impide cuando el socio tiene registros asociados (facturas, cartera o pagos).\n"
               "RN-003: El sistema pide confirmación antes de eliminar.",
               f"{G1}: la RN dice lo que hace el sistema. Evidencia Membercontroller.js:179-193; AdminMembers.tsx:403-408."),
    },
    "RF-053": {
        "descripcion": ("El sistema permitirá registrar la mensualidad de un socio para un periodo.", f"{G1}: se redacta como 'registrar'."),
        "ri": ("Socio, periodo (mes y año), valor y fecha de vencimiento.", f"{G1}. Evidencia PagoMensualController.js:83-119."),
        "rn": ("RN-001: La mensualidad se registra para un socio y un periodo existentes.\nRN-002: No se permite registrar dos mensualidades del mismo socio en el mismo periodo.\nRN-003: El valor debe ser mayor a cero.",
               f"{G1}. Evidencia PagoMensualController.js:83-119; trigger trigger_prevenir_pago_duplicado."),
    },
    "RF-055": {
        "descripcion": ("El sistema permitirá gestionar la facturación (registrar, consultar, editar sin pagos, anular y registrar pagos).", "Unificación de RF-055/RF-058."),
        "ri": ("Socio asociado o proveedor escrito como texto, detalle de la factura (producto o servicio, cantidad, valor unitario, descuento % e IVA %) y pagos asociados.",
               "Decisión D7 y evidencia backend/controllers/FacturaController.js (entrega/rf-faltantes)."),
        "rn": ("RN-001: Toda factura se asocia a un socio existente o a un proveedor escrito como texto (uno de los dos).\nRN-002: Una factura debe tener al menos un detalle.\n"
               "RN-003: El total se calcula de los detalles: cantidad × valor unitario × (1 − descuento %) × (1 + IVA %).\nRN-004: Una factura puede tener uno o varios pagos.\n"
               "RN-005: No se permiten pagos por un valor superior al saldo.\nRN-006: Una factura queda pagada cuando los pagos cubren su total.\nRN-007: Solo se editan o anulan facturas emitidas sin pagos.",
               "Unificación de RF-055/RF-058; RF-058 deja de exigir proveedor existente (D7). Evidencia FacturaController.js."),
    },
    "RF-057": {
        "rn": ("RN-001: El historial se muestra ordenado cronológicamente.\nRN-002: Solo se consultan pagos de socios existentes.\n"
               "RN-003: La vista del socio es de solo lectura; en la del administrador el cambio de estado se rige por RF-054.",
               f"Se ajusta la matriz ({BR}: RF-057)."),
    },
    "RF-058": {
        "rn": ("RN-001: Toda factura se asocia a un socio existente o a un proveedor escrito como texto.\n(Las demás reglas están en RF-055.)",
               "Decisión D7: deja de exigir proveedor existente."),
        "estado_v2": ("Reemplazado por RF-055", "Unificación de RF-055/RF-058."),
    },
    "RF-059": {
        "ri": ("Proveedor (texto libre, opcional), concepto, fecha, número de factura, categoría y estado de la compra.", "Decisión D7 (PLAN §9.4)."),
        "rn": ("RN-001: El proveedor es un texto libre opcional.\nRN-002: La compra se registra en estado pendiente.\nRN-003: Solo un administrador puede aprobar una compra; no existe el rechazo (una compra pendiente se puede eliminar).\n"
               "RN-004: No se registra el detalle de una compra que no esté aprobada.\nRN-005: Una compra aprobada no se puede editar ni eliminar.",
               "Decisión D7 y evidencia backend/controllers/CompraController.js:68-216."),
    },
    "RF-060": {
        "ri": ("Concepto, cantidad y valor unitario de cada línea.", f"{G1}: prioridad Baja, se ajusta la matriz. Evidencia CompraController.js:179-216."),
        "rn": ("RN-001: Cada línea se asocia a una compra existente y aprobada.\nRN-002: La línea incluye concepto, cantidad y valor unitario.\n"
               "RN-003: Si la cantidad no es un número o es 0, se registra 1; las cantidades negativas no se validan (limitación conocida de v1.0).\nRN-004: El valor total de la línea se calcula automáticamente.",
               f"{G1}: prioridad Baja; la matriz describe lo que hace el sistema."),
    },
    "RF-061": {
        "ri": ("El sistema muestra el nombre del socio (no solo su ID) en los listados y formularios de pedidos de indumentaria.",
               "La RI estaba corrida una fila: era la de RF-063 en la fuente."),
        "rn": ("RN-075: El sistema no restringe el pedido por estado del socio (limitación conocida de v1.0).\nRN-076: El campo socio es obligatorio para registrar el pedido.\n"
               "RN-077: El socio debe existir en la tabla de socios.",
               f"{G1}: prioridad Baja, se ajusta la matriz. Evidencia JerseyController.js:275-278."),
    },
    "RF-062": {
        "ri": ("Por cada pedido de indumentaria: socio, fecha, tipo de prenda, talla, estampado, valor, estado y observaciones.",
               "La RI estaba corrida una fila: era la de RF-061 en la fuente."),
    },
    "RF-063": {
        "ri": ("Por cada unidad de inventario generada: el pedido al que pertenece, su número de ítem, estado de entrega y fecha de entrega.",
               "La RI estaba corrida una fila: era la de RF-062 en la fuente."),
        "rn": ("RN-081: Se genera exactamente una unidad de inventario por cada unidad de la cantidad del pedido.\nRN-082: Cada unidad inicia en 'Pendiente', salvo que el pedido se registre ya 'Entregado'.\n"
               "RN-083: La numeración de las unidades es consecutiva dentro del pedido, desde 1.",
               "Evidencia trigger trg_pedido_jersey_unidades / fn_sync_unidades_jersey."),
    },
    "RF-064": {
        "descripcion": ("Mostrar la cantidad solicitada de cada pedido y el estado de entrega de cada unidad.", f"{G1}: prioridad Baja, se ajusta la matriz."),
        "ri": ("Cantidad del pedido y estado de entrega (Pendiente, Entregado o Devuelto) de cada unidad de inventario.",
               "Evidencia backend/controllers/InventarioController.js:178-193; AdminInventario.tsx:331."),
        "rn": ("RN-084: La cantidad del pedido es el número de unidades generadas.\nRN-085: Cada unidad muestra su estado de entrega.\n"
               "RN-086: Al marcar el pedido 'Entregado', todas sus unidades pasan a 'Entregado'; al cancelarlo, pasan a 'Devuelto'.",
               f"{G1}. Evidencia fn_sync_unidades_jersey."),
    },
    "RF-065": {
        "ri": ("Si no hay categorías de gasto registradas, el sistema muestra una alerta indicando que las transacciones de egreso no podrán clasificarse.",
               f"{G1}: prioridad Baja, se ajusta la matriz. Evidencia AdminCategories.tsx:109, :227-230."),
    },
    "RF-068": {
        "ri": ("El formulario muestra los datos actuales de la categoría y exige el nombre; la unicidad nombre + tipo no se valida al editar.",
               f"{G1}: prioridad Baja, se ajusta la matriz. Evidencia CategoryController.js:90-118; AdminCategories.tsx:113-114, :194."),
    },
    "RF-069": {"estado_v2": ("Retirado (D7)", "Decisión D7 (PLAN §9.4): se elimina la tabla proveedores y su gestión.")},
    "RF-070": {
        "proceso_fila": ("Compras", "Decisión D7: el proceso Proveedores se retira; RF-070 pasa al proceso Compras."),
        "subproceso_fila": ("Gestión de compras", "Decisión D7."),
        "rn": ("RN-001: El proveedor es un texto libre opcional.\nRN-002: La compra se registra en estado pendiente.\nRN-003: Solo un administrador puede aprobar una compra.\n"
               "RN-004: No se registra el detalle de una compra que no esté aprobada.\nRN-005: Una compra aprobada no se puede modificar.",
               "Instrucción de G1: RN-001 pasa a 'el proveedor es un texto libre opcional' (D7)."),
        "ri": ("Proveedor (texto libre, opcional), estado de la compra y datos generales de la compra.", "Decisión D7."),
    },
    "RF-072": {"estado_v2": ("Fuera de alcance v1.0",
                             f"{G1}: el stock se ajusta a mano (RF-074) y movimiento_inventario no tiene lógica en la aplicación; automatizar entradas y salidas queda para una versión posterior.")},
    "RF-073": {
        "rn": ("RN-001: El sistema muestra el inventario actualizado en cada consulta.\nRN-002: Solo los administradores pueden modificar el inventario.\nRN-003: La edición se rige por RF-074.",
               f"Se ajusta la matriz ({BR}: RF-073)."),
    },
    "RF-075": {
        "rn": ("RN1: Solo el administrador puede eliminar productos.\nRN2: No se puede eliminar un producto con compras o movimientos registrados (restricción de la base de datos).\nMejora futura: registrar la eliminación en auditoría.",
               f"{G1}: auditoría como mejora futura. Evidencia InventarioController.js:123-140."),
    },
    "RF-077": {
        "descripcion": ("El sistema permitirá registrar cuentas por cobrar (cartera) de los socios.", f"El sistema solo tiene socios, no clientes ({BR}: RF-077)."),
        "ri": ("Socio asociado, concepto, valor, fecha y tipo de cartera (opcional).", "Evidencia CarteraController.js:68-102 (entrega/rf-faltantes)."),
        "rn": ("RN1: Toda cuenta por cobrar se asocia a un socio existente.\nRN2: El registro incluye concepto y valor.\nRN3: El valor debe ser mayor a cero.", f"Cambio de 'cliente' a 'socio' ({BR})."),
    },
    "RF-078": {
        "descripcion": ("El sistema permitirá consultar la cartera de los socios.", f"Cambio de 'clientes' a 'socios' ({BR}: RF-078)."),
        "ri": ("Estado de la cartera (pendiente, pagado o anulado) y socio asociado.", f"Cambio de 'cliente' a 'socio' ({BR})."),
    },
    "RF-079": {
        "rn": ("RN1: Solo los administradores pueden editar la cartera.\nRN2: No se puede cambiar el socio asociado.\nRN3: No se puede editar un registro anulado.\n"
               "RN4: Desde la pantalla solo se registra el pago; la edición de concepto, valor y estado está disponible en la API.",
               f"{G1}: prioridad Baja, se ajusta la matriz. Evidencia CarteraController.js:104-178; AdminCartera.tsx."),
    },
    "RF-080": {
        "rn": ("RN1: Solo el administrador puede eliminar registros de cartera.\nRN2: Solo se eliminan cuentas en estado pagado.\nMejora futura: registrar la eliminación en auditoría.",
               f"{G1}: auditoría como mejora futura. Evidencia CarteraController.js:180-205."),
    },
    "RF-082": {
        "ri": ("Socio, fecha, tipo de entrenamiento, estado de asistencia (Presente, Ausente, Justificado o Tarde) y observación.", "Evidencia AsistenciaController.js:68-98; CHECK asistencia_estado_check."),
        "rn": ("RN-001: Se registra una asistencia por socio y fecha, con su tipo de entrenamiento.\nRN-002: Estados permitidos: Presente, Ausente, Justificado y Tarde.\n"
               "RN-003: El socio es obligatorio.\nRN-004: El formulario solo ofrece socios activos.",
               f"{G1}: RN-005 se retira por no estar definida; las RN de la fuente eran solo títulos. Evidencia UNIQUE asistencia (id_socio, fecha); AdminAsistencia.tsx:229."),
    },
    "RF-083": {
        "rn": ("RN-001: Consulta de la asistencia de un socio.\nRN-002: Consulta general de asistencia.\nRN-003: Filtros por socio, estado y rango de fechas.\n"
               "RN-004: Solo los administradores acceden.\nRN-005: La edición y el borrado se rigen por RF-085 y RF-086.",
               "Las RN de la fuente eran solo títulos. Evidencia AsistenciaController.js:11-49."),
    },
    "RF-084": {
        "rn": ("RN-001: Alerta cuando el socio acumula 5 o más ausencias en los últimos 30 días.\nRN-002: Alerta cuando el socio tiene 3 o más ausencias consecutivas en ese periodo.\n"
               "RN-003: Los umbrales y la ventana de días se pueden ajustar como parámetros de la consulta (sin pantalla en v1.0).\nRN-004: Las alertas se muestran en la pantalla de Asistencia.",
               "Las RN de la fuente eran solo títulos; RN-005 se retira por no estar definida. Evidencia AsistenciaController.js:222-279; AdminAsistencia.tsx:273-282."),
    },
    "RF-085": {
        "rn": ("RN-001: Se editan el tipo de entrenamiento, el estado y la observación.\nRN-002: Estados permitidos: Presente, Ausente, Justificado y Tarde.\nRN-003: Solo los administradores editan.",
               "Las RN de la fuente eran copia de RF-082. Evidencia AsistenciaController.js:100-132."),
    },
    "RF-086": {
        "rn": ("RN1: Solo el administrador puede eliminar registros.\nRN2: El sistema pide confirmación antes de eliminar.\nMejora futura: registrar la eliminación en auditoría.",
               f"{G1}: auditoría como mejora futura; RN3 se retira porque las alertas se calculan en vivo y no se guardan. Evidencia AsistenciaController.js:134-151."),
    },
    "RF-087": {
        "rn": ("RN1: Solo los administradores pueden exportar el reporte.\nRN2: El reporte se filtra por rango de fechas y socio; la hoja no indica el periodo consultado (limitación conocida de v1.0).\n"
               "RN3: Se exportan los registros del rango elegido; el filtro por estado de la pantalla no se aplica al archivo.",
               f"{G1}: prioridad Baja, se ajusta la matriz. Evidencia AsistenciaController.js:282-342."),
    },
}

PENDIENTE = {"RF-011": "Pendiente decisión de Samuel"}

NOMBRES_PROCESO = {
    "Administrador": "Administrador", "Configuracion del sistema": "Configuración del sistema", "Usuario": "Usuario",
    "Financiera": "Financiera", "Socios": "Socios", "Pagos": "Pagos", "compras": "Compras", "Jersey": "Jersey",
    "Categoria": "Categorías", "Proveedores": "Proveedores", "inventario": "Inventario", "Cartera": "Cartera", "Asistencia": "Asistencia",
}
NOMBRES_SUBPROCESO = {
    "Inicio De Sesion": "Inicio de sesión", "Gestion de Administrador": "Gestión de administradores",
    "Visualizacion del Sistema": "Visualización del sistema", "Datos del club": "Datos del club",
    "Gestion de Usuario": "Gestión de usuarios", "Gestion Financiera": "Gestión financiera",
    "Gestion de socios": "Gestión de socios", "Gestion de pagos": "Gestión de pagos", "Gestion de compras": "Gestión de compras",
    "Gestion de jersey": "Gestión de jersey", "Gestion de categorias": "Gestión de categorías",
    "Administración de proveedores": "Administración de proveedores", "Gestion de inventario": "Gestión de inventario",
    "Gestion de cartera": "Gestión de cartera", "Gestion de Asistencia": "Gestión de asistencia",
}

# ─── RF nuevos ────────────────────────────────────────────────────────────────
LC = "backend/controllers/LandingController.js"
NUEVOS = [
    # (rf, proceso, subproceso, descripcion, ri, rn, motivo)
    ("RF-088", "Landing page", "Gestión de la landing",
     "El sistema permitirá ver el estado de la landing: borrador, versión publicada y si hay cambios sin publicar.",
     "Borrador, versión publicada y diferencia entre ambos.",
     "RN-088.1: Solo los administradores acceden al editor de la landing.\nRN-088.2: El sistema indica si el borrador tiene cambios sin publicar.",
     f"Decisión D6. Evidencia {LC}:181; backend/routes/landingAdmin.js:7; LandingPanel.tsx:259."),
    ("RF-089", "Landing page", "Gestión de la landing",
     "El sistema permitirá editar el título y el texto de cada sección de la landing.",
     "Título y texto de las secciones Portada, Cifras, El club, Escuela, Sedes, Entrenadores, Galería y Contacto.",
     "RN-089.1: El título es obligatorio y admite hasta 100 caracteres.\nRN-089.2: El texto admite hasta 2000 caracteres.\n"
     "RN-089.3: Se guarda como texto plano: se quitan etiquetas HTML y scripts.\nRN-089.4: Deben venir las 8 secciones, cada una una sola vez.",
     f"Decisión D6. Evidencia {LC}:7-17, :24-35, :57-75; backend/tests/landing.test.js:90, :98."),
    ("RF-090", "Landing page", "Gestión de la landing",
     "El sistema permitirá administrar la biblioteca de imágenes de la landing.",
     "Archivo de imagen y texto alternativo.",
     "RN-090.1: Solo se aceptan imágenes JPG, PNG o WEBP de hasta 2 MB, validadas por su contenido.\nRN-090.2: El texto alternativo es obligatorio y admite hasta 150 caracteres.\n"
     "RN-090.3: Cada sección admite hasta 12 imágenes.\nRN-090.4: No se elimina una imagen asignada en el borrador o usada en la versión publicada.",
     f"Decisión D6. Evidencia {LC}:14-18, :253-316, :330-357."),
    ("RF-091", "Landing page", "Gestión de la landing",
     "El sistema permitirá editar los datos de contacto y las redes sociales de la landing.",
     "Correo, teléfono, dirección y redes sociales (nombre, enlace y etiqueta).",
     "RN-091.1: El correo debe tener un formato válido (hasta 100 caracteres).\nRN-091.2: El teléfono solo admite números, espacios y el signo + (hasta 30 caracteres).\n"
     "RN-091.3: La dirección admite hasta 200 caracteres.\nRN-091.4: Se admiten hasta 10 redes; el nombre hasta 50 caracteres y el enlace debe iniciar con https:// (hasta 300).",
     f"Decisión D6. Evidencia {LC}:19-20, :88-108; LandingPanel.tsx:410."),
    ("RF-092", "Landing page", "Gestión de la landing",
     "El sistema permitirá cambiar la visibilidad y el orden de las secciones de la landing.",
     "Visibilidad de cada sección y posición en la lista.",
     "RN-092.1: Debe quedar al menos una sección visible.\nRN-092.2: La sección Contacto no se puede ocultar.\nRN-092.3: El orden se cambia subiendo o bajando cada sección.",
     f"Decisión D6. Evidencia {LC}:78-85; LandingPanel.tsx:165, :343."),
    ("RF-093", "Landing page", "Gestión de la landing",
     "El sistema permitirá ver una vista previa del borrador antes de publicarlo.",
     "Contenido del borrador y tamaño de pantalla (escritorio, tableta, móvil).",
     "RN-093.1: La vista previa usa el borrador sin publicarlo.\nRN-093.2: Las imágenes del borrador se cargan con la sesión del administrador.",
     f"Decisión D6. Evidencia LandingPanel.tsx:5, :562; {LC}:319-328."),
    ("RF-094", "Landing page", "Gestión de la landing",
     "El sistema permitirá publicar el borrador como una versión nueva de la landing.",
     "Borrador vigente.",
     "RN-094.1: El borrador debe ser válido y todas sus imágenes deben existir.\nRN-094.2: Si el borrador es igual a la versión publicada, no se publica.\n"
     "RN-094.3: Cada publicación crea una versión con número consecutivo y queda registrada en auditoría.",
     f"Decisión D6. Evidencia {LC}:359-397."),
    ("RF-095", "Landing page", "Gestión de la landing",
     "El sistema permitirá consultar el historial de versiones y restaurar una versión como borrador.",
     "Número de versión, fecha y usuario que la publicó.",
     "RN-095.1: Se conservan todas las versiones publicadas.\nRN-095.2: Restaurar carga la versión como borrador; no la publica.",
     f"Decisión D6. Evidencia {LC}:399-444; LandingPanel.tsx:525; backend/tests/landing.test.js:214."),
    ("RF-096", "Landing page", "Gestión de la landing",
     "NO VERIFICADO: el código solo cita el rango 'RF-088 a RF-096' y no hay descripción propia de RF-096.",
     "NO VERIFICADO",
     "NO VERIFICADO. Candidato por descarte: auditoría de los cambios de la landing (backend/tests/landing.test.js:225), ya cubierta por RF-100.",
     "Decisión D6; RF-096 queda NO VERIFICADO por falta de evidencia (instrucción de G1)."),
    ("RF-097", "Landing page", "Landing pública",
     "El sistema mostrará la landing pública con la versión publicada.",
     "Versión publicada de la landing.",
     "RN-097.1: La landing pública no requiere sesión.\nRN-097.2: Muestra solo la versión publicada; si no hay ninguna, muestra el contenido por defecto.",
     f"Decisión D6. Evidencia backend/routes/landing.js:5-7; {LC}:446; frontend/src/features/landing/pages/Home.tsx:65."),
    ("RF-098", "Portal del socio", "Resumen del socio",
     "El sistema permitirá al socio ver el resumen de su cuenta.",
     "Datos del socio, mensualidades pendientes o morosas (cantidad y total) y saldo pendiente de cartera.",
     "RN-098.1: Requiere sesión.\nRN-098.2: La cuenta debe estar vinculada a una ficha de socio; si no lo está, el sistema lo avisa.\n"
     "RN-098.3: Se cuentan como pendientes las mensualidades en estado pendiente o moroso.",
     "Módulo sin RF (instrucción de G1). Evidencia backend/routes/portal.js:7-9; PortalController.js getResumen; frontend/src/pages/portal/PortalOverview.tsx."),
    ("RF-099", "Pagos en línea", "Pago con PayPal",
     "El sistema permitirá al socio pagar en línea con PayPal.",
     "Concepto a pagar (mensualidad, inscripción o uniforme).",
     "RN-099.1: El monto lo fija el servidor según el concepto; el cliente no lo envía.\nRN-099.2: La cuenta debe estar vinculada a una ficha de socio.\n"
     "RN-099.3: Solo un pago aprobado genera la transacción de ingreso, y una sola vez.\nRN-099.4: Los avisos (webhook) de PayPal se aceptan solo con la firma verificada.",
     "Módulo sin RF. Evidencia backend/routes/pagos.js:9-14; backend/controllers/PagoController.js:8-23, :43-142, :195-260, webhook (firma)."),
    ("RF-100", "Auditoría", "Registro de auditoría",
     "El sistema registrará en auditoría las acciones sobre la landing.",
     "Usuario, acción, detalle y fecha.",
     "RN-100.1: Se registran guardar el borrador, subir y eliminar imágenes, publicar y restaurar versiones de la landing.\n"
     "RN-100.2: Las demás operaciones (usuarios, transacciones, socios, inventario, cartera, asistencia) quedan como mejora futura.",
     f"{G1}: las RN dicen lo que se audita hoy. Evidencia {LC}:147 (auditar) y sus llamadas; backend/tests/landing.test.js:225."),
    ("RF-101", "Alertas", "Notificaciones",
     "El sistema mantendrá actualizada la campana de notificaciones del administrador.",
     "Mensualidades pendientes y morosas.",
     "RN-101.1: La campana se actualiza al registrar cambios en mensualidades, cartera, transacciones o periodos, al volver a la pestaña y cada 60 segundos.\n"
     "RN-101.2: Primero se muestran las alertas de pagos vencidos.",
     "Módulo sin RF. Evidencia frontend/src/hooks/useAlerts.ts:76-79, :115-120."),
    ("RF-102", "Vínculo usuario-socio", "Gestión del vínculo",
     "El sistema permitirá vincular y desvincular una cuenta de usuario con la ficha de un socio.",
     "Socio y cuenta de usuario.",
     "RN-102.1: Solo se vinculan cuentas con rol Usuario y perfil de socio.\nRN-102.2: Un socio solo puede estar vinculado a una cuenta.\nRN-102.3: Solo los administradores gestionan el vínculo.",
     "Módulo sin RF. Evidencia backend/routes/Member.js:15-16; Membercontroller.js:201-250."),
    ("RF-103", "Periodos mensuales", "Gestión de periodos",
     "El sistema permitirá registrar, editar y eliminar los periodos mensuales.",
     "Año, mes, nombre del mes, fecha de inicio y fecha de fin.",
     "RN-103.1: Año, mes (1 a 12), nombre del mes y fechas válidas son obligatorios.\nRN-103.2: No se edita ni se elimina un periodo cerrado.\n"
     "RN-103.3: No se elimina un periodo con mensualidades asociadas.",
     "Módulo sin RF. Evidencia backend/routes/periodos.js:6-12; backend/controllers/PeriodoController.js:49-140."),
    ("RF-104", "Campañas de jersey", "Gestión de campañas",
     "El sistema permitirá crear, editar y cerrar campañas de jersey.",
     "Título, valor, tallas disponibles, fecha de fin y estado activo.",
     "RN-104.1: El título es obligatorio.\nRN-104.2: El valor debe ser mayor a cero.\nRN-104.3: Debe indicarse al menos una talla.\nRN-104.4: Los pedidos del portal solo se aceptan en campañas activas.",
     "Módulo sin RF. Evidencia backend/routes/jersey.js:9-11; JerseyController.js:97-207, :434-499."),
]

RNF_CAMBIOS = {
    "RNF-003": ("El sistema usará el verde del club (#10b981) de forma consistente en el panel. La coincidencia con el manual de marca está NO VERIFICADO.",
                f"Se ajusta la matriz ({BR}: RNF-003); el PDF del manual de marca no se comparó."),
    "RNF-004": ("El sistema ofrecerá filtros en las consultas: transacciones (tipo, texto y rango de fechas), facturas (estado y texto), cartera (estado y texto) y asistencia (socio, estado y fechas). Reportes y balances no tienen filtros en v1.0.",
                f"{G1}: RNF sin medición reescrito como lista comprobable."),
    "RNF-005": ("GET /api/admin/overview y la generación del PDF del reporte financiero responderán en 5 segundos o menos con los datos de producción, medido en la regresión de F4. Resultado: NO VERIFICADO hasta medir.",
                f"{G1}: RNF sin medición reescrito con una medida comprobable."),
    "RNF-006": ("El backend responderá a GET /api/landing en cualquier hora del día, comprobado con un monitor externo. NO VERIFICADO: falta confirmar el plan de Render y si el servicio se suspende por inactividad.",
                f"{G1}: RNF sin medición reescrito; sin evidencia queda NO VERIFICADO."),
    "RNF-007": ("El sistema registrará los intentos fallidos de inicio de sesión en logs/security.log y los errores en el log del servidor. La auditoría de operaciones críticas (como la creación de facturas) queda como mejora futura.",
                f"{G1}: prioridad Baja, se ajusta la matriz. Evidencia backend/utils/helpers.js:14-20."),
    "RNF-008": ("Toda respuesta de error de la API devolverá un código HTTP 4xx o 5xx y un JSON con success: false y un mensaje. Las restricciones de la base de datos que hoy responden 500 genérico quedan anotadas como limitación.",
                f"{G1}: RNF sin medición reescrito con una forma comprobable."),
    "RNF-009": ("Los errores del servidor quedarán registrados en los logs del proceso (manejador global de errores). La notificación activa a los administradores queda fuera de alcance de v1.0.",
                f"{G1}: se ajusta a lo que hace el sistema. Evidencia entrega/t3-codigo:backend/server.js:147-161."),
    "RNF-010": ("El sistema cifrará las contraseñas con bcrypt (factor de costo de al menos 10) y nunca las guardará en texto plano.",
                f"{G1}: se redacta con el algoritmo real. Evidencia users.js:121 (10), AuthController y PortalController (12)."),
}
RNF_NUEVOS = [
    ("RNF-011", "Si la API de la landing falla, la página pública mostrará el contenido por defecto en vez de quedar en blanco.", "Disponibilidad",
     "Decisión D6. Evidencia frontend/src/services/landingService.ts:24."),
    ("RNF-012", "Las imágenes de la landing solo podrán ser JPG, PNG o WEBP de hasta 2 MB, validadas por su contenido.", "Seguridad",
     f"Decisión D6. Evidencia {LC}:277-291; backend/routes/landingAdmin.js:10, :24-29."),
]
COLOR_NUEVOS = {"Landing page": "FFB4C6E7", "Portal del socio": "FFC6E0B4", "Pagos en línea": "FFFFE699", "Auditoría": "FFD9D9D9",
                "Alertas": "FFF8CBAD", "Vínculo usuario-socio": "FFDDEBF7", "Periodos mensuales": "FFE2EFDA", "Campañas de jersey": "FFFFF2CC"}


def registrar(rf, campo, antes, despues, motivo):
    if (antes or "") != (despues or ""):
        cambios.append((rf, campo, antes, despues, motivo))


def main():
    wb = openpyxl.load_workbook(FUENTE)
    ws = wb["RF"]
    wb["RF"]["A2"] = "Versión 2 (2026-11-06). Cambios en docs/matriz/CAMBIOS_MATRIZ.md"
    registrar("(hoja RF)", "A2", None, ws["A2"].value, "Identificación de la versión.")

    filas = {}
    for r in range(10, 97):
        rf = norm_id(ws.cell(r, COL["rf"]).value)
        if rf:
            filas[rf] = r
    assert len(filas) == 87, len(filas)

    # Encabezado de la columna J
    ws.cell(9, COL["estado_v2"]).value = "Estado en v2"
    ws.cell(9, COL["estado_v2"])._style = copy(ws.cell(9, COL["rn"])._style)
    ws.column_dimensions["J"].width = 24
    registrar("(hoja RF)", "J9", None, "Estado en v2", "Columna nueva para marcar vigente, reemplazado, retirado o fuera de alcance sin renumerar.")

    # Celdas sueltas: 'X' en J y '51/66' en L
    for rf, r in filas.items():
        for c in (10, 11, 12):
            v = ws.cell(r, c).value
            if v not in (None, ""):
                registrar(rf, f"columna {openpyxl.utils.get_column_letter(c)}", str(v), None, "Celda suelta sin significado (anomalía PLAN §1.1).")
                ws.cell(r, c).value = None

    # Nombres de proceso y subproceso (celdas combinadas: se escribe la esquina)
    for m in ws.merged_cells.ranges:
        if m.min_row < 10 or m.min_row > 96 or m.min_col not in (1, 2):
            continue
        celda = ws.cell(m.min_row, m.min_col)
        actual = (celda.value or "").strip()
        tabla = NOMBRES_PROCESO if m.min_col == 1 else NOMBRES_SUBPROCESO
        nuevo = tabla.get(actual, actual)
        rf_ref = norm_id(ws.cell(m.min_row, 3).value)
        if celda.value != nuevo:
            registrar(f"{rf_ref} (bloque {m.coord})", "proceso" if m.min_col == 1 else "subproceso", celda.value, nuevo, "Normalización de nombres (anomalía PLAN §1.1).")
            celda.value = nuevo

    # Cambios por RF
    for rf, campos in RF.items():
        r = filas[rf]
        for campo, (valor, motivo) in campos.items():
            if campo in ("proceso_fila", "subproceso_fila"):
                c = COL["proceso"] if campo == "proceso_fila" else COL["subproceso"]
                bloque = next(m for m in ws.merged_cells.ranges if m.min_col == c and m.min_row <= r <= m.max_row)
                celda = ws.cell(bloque.min_row, c)
                registrar(rf, campo.replace("_fila", ""), celda.value, valor, motivo)
                celda.value = valor
                continue
            celda = ws.cell(r, COL[campo])
            registrar(rf, campo, celda.value, valor, motivo)
            celda.value = valor

    # Estado en v2 de todas las filas existentes
    tocados = {rf for rf, campos in RF.items() if set(campos) - {"estado_v2"}}
    for rf, r in filas.items():
        if "estado_v2" in RF.get(rf, {}):
            continue
        estado = PENDIENTE.get(rf) or ("Vigente (modificado)" if rf in tocados else "Vigente")
        ws.cell(r, COL["estado_v2"]).value = estado
        if rf in PENDIENTE:
            registrar(rf, "estado_v2", None, estado, "PENDIENTE_SAMUEL en brechas.csv: no se modifica hasta su decisión.")
    for rf, r in filas.items():
        ws.cell(r, COL["estado_v2"])._style = copy(ws.cell(r, COL["prioridad"])._style)

    # RF-001 se queda en "Inicio de sesión": los planes 01 y 02 lo ubican ahí
    registrar("RF-001", "subproceso", "Inicio de sesión", "Inicio de sesión (sin mover)",
              "No se mueve: docs/fuentes/planes/01 y 02 lo ubican en el subproceso Inicio de sesión (el 02 lo excluye por eso); moverlo rompería esas referencias.")

    # Filas nuevas: se quitan las combinaciones vacías que había bajo la tabla
    for m in [m for m in ws.merged_cells.ranges if m.min_row >= 97]:
        ws.unmerge_cells(m.coord)
    plantilla = 10
    inicio = 97
    for i, (rf, proceso, sub, desc, ri, rn, motivo) in enumerate(NUEVOS):
        r = inicio + i
        valores = [proceso, sub, f"RF - {rf[3:]}", desc, "Por definir", f"RI-{rf[3:]}", ri, f"RN-{rf[3:]}", rn, "Nuevo en v2"]
        for c, v in enumerate(valores, start=1):
            celda = ws.cell(r, c)
            celda._style = copy(ws.cell(plantilla, c if c <= 9 else COL["prioridad"])._style)
            celda.fill = PatternFill("solid", fgColor=COLOR_NUEVOS[proceso])
            celda.value = v
        ws.row_dimensions[r].height = 75
        registrar(rf, "fila nueva", None, f"{proceso} / {sub}: {desc}", motivo)
    fin = inicio + len(NUEVOS) - 1
    # Combina en A y B las filas consecutivas con el mismo proceso o subproceso,
    # igual que los bloques de la v1.
    for c in (1, 2):
        valores = [ws.cell(r, c).value for r in range(inicio, fin + 1)]
        s = 0
        while s < len(valores):
            e = s
            while e + 1 < len(valores) and valores[e + 1] == valores[s]:
                e += 1
            if e > s:
                for k in range(s + 1, e + 1):
                    ws.cell(inicio + k, c).value = None
                ws.merge_cells(start_row=inicio + s, start_column=c, end_row=inicio + e, end_column=c)
            s = e + 1

    # Hoja RNF
    rnf = wb["RNF"]
    filas_rnf = {str(rnf.cell(r, 1).value).strip(): r for r in range(6, 16) if rnf.cell(r, 1).value}
    for rid, (texto, motivo) in RNF_CAMBIOS.items():
        celda = rnf.cell(filas_rnf[rid], 2)
        registrar(rid, "descripcion", celda.value, texto, motivo)
        celda.value = texto
    for i, (rid, texto, atributo, motivo) in enumerate(RNF_NUEVOS):
        r = 16 + i
        for c in (1, 2, 3):
            rnf.cell(r, c)._style = copy(rnf.cell(15, c)._style)
        rnf.cell(r, 1).value, rnf.cell(r, 2).value, rnf.cell(r, 3).value = rid, texto, atributo
        rnf.row_dimensions[r].height = rnf.row_dimensions[15].height
        registrar(rid, "fila nueva", None, texto, motivo)

    registrar("(hoja Trazabilidad)", "sin cambios", None, None, "")
    DESTINO.parent.mkdir(parents=True, exist_ok=True)
    wb.save(DESTINO)

    # CAMBIOS_MATRIZ.md
    def celda_md(v):
        return "—" if v in (None, "") else str(v).replace("|", "/").replace("\n", "<br>")
    lineas = [
        "# Cambios de la matriz v1 a la v2", "",
        "- **Fuente:** `docs/fuentes/matriz_requisitos.xlsx` (Drive, modificada el 2026-11-03).",
        "- **Resultado:** `docs/matriz/matriz_v2.xlsx`. Se genera con `python scripts/genera_matriz_v2.py` y se comprueba con `python scripts/check_matriz.py`.",
        "- **Reglas:**",
        "  - ningún RF existente se renumera;",
        "  - los reemplazados, retirados o fuera de alcance conservan su número y se marcan en la columna nueva **J: Estado en v2**;",
        "  - los RF nuevos empiezan en RF-088.",
        "- **Hoja Trazabilidad:** sin cambios. Usa una numeración por proceso (`RF-1 001`, `CU-1 01`) cuya correspondencia con RF-001…087 no se verificó (NO VERIFICADO). Hay que actualizarla a mano o retirarla.", "",
        "| RF | Campo | Antes | Después | Motivo |", "|---|---|---|---|---|",
    ]
    for rf, campo, antes, despues, motivo in cambios:
        if rf == "(hoja Trazabilidad)":
            continue
        lineas.append(f"| {rf} | {campo} | {celda_md(antes)} | {celda_md(despues)} | {celda_md(motivo)} |")
    CAMBIOS_MD.write_text("\n".join(lineas) + "\n", encoding="utf-8")
    print(f"matriz v2: {DESTINO.relative_to(RAIZ)} · cambios registrados: {len(cambios) - 1}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
