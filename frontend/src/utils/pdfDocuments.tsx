import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Transaction, SystemData, Member, Fee } from '../types';

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

interface TransactionReportProps {
  transactions: Transaction[];
  systemData: SystemData;
}

export function TransactionReportPDF({ transactions, systemData }: TransactionReportProps) {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpense;
  const isPositive = balance >= 0;

  const formatCurrency = (amount: number) => {
    return `${systemData.currency}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.clubName}>{systemData.clubName}</Text>
          <Text style={styles.reportTitle}>Reporte Financiero</Text>
          <Text style={styles.date}>Generado: {new Date().toLocaleString('es-CO')}</Text>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RESUMEN FINANCIERO</Text>
          
          <View style={[styles.balanceCard, isPositive ? styles.balancePositive : styles.balanceNegative]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Balance Total:</Text>
              <Text style={[styles.summaryValue, isPositive ? styles.positiveValue : styles.negativeValue]}>
                {formatCurrency(balance)}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Ingresos:</Text>
            <Text style={[styles.summaryValue, styles.positiveValue]}>{formatCurrency(totalIncome)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Gastos:</Text>
            <Text style={[styles.summaryValue, styles.negativeValue]}>{formatCurrency(totalExpense)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Número de Transacciones:</Text>
            <Text style={styles.summaryValue}>{transactions.length}</Text>
          </View>
        </View>

        {/* Transactions Detail */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETALLE DE TRANSACCIONES</Text>
          
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableCellNarrow]}>Fecha</Text>
              <Text style={[styles.tableCell, styles.tableCellNarrow]}>Tipo</Text>
              <Text style={[styles.tableCell, styles.tableCellWide]}>Categoría</Text>
              <Text style={[styles.tableCell, styles.tableCellNarrow]}>Monto</Text>
              <Text style={[styles.tableCell, styles.tableCellWide]}>Descripción</Text>
            </View>

            {/* Table Rows */}
            {transactions.map((transaction, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableCellNarrow]}>{formatDate(transaction.date)}</Text>
                <Text style={[styles.tableCell, styles.tableCellNarrow]}>
                  {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellWide]}>{transaction.category}</Text>
                <Text style={[
                  styles.tableCell, 
                  styles.tableCellNarrow,
                  transaction.type === 'income' ? styles.positiveValue : styles.negativeValue
                ]}>
                  {formatCurrency(transaction.amount)}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellWide]}>{transaction.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Reporte generado automáticamente por el sistema de gestión del club
        </Text>
      </Page>
    </Document>
  );
}

interface MembersReportProps {
  members: Member[];
  fees: Fee[];
  systemData: SystemData;
}

export function MembersReportPDF({ members, fees, systemData }: MembersReportProps) {
  const formatCurrency = (amount: number) => {
    return `${systemData.currency}${amount.toFixed(2)}`;
  };

  const getMemberFees = (memberId: string) => {
    return fees.filter(f => f.memberId === memberId);
  };

  const getMemberStatus = (member: Member) => {
    const memberFees = getMemberFees(member.id);
    const hasOverdue = memberFees.some(f => f.status === 'overdue');
    const hasPending = memberFees.some(f => f.status === 'pending');
    
    if (hasOverdue) return 'Vencida';
    if (hasPending) return 'Pendiente';
    return 'Al día';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.clubName}>{systemData.clubName}</Text>
          <Text style={styles.reportTitle}>Reporte de Socios y Cuotas</Text>
          <Text style={styles.date}>Generado: {new Date().toLocaleString('es-CO')}</Text>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RESUMEN DE SOCIOS</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Socios:</Text>
            <Text style={styles.summaryValue}>{members.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Socios Activos:</Text>
            <Text style={styles.summaryValue}>{members.filter(m => m.active).length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Socios Inactivos:</Text>
            <Text style={styles.summaryValue}>{members.filter(m => !m.active).length}</Text>
          </View>
        </View>

        {/* Members Detail */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETALLE DE SOCIOS</Text>
          
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableCellWide]}>Nombre</Text>
              <Text style={[styles.tableCell, styles.tableCellWide]}>Tipo</Text>
              <Text style={[styles.tableCell, styles.tableCellNarrow]}>Estado</Text>
              <Text style={[styles.tableCell, styles.tableCellNarrow]}>Cuotas</Text>
              <Text style={[styles.tableCell, styles.tableCellNarrow]}>Estado Cuotas</Text>
            </View>

            {/* Table Rows */}
            {members.map((member, index) => {
              const memberFees = getMemberFees(member.id);
              const paidFees = memberFees.filter(f => f.status === 'paid').length;
              
              return (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableCellWide]}>{member.name}</Text>
                  <Text style={[styles.tableCell, styles.tableCellWide]}>{member.membershipType}</Text>
                  <Text style={[styles.tableCell, styles.tableCellNarrow]}>
                    {member.active ? 'Activo' : 'Inactivo'}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellNarrow]}>{paidFees}/{memberFees.length}</Text>
                  <Text style={[styles.tableCell, styles.tableCellNarrow]}>
                    {getMemberStatus(member)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Reporte generado automáticamente por el sistema de gestión del club
        </Text>
      </Page>
    </Document>
  );
}

// ─── REPORTE DE CIERRE MENSUAL ─────────────────────────────────────
interface MonthlyCloseData {
  periodo: {
    anio: number;
    mes: number;
    nombreMes: string;
    cerrado: boolean;
  };
  resumen: {
    ingresos: number;
    gastos: number;
    balance: number;
    totalTransacciones: number;
  };
  transacciones: Transaction[];
  systemData: SystemData;
}

export function MonthlyClosePDF({ periodo, resumen, transacciones, systemData }: MonthlyCloseData) {
  const formatCurrency = (amount: number) => {
    return `${systemData.currency}${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.clubName}>{systemData.clubName}</Text>
          <Text style={styles.reportTitle}>CIERRE MENSUAL {periodo.nombreMes.toUpperCase()} {periodo.anio}</Text>
          <Text style={styles.date}>Generado: {new Date().toLocaleString('es-CO')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RESUMEN DEL PERIODO</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Ingresos:</Text>
            <Text style={[styles.summaryValue, styles.positiveValue]}>{formatCurrency(resumen.ingresos)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Gastos:</Text>
            <Text style={[styles.summaryValue, styles.negativeValue]}>{formatCurrency(resumen.gastos)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Balance del Mes:</Text>
            <Text style={[styles.summaryValue, resumen.balance >= 0 ? styles.positiveValue : styles.negativeValue]}>
              {formatCurrency(resumen.balance)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Transacciones Registradas:</Text>
            <Text style={styles.summaryValue}>{resumen.totalTransacciones}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETALLE DE TRANSACCIONES</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableCellNarrow]}>Fecha</Text>
              <Text style={[styles.tableCell, styles.tableCellNarrow]}>Tipo</Text>
              <Text style={[styles.tableCell, styles.tableCellWide]}>Categoría</Text>
              <Text style={[styles.tableCell, styles.tableCellNarrow]}>Monto</Text>
              <Text style={[styles.tableCell, styles.tableCellWide]}>Descripción</Text>
            </View>
            {transacciones.map((t, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableCellNarrow]}>{formatDate(t.date)}</Text>
                <Text style={[styles.tableCell, styles.tableCellNarrow]}>{t.type === 'income' ? 'Ingreso' : 'Gasto'}</Text>
                <Text style={[styles.tableCell, styles.tableCellWide]}>{t.category}</Text>
                <Text style={[styles.tableCell, styles.tableCellNarrow, t.type === 'income' ? styles.positiveValue : styles.negativeValue]}>
                  {formatCurrency(t.amount)}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellWide]}>{t.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>
          Reporte oficial de cierre contable generado por Ruta Contable
        </Text>
      </Page>
    </Document>
  );
}