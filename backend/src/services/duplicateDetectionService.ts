import pool from '../db/pool';
import { Transaction, CreateTransactionInput } from '../types/transaction';

/**
 * Duplicate Detection Service
 * Identifies potential duplicate transactions
 */

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarTransactions: Transaction[];
  confidence: 'high' | 'medium' | 'low';
  reason?: string;
}

/**
 * Check if a transaction is a potential duplicate
 * @param transaction - Transaction to check
 * @param userId - User ID
 * @param timeWindowHours - Time window to check for duplicates (default: 24 hours)
 * @returns Duplicate check result
 */
export async function checkForDuplicate(
  transaction: CreateTransactionInput,
  userId: string,
  timeWindowHours: number = 24
): Promise<DuplicateCheckResult> {
  const { amount, description, source, date } = transaction;

  // Convert date to Date object if it's a string
  const transactionDate = typeof date === 'string' ? new Date(date) : date;
  const timeWindowStart = new Date(transactionDate);
  timeWindowStart.setHours(timeWindowStart.getHours() - timeWindowHours);

  // Query for similar transactions within the time window
  // Similarity criteria:
  // 1. Same amount (within 1% tolerance for rounding)
  // 2. Similar description (fuzzy match)
  // 3. Same source
  // 4. Within time window
  const query = `
    SELECT * FROM transactions
    WHERE user_id = $1
      AND source = $2
      AND date >= $3
      AND date <= $4
      AND ABS(amount - $5) / NULLIF($5, 0) < 0.01
    ORDER BY date DESC
    LIMIT 10
  `;

  const values = [
    userId,
    source,
    timeWindowStart.toISOString(),
    transactionDate.toISOString(),
    amount,
  ];

  const result = await pool.query(query, values);
  const similarTransactions: Transaction[] = result.rows;

  if (similarTransactions.length === 0) {
    return {
      isDuplicate: false,
      similarTransactions: [],
      confidence: 'low',
    };
  }

  // Check description similarity (fuzzy match)
  const normalizedDescription = normalizeDescription(description);
  const matches = similarTransactions.filter((tx) => {
    const txDescription = normalizeDescription(tx.description);
    return areDescriptionsSimilar(normalizedDescription, txDescription);
  });

  if (matches.length === 0) {
    return {
      isDuplicate: false,
      similarTransactions: [],
      confidence: 'low',
    };
  }

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let reason = '';

  // High confidence: exact amount + very similar description + same source + within 1 hour
  const exactMatches = matches.filter((tx) => {
    const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
    const hoursDiff = Math.abs(transactionDate.getTime() - txDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 1 && areDescriptionsVerySimilar(normalizedDescription, normalizeDescription(tx.description));
  });

  if (exactMatches.length > 0) {
    confidence = 'high';
    reason = `Exact duplicate found: Same amount (₹${amount}), similar description, and same source within 1 hour`;
  } else if (matches.length > 0) {
    // Medium confidence: same amount + similar description + within 24 hours
    confidence = 'medium';
    reason = `Potential duplicate: Same amount (₹${amount}) and similar description within ${timeWindowHours} hours`;
  }

  return {
    isDuplicate: confidence === 'high' || (confidence === 'medium' && matches.length > 0),
    similarTransactions: matches,
    confidence,
    reason,
  };
}

/**
 * Normalize description for comparison (lowercase, remove special chars, trim)
 */
function normalizeDescription(description: string): string {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two descriptions are similar (fuzzy match)
 */
function areDescriptionsSimilar(desc1: string, desc2: string): boolean {
  // Exact match
  if (desc1 === desc2) return true;

  // One contains the other (for cases like "SWIGGY" vs "SWIGGY ORDER")
  if (desc1.includes(desc2) || desc2.includes(desc1)) return true;

  // Word overlap (at least 50% of words match)
  const words1 = desc1.split(/\s+/).filter((w) => w.length > 2);
  const words2 = desc2.split(/\s+/).filter((w) => w.length > 2);

  if (words1.length === 0 || words2.length === 0) return false;

  const commonWords = words1.filter((w) => words2.includes(w));
  const overlapRatio = commonWords.length / Math.max(words1.length, words2.length);

  return overlapRatio >= 0.5;
}

/**
 * Check if two descriptions are very similar (for high confidence duplicates)
 */
function areDescriptionsVerySimilar(desc1: string, desc2: string): boolean {
  if (desc1 === desc2) return true;
  if (desc1.includes(desc2) || desc2.includes(desc1)) return true;

  // Very high word overlap (at least 80%)
  const words1 = desc1.split(/\s+/).filter((w) => w.length > 2);
  const words2 = desc2.split(/\s+/).filter((w) => w.length > 2);

  if (words1.length === 0 || words2.length === 0) return false;

  const commonWords = words1.filter((w) => words2.includes(w));
  const overlapRatio = commonWords.length / Math.max(words1.length, words2.length);

  return overlapRatio >= 0.8;
}

/**
 * Get all potential duplicates for a user
 * @param userId - User ID
 * @param days - Number of days to look back (default: 30)
 * @returns List of duplicate transaction groups
 */
export async function findDuplicateGroups(
  userId: string,
  days: number = 30
): Promise<Array<{ transactions: Transaction[]; confidence: string; reason: string }>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const query = `
    SELECT * FROM transactions
    WHERE user_id = $1
      AND date >= $2
    ORDER BY date DESC
  `;

  const result = await pool.query(query, [userId, startDate.toISOString()]);
  const transactions: Transaction[] = result.rows;

  // Group transactions by amount + source + similar description
  const groups = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    const key = `${tx.amount}_${tx.source}_${normalizeDescription(tx.description).substring(0, 20)}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(tx);
  }

  // Filter to only groups with 2+ transactions
  const duplicateGroups: Array<{ transactions: Transaction[]; confidence: string; reason: string }> = [];

  for (const [key, group] of groups.entries()) {
    if (group.length >= 2) {
      // Check if they're within reasonable time window
      const sortedGroup = group.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });

      const firstDate = sortedGroup[0].date instanceof Date ? sortedGroup[0].date : new Date(sortedGroup[0].date);
      const lastDate = sortedGroup[sortedGroup.length - 1].date instanceof Date
        ? sortedGroup[sortedGroup.length - 1].date
        : new Date(sortedGroup[sortedGroup.length - 1].date);

      const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff <= 7) {
        duplicateGroups.push({
          transactions: sortedGroup,
          confidence: daysDiff <= 1 ? 'high' : 'medium',
          reason: `${group.length} transactions with same amount (₹${group[0].amount}) and similar description within ${daysDiff.toFixed(1)} days`,
        });
      }
    }
  }

  return duplicateGroups;
}

