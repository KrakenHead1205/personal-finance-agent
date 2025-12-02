export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  description: string;
  category: string;
  source: string;
  date: Date;
  createdAt: Date;
}

export interface CreateTransactionInput {
  userId: string;
  amount: number;
  description: string;
  category?: string;
  source: string;
  date: string | Date;
}

export interface TransactionQuery {
  from?: string;
  to?: string;
  userId?: string;
}

export interface WeeklySummary {
  total: number;
  byCategory: Record<string, number>;
  topTransactions: Transaction[];
}

