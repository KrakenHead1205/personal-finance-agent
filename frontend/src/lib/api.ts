/**
 * API client for Personal Finance Agent backend
 */

// Backend API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Transaction interface matching backend response
 */
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  description: string;
  category: string;
  source: string;
  date: string;
  createdAt: string;
}

/**
 * API response for transactions list
 */
export interface TransactionsResponse {
  count: number;
  transactions: Transaction[];
}

/**
 * Weekly summary interface
 */
export interface WeeklySummary {
  total: number;
  byCategory: Record<string, number>;
  topTransactions: Transaction[];
}

/**
 * Weekly report response
 */
export interface WeeklyReportResponse {
  weekStart: string;
  weekEnd: string;
  summary: WeeklySummary;
  insights: string[];
}

/**
 * Fetch transactions from the backend
 * @param from - Start date in YYYY-MM-DD format
 * @param to - End date in YYYY-MM-DD format
 * @param userId - Optional user ID filter
 * @returns List of transactions
 */
export async function fetchTransactions(
  from: string,
  to: string,
  userId?: string
): Promise<TransactionsResponse> {
  const params = new URLSearchParams({ from, to });
  if (userId) {
    params.append('userId', userId);
  }

  const response = await fetch(`${API_BASE_URL}/transactions?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch weekly report with summary and insights
 * @param weekStart - Start date in YYYY-MM-DD format
 * @returns Weekly report with summary and insights
 */
export async function fetchWeeklyReport(weekStart: string): Promise<WeeklyReportResponse> {
  const response = await fetch(
    `${API_BASE_URL}/reports/weekly?weekStart=${weekStart}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch weekly report: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new transaction
 * @param transaction - Transaction data
 * @returns Created transaction
 */
export async function createTransaction(transaction: {
  userId: string;
  amount: number;
  description: string;
  category?: string;
  source: string;
  date: string;
}): Promise<{ message: string; transaction: Transaction }> {
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transaction),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create transaction');
  }

  return response.json();
}

/**
 * Format date to YYYY-MM-DD
 * @param date - Date object
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get date range for the last N days
 * @param days - Number of days
 * @returns { from, to } date range in YYYY-MM-DD format
 */
export function getLastNDays(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);

  return {
    from: formatDate(from),
    to: formatDate(to),
  };
}

