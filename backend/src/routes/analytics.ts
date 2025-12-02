import { Router, Request, Response } from 'express';
import { getSpendingTrends, getCategoryTimeTrends } from '../services/analyticsService';

const router = Router();

/**
 * GET /analytics/trends
 * Get spending trends and analytics
 * Query params:
 *   - category (optional): Filter by category
 *   - period (optional): Period in months (1, 3, 6, 12) or 'all' (default: 3)
 *   - userId (optional): User ID (defaults to USER_ID_FOR_SMS env var)
 */
router.get('/trends', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || process.env.USER_ID_FOR_SMS || 'demo-user';
    const category = req.query.category as string | undefined;
    
    // Parse period
    let period: number | 'all' = 3; // Default 3 months
    const periodParam = req.query.period as string;
    
    if (periodParam) {
      if (periodParam.toLowerCase() === 'all') {
        period = 'all';
      } else {
        const periodNum = parseInt(periodParam);
        if (!isNaN(periodNum) && periodNum > 0) {
          period = periodNum;
        }
      }
    }

    // Get spending trends
    const analytics = await getSpendingTrends(userId, period, category);

    // Normalize amounts in response
    const normalizedAnalytics = {
      ...analytics,
      categoryTrends: analytics.categoryTrends.map((trend) => ({
        ...trend,
        total: typeof trend.total === 'string' ? parseFloat(trend.total) : trend.total,
        average: typeof trend.average === 'string' ? parseFloat(trend.average) : trend.average,
      })),
      averageSpendingPerCategory: Object.fromEntries(
        Object.entries(analytics.averageSpendingPerCategory).map(([cat, avg]) => [
          cat,
          typeof avg === 'string' ? parseFloat(avg) : avg,
        ])
      ),
      peakSpendingDays: analytics.peakSpendingDays.map((peak) => ({
        ...peak,
        total: typeof peak.total === 'string' ? parseFloat(peak.total) : peak.total,
        averageTransaction: typeof peak.averageTransaction === 'string' 
          ? parseFloat(peak.averageTransaction) 
          : peak.averageTransaction,
      })),
      peakSpendingHours: analytics.peakSpendingHours.map((peak) => ({
        ...peak,
        total: typeof peak.total === 'string' ? parseFloat(peak.total) : peak.total,
        averageTransaction: typeof peak.averageTransaction === 'string' 
          ? parseFloat(peak.averageTransaction) 
          : peak.averageTransaction,
      })),
      totalSpending: typeof analytics.totalSpending === 'string' 
        ? parseFloat(analytics.totalSpending) 
        : analytics.totalSpending,
    };

    res.json({
      userId,
      category: category || 'all',
      period: typeof period === 'number' ? `${period} months` : 'all',
      analytics: normalizedAnalytics,
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate spending trends',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /analytics/category-trends
 * Get time-based trends for a specific category
 * Query params:
 *   - category (required): Category name
 *   - period (optional): Period in months (1, 3, 6, 12) or 'all' (default: 3)
 *   - userId (optional): User ID
 */
router.get('/category-trends', async (req: Request, res: Response) => {
  try {
    const { category, period: periodParam, userId: userIdParam } = req.query;

    if (!category) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'category query parameter is required',
        example: '/analytics/category-trends?category=Food&period=3',
      });
    }

    const userId = (userIdParam as string) || process.env.USER_ID_FOR_SMS || 'demo-user';
    
    // Parse period
    let period: number | 'all' = 3;
    if (periodParam) {
      if (periodParam.toString().toLowerCase() === 'all') {
        period = 'all';
      } else {
        const periodNum = parseInt(periodParam.toString());
        if (!isNaN(periodNum) && periodNum > 0) {
          period = periodNum;
        }
      }
    }

    const trends = await getCategoryTimeTrends(userId, category as string, period);

    // Normalize amounts
    const normalizedTrends = trends.map((trend) => ({
      ...trend,
      total: typeof trend.total === 'string' ? parseFloat(trend.total) : trend.total,
      categories: Object.fromEntries(
        Object.entries(trend.categories).map(([cat, amt]) => [
          cat,
          typeof amt === 'string' ? parseFloat(amt) : amt,
        ])
      ),
    }));

    res.json({
      userId,
      category: category as string,
      period: typeof period === 'number' ? `${period} months` : 'all',
      trends: normalizedTrends,
    });
  } catch (error) {
    console.error('Error generating category trends:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate category trends',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

