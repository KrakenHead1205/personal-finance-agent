import pool from '../db/pool';
import { Transaction, CreateTransactionInput, ParsedTransaction } from '../types/transaction';
import { categorizeTransaction } from './categorizationService';

/**
 * Transaction service
 * Handles all database operations for transactions
 */

/**
 * Create a new transaction
 * @param data - Transaction data
 * @returns Created transaction
 */
export async function createTransaction(
  data: CreateTransactionInput
): Promise<Transaction> {
  const { user_id, amount, description, category, source, date } = data;

  const query = `
    INSERT INTO transactions (user_id, amount, description, category, source, date)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const values = [user_id, amount, description, category, source, date];

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
  parsedData: ParsedTransaction,
  userId: string
): Promise<Transaction> {
  // Determine source based on channel
  let source = parsedData.channel;
  if (parsedData.bank) {
    source = `${parsedData.bank} ${parsedData.channel}`;
  }

  // Auto-categorize based on merchant description
  const category = await categorizeTransaction(parsedData.merchant);

  // For credit transactions (money received), we might want to handle differently
  // For now, we'll store all transactions as positive amounts
  const amount = parsedData.type === 'CREDIT' ? parsedData.amount : parsedData.amount;

  // Create transaction
  const transaction = await createTransaction({
    user_id: userId,
    amount,
    description: parsedData.merchant,
    category,
    source,
    date: parsedData.date,
  });

  return transaction;
}

