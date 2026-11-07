import { pdf } from '@react-pdf/renderer';
import { ReportePDF, ReportePDFData, ComprobantePagoPDF, ComprobantePagoData } from './pdfDocuments';
import { toast } from '../components/ui/feedback';

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    toast('No hay datos para exportar', 'warning');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escapar comas y comillas en los valores
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ),
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
}

export function exportToJSON(data: any, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
}

// Reporte de la pantalla de Reportes en PDF (mismas filas que el CSV y el JSON).
export async function exportReportePDF(reporte: ReportePDFData, filename: string) {
  try {
    descargarBlob(await pdf(<ReportePDF {...reporte} />).toBlob(), filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast('Error al generar el PDF', 'error');
  }
}

function downloadFile(content: string, filename: string, mimeType: string) {
  descargarBlob(new Blob([content], { type: mimeType }), filename);
}

function descargarBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Descarga el comprobante de un pago de la pasarela como PDF.
export async function descargarComprobantePago(pago: ComprobantePagoData) {
  try {
    descargarBlob(await pdf(<ComprobantePagoPDF pago={pago} />).toBlob(), `comprobante-${pago.referencia}.pdf`);
  } catch (error) {
    console.error('Error al generar el comprobante:', error);
    toast('No se pudo generar el comprobante en PDF', 'error');
  }
}
