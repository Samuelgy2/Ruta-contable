import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatCurrency } from './format';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1 solid #333',
    paddingBottom: 10,
  },
  clubName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  reportTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  date: {
    fontSize: 9,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontWeight: 'normal',
  },
  summaryValue: {
    fontFamily: 'Helvetica-Bold',
  },
  positiveValue: {
    color: '#16a34a',
  },
  negativeValue: {
    color: '#dc2626',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 5,
    borderBottom: '1 solid #ccc',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottom: '1 solid #eee',
  },
  tableCell: {
    width: '20%',
  },
  tableCellWide: {
    width: '30%',
  },
  tableCellNarrow: {
    width: '15%',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
  },
  balanceCard: {
    padding: 10,
    marginBottom: 15,
    borderRadius: 4,
  },
  balancePositive: {
    backgroundColor: '#dcfce7',
  },
  balanceNegative: {
    backgroundColor: '#fee2e2',
  },
});

// ─── Reporte por periodo (pantalla de Reportes: RF-023/026/033/036) ───────────
// Un solo documento para todos los tipos: las mismas filas que se ven en
// pantalla y se exportan a CSV/JSON (RF-036 RN-004).
export interface ColumnaReporte {
  clave: string;
  titulo: string;
  moneda?: boolean;
}

export interface ReportePDFData {
  club: string;
  titulo: string;
  periodo: string;
  generado: string;
  moneda: string;
  columnas: ColumnaReporte[];
  filas: Record<string, string | number | null>[];
}

export function ReportePDF({ club, titulo, periodo, generado, moneda, columnas, filas }: ReportePDFData) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.clubName}>{club}</Text>
          <Text style={styles.reportTitle}>{titulo}</Text>
          <Text style={styles.date}>Periodo consultado: {periodo} · Generado: {generado}</Text>
        </View>
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            {columnas.map(c => <Text key={c.clave} style={{ flex: 1, fontFamily: 'Helvetica-Bold' }}>{c.titulo}</Text>)}
          </View>
          {filas.length === 0 ? (
            <Text style={{ padding: 5 }}>Sin registros en el periodo.</Text>
          ) : filas.map((fila, i) => (
            <View key={i} style={styles.tableRow} wrap={false}>
              {columnas.map(c => (
                <Text key={c.clave} style={{ flex: 1 }}>
                  {c.moneda ? formatCurrency(Number(fila[c.clave] ?? 0), moneda) : String(fila[c.clave] ?? '')}
                </Text>
              ))}
            </View>
          ))}
        </View>
        <Text style={styles.footer}>
          Reporte generado automáticamente por el sistema de gestión del club
        </Text>
      </Page>
    </Document>
  );
}

// ─── Comprobante de un pago de la pasarela ────────────────────────────────────
// La pasarela devuelve JSON, no un PDF: el comprobante se construye aquí con la
// referencia, el monto, el método, la fecha, el estado y el nombre del socio.

export interface ComprobantePagoData {
  referencia: string;
  concepto: string | null;
  monto: number;
  moneda: string;
  estado: string;
  metodoPago: string | null;
  fecha: string;
  socio: string;
  proveedorId?: string | null;
}

const ESTADOS_COMPROBANTE: Record<string, string> = {
  APPROVED: 'Aprobado',
  PENDING:  'Pendiente',
  DECLINED: 'Rechazado',
  VOIDED:   'Anulado',
  ERROR:    'Con error',
};

export function ComprobantePagoPDF({ pago }: { pago: ComprobantePagoData }) {
  const monto = `${pago.moneda} ${pago.monto.toLocaleString('es-CO')}`;
  const estado = ESTADOS_COMPROBANTE[pago.estado] ?? pago.estado;
  const aprobado = pago.estado === 'APPROVED';

  const fila = (etiqueta: string, valor: string) => (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{etiqueta}</Text>
      <Text style={styles.summaryValue}>{valor}</Text>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.clubName}>Ruta Contable</Text>
          <Text style={styles.reportTitle}>Comprobante de pago</Text>
          <Text style={styles.date}>Generado: {new Date().toLocaleString('es-CO')}</Text>
        </View>

        <View style={[styles.balanceCard, aprobado ? styles.balancePositive : styles.balanceNegative]}>
          <Text style={styles.summaryValue}>Estado del pago: {estado}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del pago</Text>
          {fila('Referencia', pago.referencia)}
          {fila('Concepto', pago.concepto ?? '—')}
          {fila('Monto', monto)}
          {fila('Método de pago', pago.metodoPago ?? '—')}
          {fila('Fecha', new Date(pago.fecha).toLocaleString('es-CO'))}
          {pago.proveedorId ? fila('Identificador de la pasarela', pago.proveedorId) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Socio</Text>
          {fila('Nombre', pago.socio)}
        </View>

        <Text style={styles.footer}>
          Comprobante generado por Ruta Contable. Conserva la referencia para cualquier reclamación.
        </Text>
      </Page>
    </Document>
  );
}
