import pool from '../db/pool';
import { Transaction } from '../types/transaction';

/**
 * Recurring Transaction Detection Service
 * Identifies recurring transactions (subscriptions, bills, rent, etc.)
 */

export interface RecurringTransaction {
  pattern: {
    description: string;
    normalizedDescription: string;
    amount: number;
    category: string;
    source: string;
    averageAmount: number;
    frequency: 'daily' | 'weekly' | 'monthly' | 'biweekly' | 'unknown';
    confidence: 'high' | 'medium' | 'low';
  };
  occurrences: Transaction[];
  nextExpectedDate?: Date;
  totalOccurrences: number;
}

/**
 * Detect recurring transactions for a user
 * @param userId - User ID
 * @param lookbackDays - Number of days to analyze (default: 90)
 * @returns List of detected recurring transactions
 */
export async function detectRecurringTransactions(
  userId: string,
  lookbackDays: number = 90
): Promise<RecurringTransaction[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackDays);

  const query = `
    SELECT * FROM transactions
    WHERE user_id = $1
      AND date >= $2
    ORDER BY date ASC
  `;

  const result = await pool.query(query, [userId, startDate.toISOString()]);
  const transactions: Transaction[] = result.rows;

  // Group transactions by normalized description + category + source
  const groups = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    const normalizedDesc = normalizeDescription(tx.description);
    const key = `${normalizedDesc}_${tx.category}_${tx.source}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(tx);
  }

  const recurringTransactions: RecurringTransaction[] = [];

  for (const [key, group] of groups.entries()) {
    if (group.length >= 2) {
      // Analyze the group for recurring patterns
      const pattern = analyzeRecurringPattern(group);
      
      if (pattern.confidence !== 'low') {
        // Calculate next expected date
        const nextExpectedDate = calculateNextExpectedDate(group, pattern.frequency);
        
        recurringTransactions.push({
          pattern,
          occurrences: group.sort((a, b) => {
            const dateA = a.date instanceof Date ? a.date : new Date(a.date);
            const dateB = b.date instanceof Date ? b.date : new Date(b.date);
            return dateA.getTime() - dateB.getTime();
          }),
          nextExpectedDate,
          totalOccurrences: group.length,
        });
      }
    }
  }

  // Sort by confidence and frequency
  return recurringTransactions.sort((a, b) => {
    const confidenceOrder = { high: 3, medium: 2, low: 1 };
    return confidenceOrder[b.pattern.confidence] - confidenceOrder[a.pattern.confidence];
  });
}

/**
 * Analyze a group of transactions to detect recurring pattern
 */
function analyzeRecurringPattern(transactions: Transaction[]): RecurringTransaction['pattern'] {
  const firstTx = transactions[0];
  const normalizedDesc = normalizeDescription(firstTx.description);
  
  // Calculate average amount
  const amounts = transactions.map((tx) => parseFloat(tx.amount.toString()));
  const averageAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
  const amountVariance = amounts.reduce((sum, amt) => sum + Math.pow(amt - averageAmount, 2), 0) / amounts.length;
  const amountStdDev = Math.sqrt(amountVariance);
  const amountCoefficient = amountStdDev / averageAmount; // Lower = more consistent

  // Analyze date intervals
  const dates = transactions.map((tx) => {
    return tx.date instanceof Date ? tx.date : new Date(tx.date);
  }).sort((a, b) => a.getTime() - b.getTime());

  const intervals: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const daysDiff = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
    intervals.push(daysDiff);
  }

  const avgInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
  const intervalVariance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;
  const intervalStdDev = Math.sqrt(intervalVariance);

  // Determine frequency
  let frequency: 'daily' | 'weekly' | 'monthly' | 'biweekly' | 'unknown' = 'unknown';
  if (avgInterval >= 28 && avgInterval <= 32) {
    frequency = 'monthly';
  } else if (avgInterval >= 13 && avgInterval <= 15) {
    frequency = 'biweekly';
  } else if (avgInterval >= 6 && avgInterval <= 8) {
    frequency = 'weekly';
  } else if (avgInterval >= 0.8 && avgInterval <= 1.2) {
    frequency = 'daily';
  }

  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'low';
  
  // High confidence: consistent amount (low variance) + regular intervals + multiple occurrences
  if (
    transactions.length >= 3 &&
    amountCoefficient < 0.1 && // Amount varies by less than 10%
    intervalStdDev < 3 && // Intervals are consistent (std dev < 3 days)
    frequency !== 'unknown'
  ) {
    confidence = 'high';
  } else if (
    transactions.length >= 2 &&
    amountCoefficient < 0.2 && // Amount varies by less than 20%
    intervalStdDev < 5 && // Intervals are somewhat consistent
    frequency !== 'unknown'
  ) {
    confidence = 'medium';
  }

  return {
    description: firstTx.description,
    normalizedDescription: normalizedDesc,
    amount: averageAmount,
    category: firstTx.category,
    source: firstTx.source,
    averageAmount,
    frequency,
    confidence,
  };
}

/**
 * Calculate next expected date for a recurring transaction
 */
function calculateNextExpectedDate(
  transactions: Transaction[],
  frequency: string
): Date | undefined {
  if (transactions.length === 0) return undefined;

  const dates = transactions.map((tx) => {
    return tx.date instanceof Date ? tx.date : new Date(tx.date);
  }).sort((a, b) => b.getTime() - a.getTime()); // Most recent first

  const lastDate = dates[0];
  const nextDate = new Date(lastDate);

  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    default:
      return undefined;
  }

  return nextDate;
}

/**
 * Normalize description for comparison
 */
function normalizeDescription(description: string): string {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if a transaction matches a known recurring pattern
 * @param transaction - Transaction to check
 * @param recurringPatterns - List of known recurring patterns
 * @returns Matching pattern or null
 */
export function matchRecurringPattern(
  transaction: Transaction,
  recurringPatterns: RecurringTransaction[]
): RecurringTransaction | null {
  const normalizedDesc = normalizeDescription(transaction.description);
  const amount = parseFloat(transaction.amount.toString());

  for (const pattern of recurringPatterns) {
    const descMatch = normalizedDesc === pattern.pattern.normalizedDescription ||
      normalizedDesc.includes(pattern.pattern.normalizedDescription) ||
      pattern.pattern.normalizedDescription.includes(normalizedDesc);

    const amountMatch = Math.abs(amount - pattern.pattern.averageAmount) / pattern.pattern.averageAmount < 0.2; // Within 20%

    if (descMatch && amountMatch && transaction.category === pattern.pattern.category) {
      return pattern;
    }
  }

  return null;
}

