/**
 * Transaction type definitions
 */

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category: string;
  source: string;
  date: Date;
  created_at: Date;
}

export interface CreateTransactionInput {
  user_id: string;
  amount: number;
  description: string;
  category?: string;
  source: string;
  date: string | Date;
}

export interface TransactionQuery {
  from?: string;
  to?: string;
  user_id?: string;
}

export interface WeeklySummary {
  total: number;
  byCategory: Record<string, number>;
  topTransactions: Transaction[];
}
