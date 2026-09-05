import { Transaction, Member, Category, Fee, SystemData } from '../types';
import { pdf } from '@react-pdf/renderer';
import { TransactionReportPDF, MembersReportPDF, ComprobantePagoPDF, ComprobantePagoData } from './pdfDocuments';

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    alert('No hay datos para exportar');
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

export async function exportTransactionsReportPDF(transactions: Transaction[], systemData: SystemData) {
  if (transactions.length === 0) {
    alert('No hay transacciones para exportar');
    return;
  }

  try {
    const blob = await pdf(<TransactionReportPDF transactions={transactions} systemData={systemData} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-financiero-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error al generar el PDF');
  }
}

export async function exportMembersReportPDF(members: Member[], fees: Fee[], systemData: SystemData) {
  if (members.length === 0) {
    alert('No hay socios para exportar');
    return;
  }

  try {
    const blob = await pdf(<MembersReportPDF members={members} fees={fees} systemData={systemData} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-socios-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error al generar el PDF');
  }
}

export function exportTransactionsReport(transactions: Transaction[], systemData: SystemData) {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpense;

  const report = `
 REPORTE FINANCIERO
 ${systemData.clubName}
 Generado: ${new Date().toLocaleString()}

 ========================================
 RESUMEN
 ========================================
 Total Ingresos: ${systemData.currency}${totalIncome.toFixed(2)}
 Total Gastos: ${systemData.currency}${totalExpense.toFixed(2)}
 Balance: ${systemData.currency}${balance.toFixed(2)}

 ========================================
 DETALLE DE TRANSACCIONES
 ========================================

 ${transactions.map(t => `
 Fecha: ${t.date}
 Tipo: ${t.type === 'income' ? 'Ingreso' : 'Gasto'}
 Categoría: ${t.category}
 Monto: ${systemData.currency}${t.amount.toFixed(2)}
 Descripción: ${t.description}
 ----------------------------------------
 `).join('\n')}

 Fin del reporte
  `.trim();

  downloadFile(report, `reporte-financiero-${new Date().toISOString().split('T')[0]}.txt`, 'text/plain');
}

export function exportMembersWithFees(members: Member[], fees: Fee[]) {
  const membersData = members.map(member => {
    const memberFees = fees.filter(f => f.memberId === member.id);
    const totalPaid = memberFees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
    const totalPending = memberFees.filter(f => f.status === 'pending' || f.status === 'overdue').reduce((sum, f) => sum + f.amount, 0);
    
    return {
      nombre: member.name,
      email: member.email,
      telefono: member.phone,
      tipoMembresia: member.membershipType,
      fechaIngreso: member.joinDate,
      estado: member.active ? 'Activo' : 'Inactivo',
      cuotasPagadas: totalPaid,
      cuotasPendientes: totalPending,
    };
  });

  exportToCSV(membersData, `socios-${new Date().toISOString().split('T')[0]}.csv`);
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
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
    const blob = await pdf(<ComprobantePagoPDF pago={pago} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comprobante-${pago.referencia}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al generar el comprobante:', error);
    alert('No se pudo generar el comprobante en PDF');
  }
}
