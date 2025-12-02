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

/**
 * SMS Transaction Integration Types
 */

export interface ParsedTransaction {
  rawText: string;                 // original SMS text
  amount: number;                  // parsed amount
  merchant: string;                // merchant or description
  date: Date;                      // transaction date
  type: 'DEBIT' | 'CREDIT';        // direction of money
  channel: 'UPI' | 'CARD' | 'ATM' | 'NETBANKING' | 'OTHER';
  bank?: string;                   // optional bank name if detected
  meta?: Record<string, any>;      // any extra data
}

export interface SMSWebhookRequest {
  text: string;                    // SMS body content
  receivedAt?: string;             // optional ISO timestamp
  sender?: string;                 // optional sender id/phone
}
