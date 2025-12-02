import { Router, Request, Response } from 'express';
import prisma from '../db/prisma';
import { categorizeTransaction } from '../services/categorizationService';
import { CreateTransactionInput } from '../types/transaction';

const router = Router();

/**
 * POST /transactions
 * Create a new transaction
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, amount, description, category, source, date }: CreateTransactionInput = req.body;

    // Validate required fields
    if (!userId || !amount || !description || !source || !date) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userId', 'amount', 'description', 'source', 'date'],
      });
    }

    // Validate amount is a number
    if (typeof amount !== 'number' || isNaN(amount)) {
      return res.status(400).json({
        error: 'Amount must be a valid number',
      });
    }

    // Auto-categorize if category is not provided (now async with ADK integration)
    const finalCategory = category || await categorizeTransaction(description);

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        description,
        category: finalCategory,
        source,
        date: new Date(date),
      },
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
 * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD), userId
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { from, to, userId } = req.query;

    // Build where clause
    const where: any = {};

    if (userId) {
      where.userId = userId as string;
    }

    if (from || to) {
      where.date = {};
      if (from) {
        where.date.gte = new Date(from as string);
      }
      if (to) {
        where.date.lte = new Date(to as string);
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
    });

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

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

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

    const transaction = await prisma.transaction.delete({
      where: { id },
    });

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

