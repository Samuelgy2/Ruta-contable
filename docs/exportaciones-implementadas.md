# Exportaciones implementadas

Inventario de los métodos de exportación que existen en el código tras retirar el Excel de los reportes financieros (`GET /api/admin/periodos/:id/exportar-excel`). Las líneas corresponden a la rama `fix/quitar-excel`.

## Métodos en uso

| Módulo / pantalla | Botón (UI) | Función cliente | Endpoint | Formato | Archivo y línea |
|---|---|---|---|---|---|
| Reportes (admin) | "Transacciones CSV" | `handleExportTransactions` → `exportToCSV` | Ninguno: se genera en el navegador | CSV | `frontend/src/pages/admin/AdminReports.tsx:427` (botón), `:167` (handler); `frontend/src/utils/export.tsx:5` |
| Reportes (admin) | "Socios y Cuotas" | `handleExportMembers` → `exportMembersReportPDF` (`MembersReportPDF`) | Ninguno: se genera en el navegador con `@react-pdf/renderer` | PDF | `AdminReports.tsx:428`, `:180`; `export.tsx:56`; `frontend/src/utils/pdfDocuments.tsx:215` |
| Reportes (admin) | "Reporte Financiero PDF" | `handleExportReport` → `exportTransactionsReportPDF` (`TransactionReportPDF`) | Ninguno: se genera en el navegador con `@react-pdf/renderer` | PDF | `AdminReports.tsx:429`, `:185`; `export.tsx:34`; `pdfDocuments.tsx:108` |
| Reportes (admin) | "Backup Completo" | `handleExportAllData` → `exportToJSON` | Ninguno: se genera en el navegador | JSON | `AdminReports.tsx:430`, `:190`; `export.tsx:29` |
| Portal del socio, Pagos | "Descargar PDF" (comprobante) | `descargarComprobante` → `descargarComprobantePago` (`ComprobantePagoPDF`) | Ninguno para el archivo; los datos vienen de `GET /api/portal/pagos` | PDF | `frontend/src/pages/portal/PortalPayments.tsx:301-303` (botón), `:192` (handler); `export.tsx:154`; `pdfDocuments.tsx:420`; `frontend/src/services/portalService.ts:14` |
| Asistencia (admin) | "⬇ Exportar Excel" | `handleExport` → `asistenciaService.exportarExcelUrl` | `GET /api/asistencia/exportar-excel` (requireAdmin) | XLSX | `frontend/src/pages/admin/AdminAsistencia.tsx:362` (botón), `:243` (handler); `frontend/src/services/asistenciaService.ts:45`; `backend/routes/asistencia.js:9`; `backend/controllers/AsistenciaController.js:300` |

El Excel de asistencia no es CSV, PDF ni JSON. Aparece en la tabla porque sigue implementado y se conservó a propósito. La dependencia `exceljs` (`backend/package.json:20`) se mantiene porque solo la usa este controlador.

## Funciones implementadas sin uso

Ninguna pantalla importa estas funciones (los únicos imports de `utils/export` están en `AdminReports.tsx:6` y `PortalPayments.tsx:7`):

| Función | Formato | Archivo y línea |
|---|---|---|
| `exportTransactionsReport` | TXT (`text/plain`) | `frontend/src/utils/export.tsx:78` |
| `exportMembersWithFees` | CSV | `frontend/src/utils/export.tsx:120` |

## Observaciones

- El backend no tiene ningún endpoint que genere CSV, PDF o JSON como archivo descargable. Esos tres formatos se generan solo en el cliente. Las únicas cabeceras `Content-Disposition` del backend son la del Excel de asistencia (`AsistenciaController.js:351`) y la descarga de documentos del socio (`SocioDocumentoController.js:84`). Esta última devuelve el archivo que se subió (RF-050), no una exportación.
- Las cuatro exportaciones de Reportes leen `transactions`, `members` y `fees` de `useData()` (`AdminReports.tsx:145`). `DataContext` carga esos datos desde `localStorage` y, si están vacíos, desde los datos de ejemplo de `getInitialData()` (`frontend/src/contexts/DataContext.tsx:169-199`; `frontend/src/utils/initialData.ts:156`). `DataContext` no llama a la API, y ningún componente fuera de él escribe esas colecciones. Por eso estas exportaciones no reflejan la base de datos.
