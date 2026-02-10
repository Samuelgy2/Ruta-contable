import { useMemo } from 'react';
import { Transaction, Fee, Member } from '../types';

export function useStats(
  transactions: Transaction[],
  fees: Fee[],
  members: Member[]
) {
  return useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyBalance = monthlyIncome - monthlyExpense;

    const activeMembers = members.filter(m => m.active).length;
    const inactiveMembers = members.filter(m => !m.active).length;

    const paidFees = fees.filter(f => f.status === 'paid').length;
    const pendingFees = fees.filter(f => f.status === 'pending').length;
    const overdueFees = fees.filter(f => f.status === 'overdue').length;

    const totalPaidAmount = fees
      .filter(f => f.status === 'paid')
      .reduce((sum, f) => sum + f.amount, 0);

    const totalPendingAmount = fees
      .filter(f => f.status === 'pending' || f.status === 'overdue')
      .reduce((sum, f) => sum + f.amount, 0);

    return {
      totalIncome,
      totalExpense,
      balance,
      monthlyIncome,
      monthlyExpense,
      monthlyBalance,
      activeMembers,
      inactiveMembers,
      totalMembers: members.length,
      paidFees,
      pendingFees,
      overdueFees,
      totalPaidAmount,
      totalPendingAmount,
      totalTransactions: transactions.length,
    };
  }, [transactions, fees, members]);
}
