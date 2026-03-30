import { CrudManager } from '../../components/crud/CrudManager';
import { transactionsConfig } from '../../config/entities/transactions.config';

export function TransactionsPage() {
  return <CrudManager config={transactionsConfig} />;
}
