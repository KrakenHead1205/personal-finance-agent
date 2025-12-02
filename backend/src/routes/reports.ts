import { Router, Request, Response } from 'express';
import { generateWeeklySummary, generateInsights } from '../services/summaryService';
import { detectRecurringTransactions } from '../services/recurringTransactionService';
import { findDuplicateGroups } from '../services/duplicateDetectionService';

const router = Router();

/**
 * GET /reports/weekly?weekStart=YYYY-MM-DD
 * Generate a weekly summary report
 */
router.get('/weekly', async (req: Request, res: Response) => {
  try {
    const { weekStart } = req.query;

    // Validate that weekStart is provided
    if (!weekStart) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'weekStart query parameter is required (format: YYYY-MM-DD)',
        example: '/reports/weekly?weekStart=2024-12-01',
      });
    }

    // Validate that weekStart is a string
    if (typeof weekStart !== 'string') {
      return res.status(400).json({
        error: 'Invalid parameter type',
        message: 'weekStart must be a string in YYYY-MM-DD format',
      });
    }

    // Validate that weekStart is a valid date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(weekStart)) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'weekStart must be in YYYY-MM-DD format',
        received: weekStart,
      });
    }

    const parsedDate = new Date(weekStart);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date',
        message: 'weekStart must be a valid date',
        received: weekStart,
      });
    }

    // Call the summary service
    const summary = await generateWeeklySummary(weekStart);

    // Normalize amounts in topTransactions (PostgreSQL NUMERIC returns as string)
    const normalizedTopTransactions = summary.topTransactions.map((tx) => ({
      ...tx,
      amount: typeof tx.amount === 'string' ? parseFloat(tx.amount) : Number(tx.amount),
      date: tx.date instanceof Date ? tx.date.toISOString() : tx.date,
      created_at: tx.created_at instanceof Date ? tx.created_at.toISOString() : tx.created_at,
    }));

    const normalizedSummary = {
      ...summary,
      topTransactions: normalizedTopTransactions,
    };

    // Generate insights from the summary (now AI-powered)
    const insights = await generateInsights(normalizedSummary);

    // Calculate weekEnd
    const weekEnd = new Date(parsedDate);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Get user ID for recurring transaction detection
    const userId = (req.query.userId as string) || process.env.USER_ID_FOR_SMS || 'demo-user';

    // Detect recurring transactions (for context in insights)
    const recurringTransactions = await detectRecurringTransactions(userId, 90);

    // Return the result
    res.json({
      weekStart,
      weekEnd: weekEnd.toISOString().split('T')[0],
      summary: normalizedSummary,
      insights,
      recurringTransactions: recurringTransactions.slice(0, 5), // Top 5 recurring
    });
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate weekly summary',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /reports/duplicates?userId=xxx&days=30
 * Find duplicate transactions
 */
router.get('/duplicates', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || process.env.USER_ID_FOR_SMS || 'demo-user';
    const days = parseInt(req.query.days as string) || 30;

    const duplicateGroups = await findDuplicateGroups(userId, days);

    res.json({
      userId,
      lookbackDays: days,
      duplicateGroups,
      totalGroups: duplicateGroups.length,
    });
  } catch (error) {
    console.error('Error finding duplicates:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to find duplicate transactions',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /reports/recurring?userId=xxx&days=90
 * Detect recurring transactions
 */
router.get('/recurring', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || process.env.USER_ID_FOR_SMS || 'demo-user';
    const days = parseInt(req.query.days as string) || 90;

    const recurringTransactions = await detectRecurringTransactions(userId, days);

    res.json({
      userId,
      lookbackDays: days,
      recurringTransactions,
      totalPatterns: recurringTransactions.length,
    });
  } catch (error) {
    console.error('Error detecting recurring transactions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to detect recurring transactions',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
