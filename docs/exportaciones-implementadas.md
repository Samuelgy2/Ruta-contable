# Exportaciones implementadas

Inventario de los métodos de exportación que hay en el código de `main` después de integrar `fix/quitar-excel`, `fix/parciales-rapidos` y `feat/parciales-medios`. Los reportes financieros ya no se exportan a Excel: el endpoint `GET /api/admin/periodos/:id/exportar-excel` se retiró.

## Métodos en uso

| Módulo / pantalla | Botón (UI) | Función cliente | Endpoint | Formato | Archivo y línea |
|---|---|---|---|---|---|
| Reportes (admin) | "Exportar CSV" | `handleExportCSV` → `exportToCSV` | Ninguno para el archivo; los datos vienen de los endpoints de la nota 1 | CSV | `frontend/src/pages/admin/AdminReports.tsx:508` (botón), `:229` (handler); `frontend/src/utils/export.tsx:4` |
| Reportes (admin) | "Exportar PDF" | `handleExportPDF` → `exportReportePDF` (`ReportePDF`) | Igual que el CSV | PDF | `AdminReports.tsx:509`, `:232`; `export.tsx:34`; `frontend/src/utils/pdfDocuments.tsx:121` |
| Reportes (admin) | "Exportar JSON" | `handleExportJSON` → `exportToJSON` | Igual que el CSV | JSON | `AdminReports.tsx:510`, `:239`; `export.tsx:28` |
| Portal del socio, Pagos | "Descargar PDF" (comprobante) | `descargarComprobante` → `descargarComprobantePago` (`ComprobantePagoPDF`) | Ninguno para el archivo; los datos vienen de `GET /api/portal/pagos` | PDF | `frontend/src/pages/portal/PortalPayments.tsx:303` (botón), `:192` (handler); `export.tsx:59`; `pdfDocuments.tsx:178`; `frontend/src/services/portalService.ts:14` |
| Asistencia (admin) | "⬇ Exportar Excel" | `handleExport` → `asistenciaService.exportarExcelUrl` | `GET /api/asistencia/exportar-excel?fechaInicio=&fechaFin=` (requireAdmin) | XLSX | `frontend/src/pages/admin/AdminAsistencia.tsx:420` (botón), `:275` (handler); `frontend/src/services/asistenciaService.ts:45`; `backend/routes/asistencia.js:9`; `backend/controllers/AsistenciaController.js:314` |

**Nota 1. De dónde salen los datos de Reportes.** La pantalla tiene dos selectores: periodo (`<input type="month">`, `AdminReports.tsx:367`) y tipo de reporte (`:371`). Los tipos son resumen financiero, transacciones y cartera, y están definidos en `REPORTES` (`:134`). `useDatosPeriodo` (`:104`) pide los datos a la BD:
- `GET /api/admin/overview?anio=&mes=` (`backend/routes/admin.js:8`)
- `GET /api/transactions?anio=&mes=` (`backend/controllers/TransactionController.js:83`): solo se usan las transacciones confirmadas.
- `GET /api/cartera?anio=&mes=` (`backend/controllers/CarteraController.js:28`)

La tabla en pantalla y los tres archivos usan las mismas filas. El PDF y el JSON incluyen el periodo consultado y la fecha de generación. El CSV lleva el periodo en el nombre del archivo (`reporte-<tipo>-AAAA-MM.csv`).

**Nota 2. Excel de asistencia.** La hoja empieza con "Periodo consultado: … a …" (`AsistenciaController.js:375`) y el archivo se llama `Asistencia_<inicio>_<fin>.xlsx` (`:378`). Este Excel no es CSV, PDF ni JSON. Aparece en la tabla porque sigue implementado y se conservó a propósito. La dependencia `exceljs` (`backend/package.json:20`) solo la usa este controlador.

## Observaciones

- El backend no tiene ningún endpoint que genere CSV, PDF o JSON como archivo descargable. Esos tres formatos se generan en el cliente. Las únicas cabeceras `Content-Disposition` del backend son la del Excel de asistencia (`AsistenciaController.js:378`) y la descarga de documentos del socio (`backend/controllers/SocioDocumentoController.js:84`). Esta última devuelve el archivo que se subió (RF-050), no una exportación.
- Se retiraron las exportaciones que leían `DataContext` (`localStorage` o datos de ejemplo): "Transacciones CSV", "Socios y Cuotas" (PDF), "Reporte Financiero PDF" y "Backup Completo" (JSON). También se borraron las funciones sin uso `exportTransactionsReport` (TXT) y `exportMembersWithFees` (CSV). `DataContext` sigue montado en `frontend/src/App.tsx:197`, pero ninguna pantalla lo consume.
