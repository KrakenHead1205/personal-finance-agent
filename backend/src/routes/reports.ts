import { Router, Request, Response } from 'express';
import { generateWeeklySummary, generateInsights } from '../services/summaryService';

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

    // Generate insights from the summary (now async with ADK integration)
    const insights = await generateInsights(summary);

    // Return the result
    res.json({
      weekStart,
      weekEnd: new Date(new Date(weekStart).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      summary,
      insights,
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

export default router;

