-- Snapshot de respaldo previo a la consolidación de esquema (2026-08-16).
-- Generado con SELECT row_to_json(...) sobre las tablas con filas antes de
-- cualquier DROP/ALTER. Sirve solo como referencia manual si hiciera falta
-- reconstruir algo; no es una migración ejecutable.

-- ============ socio (3 filas) ============
INSERT INTO socio (id_socio, nombre, documento, tipo_documento, email, telefono, direccion, fecha_nacimiento, fecha_ingreso, tipo_membresia, estado, foto, observaciones, created_at, updated_at, created_by) VALUES
(1, 'samuel', '1034919818', 'CC', 'si@gmail.com', '3044840268', 'Calle 24 #50A-76', '2013-01-29', '2023-05-29', 'Completa', 'activo', NULL, 'no', '2026-06-26T08:50:52.213698', '2026-06-26T08:50:52.213698', 1),
(2, 'Samuelito ', '123132434324', 'CC', 'viviendofotoafoto@gmail.com', '31145556712', 'CALLE 100 A CR 76-60', '2026-08-12', '2026-08-13', 'Premium', 'activo', NULL, NULL, '2026-08-13T03:16:21.525824', '2026-08-13T03:16:21.525824', 1),
(3, 'ola', '1023594584', 'CC', 'juanito@gmail.com', '3145334554', 'CALLE 100 A CR 76-60', '2026-08-30', '2026-08-28', 'Básica', 'activo', NULL, '', '2026-08-13T04:02:40.141425', '2026-08-15T03:07:30.479666', 1);

-- ============ transactions (4 filas) ============
INSERT INTO transactions (id, tipo, monto, fecha, descripcion, created_at, categoria, metodo_pago, creado_por, categoria_id, referencia, created_by) VALUES
(1, 'ingreso', 120000, '2026-06-26', 'si', '2026-06-26T08:49:46.045228', 'Cuotas de Socios', 'transferencia', 'admin', NULL, NULL, NULL),
(2, 'ingreso', 100000, '2026-08-13', 'hola', '2026-08-13T03:48:09.355377', 'Cuotas de Socios', 'efectivo', 'Andresito', NULL, NULL, NULL),
(3, 'ingreso', 100000, '2026-08-13', 'si', '2026-08-13T04:11:12.421106', 'Cuotas de Socios', 'efectivo', 'admin', NULL, NULL, NULL),
(4, 'ingreso', 150000, '2026-08-14', 'ola', '2026-08-14T19:24:47.27382', 'Cuotas de Socios', 'efectivo', 'Andresito', NULL, NULL, NULL);

-- ============ users (4 filas) — password/reset_token OMITIDOS del respaldo por sensibilidad ============
-- id=1 admin (admin, activo)
-- id=2 Samuel (admin, activo)
-- id=4 Andresito (admin, activo)
-- id=5 Hectorito (user, activo)
-- Si hiciera falta reconstruir, los hashes de password NO se guardan aquí; habría que
-- forzar un reset de contraseña para estos usuarios en vez de restaurarlos a mano.

-- ============ periodos (2 filas, NO 1 como asumía el prompt original) ============
INSERT INTO periodos (id, anio, mes, nombremes, fechainicio, fechafin, activo, cerrado, fechacierre, observaciones, cerradoby, created_at, nombre_mes, fecha_inicio, fecha_fin, fecha_cierre, total_ingresos, total_gastos, balance, cerrado_by) VALUES
(1, 2026, 6, NULL, NULL, NULL, false, true, NULL, 'Cierre manual desde panel de reportes', NULL, '2026-06-26T08:52:45.443343', 'junio', '2026-06-01', '2026-06-30', '2026-07-01T00:45:28.112665', 120000, 0, 120000, 'admin'),
(3, 2026, 8, NULL, NULL, NULL, false, true, NULL, 'Cierre manual desde panel de reportes', NULL, '2026-08-15T00:57:39.83369', 'agosto', '2026-08-01', '2026-08-31', '2026-08-15T00:57:39.83369', 350000, 0, 350000, 'chino');

-- NOTA: la auditoría original asumía 1 fila en periodos; en la práctica hay 2 (id 1 y 3),
-- ambas con total_ingresos/total_gastos/balance y cerrado_by poblados con datos reales de
-- cierre mensual. Esto se tuvo en cuenta al fusionar periodos -> meses_periodo (ver
-- migración add_periodo_summary_to_meses_periodo y migrate_periodos_to_meses_periodo).
