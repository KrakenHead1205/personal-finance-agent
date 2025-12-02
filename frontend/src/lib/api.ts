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
  user_id: string;
  userId?: string; // For backward compatibility
  amount: number;
  description: string;
  category: string;
  source: string;
  date: string;
  created_at: string;
  createdAt?: string; // For backward compatibility
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

  const data = await response.json();
  
  // Convert amount from string to number (PostgreSQL NUMERIC returns as string)
  if (data.transactions && Array.isArray(data.transactions)) {
    data.transactions = data.transactions.map((tx: any) => ({
      ...tx,
      amount: typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount,
    }));
  }

  return data;
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

  const data = await response.json();
  
  // Convert amounts from string to number (PostgreSQL NUMERIC returns as string)
  if (data.summary) {
    // Convert total
    if (typeof data.summary.total === 'string') {
      data.summary.total = parseFloat(data.summary.total);
    }
    
    // Convert byCategory amounts
    if (data.summary.byCategory) {
      const converted: Record<string, number> = {};
      for (const [category, amount] of Object.entries(data.summary.byCategory)) {
        converted[category] = typeof amount === 'string' ? parseFloat(amount) : amount;
      }
      data.summary.byCategory = converted;
    }
    
    // Convert topTransactions amounts
    if (data.summary.topTransactions && Array.isArray(data.summary.topTransactions)) {
      data.summary.topTransactions = data.summary.topTransactions.map((tx: any) => ({
        ...tx,
        amount: typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount,
      }));
    }
  }

  return data;
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
  // Convert frontend camelCase to backend snake_case
  const backendTransaction = {
    user_id: transaction.userId,
    amount: transaction.amount,
    description: transaction.description,
    category: transaction.category,
    source: transaction.source,
    date: transaction.date,
  };

  const response = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(backendTransaction),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to create transaction';
    try {
      const error = await response.json();
      errorMessage = error.error || error.message || errorMessage;
      if (error.required) {
        errorMessage += `. Missing: ${error.required.join(', ')}`;
      }
      if (error.details) {
        errorMessage += `. ${error.details}`;
      }
    } catch (e) {
      // If response is not JSON, use status text
      errorMessage = `${errorMessage}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
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

