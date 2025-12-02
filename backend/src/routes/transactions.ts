import { Router, Request, Response } from 'express';
import {
  createTransaction,
  getTransactionsByDateRange,
  getTransactionById,
  deleteTransaction,
} from '../services/transactionService';
import { categorizeTransaction } from '../services/categorizationService';
import { CreateTransactionInput } from '../types/transaction';

const router = Router();

/**
 * POST /transactions
 * Create a new transaction
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, amount, description, category, source, date }: CreateTransactionInput =
      req.body;

    // Validate required fields
    if (!user_id || !amount || !description || !source || !date) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['user_id', 'amount', 'description', 'source', 'date'],
      });
    }

    // Validate amount is a number
    if (typeof amount !== 'number' || isNaN(amount)) {
      return res.status(400).json({
        error: 'Amount must be a valid number',
      });
    }

    // Auto-categorize if category is not provided
    const finalCategory = category || (await categorizeTransaction(description));

    // Create transaction
    const transaction = await createTransaction({
      user_id,
      amount,
      description,
      category: finalCategory,
      source,
      date,
    });

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction,
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      error: 'Failed to create transaction',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /transactions
 * Get transactions with optional date range filtering
 * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD), user_id
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { from, to, user_id } = req.query;

    // Validate date range if provided
    if (!from || !to) {
      return res.status(400).json({
        error: 'Missing required query parameters',
        required: ['from', 'to'],
        format: 'YYYY-MM-DD',
      });
    }

    const transactions = await getTransactionsByDateRange(
      from as string,
      to as string,
      user_id as string | undefined
    );

    res.json({
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      error: 'Failed to fetch transactions',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /transactions/:id
 * Get a single transaction by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await getTransactionById(id);

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
      });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      error: 'Failed to fetch transaction',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /transactions/:id
 * Delete a transaction by ID
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transaction = await deleteTransaction(id);

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
      });
    }

    res.json({
      message: 'Transaction deleted successfully',
      transaction,
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      error: 'Failed to delete transaction',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
