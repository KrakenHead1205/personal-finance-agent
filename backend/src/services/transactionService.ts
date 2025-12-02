import pool from '../db/pool';
import { Transaction, CreateTransactionInput, ParsedTransaction } from '../types/transaction';
import { categorizeTransaction, ruleBasedCategorize } from './categorizationService';
import { checkForDuplicate } from './duplicateDetectionService';

/**
 * Transaction service
 * Handles all database operations for transactions
 */

/**
 * Create a new transaction with duplicate detection
 * @param data - Transaction data
 * @param skipDuplicateCheck - Skip duplicate check (default: false)
 * @returns Created transaction and duplicate info
 */
export async function createTransaction(
  data: CreateTransactionInput,
  skipDuplicateCheck: boolean = false
): Promise<Transaction> {
  const { user_id, amount, description, category, source, date } = data;

  // Check for duplicates before creating (unless skipped)
  if (!skipDuplicateCheck) {
    const duplicateCheck = await checkForDuplicate(data, user_id, 24); // 24 hour window
    
    if (duplicateCheck.isDuplicate && duplicateCheck.confidence === 'high') {
      console.warn(`⚠️ High-confidence duplicate detected: ${duplicateCheck.reason}`);
      // Still create the transaction, but log the warning
      // In production, you might want to return an error or ask for confirmation
    } else if (duplicateCheck.isDuplicate && duplicateCheck.confidence === 'medium') {
      console.warn(`⚠️ Potential duplicate detected: ${duplicateCheck.reason}`);
    }
  }

  // Determine final category: use provided category or auto-categorize
  let finalCategory: string;
  
  if (category && category.trim().length > 0) {
    // Use provided category as-is
    finalCategory = category;
  } else {
    // Auto-categorize using improved pipeline (ADK with fallback)
    finalCategory = await categorizeTransaction(description, {
      amount,
      channel: source, // e.g., "UPI", "Credit Card", etc.
    });
  }

  const query = `
    INSERT INTO transactions (user_id, amount, description, category, source, date)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const values = [user_id, amount, description, finalCategory, source, date];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Get transactions by date range
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 * @param userId - Optional user ID filter
 * @returns List of transactions
 */
export async function getTransactionsByDateRange(
  from: string,
  to: string,
  userId?: string
): Promise<Transaction[]> {
  let query = `
    SELECT * FROM transactions
    WHERE date >= $1 AND date <= $2
  `;

  const values: any[] = [from, to];

  if (userId) {
    query += ` AND user_id = $3`;
    values.push(userId);
  }

  query += ` ORDER BY date DESC`;

  const result = await pool.query(query, values);
  return result.rows;
}

/**
 * Get a single transaction by ID
 * @param id - Transaction ID
 * @returns Transaction or null
 */
export async function getTransactionById(id: string): Promise<Transaction | null> {
  const query = `SELECT * FROM transactions WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * Delete a transaction by ID
 * @param id - Transaction ID
 * @returns Deleted transaction or null
 */
export async function deleteTransaction(id: string): Promise<Transaction | null> {
  const query = `DELETE FROM transactions WHERE id = $1 RETURNING *`;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * Get all transactions (without date filter)
 * @returns List of all transactions
 */
export async function getAllTransactions(): Promise<Transaction[]> {
  const query = `SELECT * FROM transactions ORDER BY date DESC`;
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Create transaction from parsed SMS data
 * @param parsedData - Parsed SMS transaction
 * @param userId - User ID to associate with transaction
 * @returns Created transaction
 */
export async function createTransactionFromSMS(
  parsed: ParsedTransaction,
  userId: string
): Promise<Transaction> {
  // Map channel to source
  let source: string;
  switch (parsed.channel) {
    case 'UPI':
      source = 'UPI';
      break;
    case 'CARD':
      source = 'Credit Card';
      break;
    case 'ATM':
      source = 'Debit Card';
      break;
    default:
      source = 'SMS';
  }

  // Use merchant name if available, otherwise fall back to raw text
  const description = parsed.merchant || parsed.rawText;

  // Auto-categorize using improved pipeline with full context
  const category = await categorizeTransaction(description, {
    amount: parsed.amount,
    channel: parsed.channel,
    rawText: parsed.rawText,
  });

  // For credit transactions (money received), we might want to handle differently
  // For now, we'll store all transactions as positive amounts
  const amount = parsed.type === 'CREDIT' ? parsed.amount : parsed.amount;

  // Create transaction
  const transaction = await createTransaction({
    user_id: userId,
    amount,
    description,
    category,
    source,
    date: parsed.date,
  });

  return transaction;
}

