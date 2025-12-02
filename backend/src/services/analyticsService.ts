import pool from '../db/pool';
import { Transaction } from '../types/transaction';

/**
 * Analytics Service
 * Provides spending trends, averages, and peak spending analysis
 */

export interface CategoryTrend {
  category: string;
  total: number;
  average: number;
  transactionCount: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentageChange: number;
}

export interface TimeBasedTrend {
  period: string; // e.g., "2024-12", "2024-W48", "Monday"
  total: number;
  transactionCount: number;
  categories: Record<string, number>;
}

export interface PeakSpending {
  dayOfWeek: string;
  hourOfDay: number;
  total: number;
  transactionCount: number;
  averageTransaction: number;
}

export interface AnalyticsResult {
  categoryTrends: CategoryTrend[];
  averageSpendingPerCategory: Record<string, number>;
  peakSpendingDays: PeakSpending[];
  peakSpendingHours: PeakSpending[];
  totalSpending: number;
  totalTransactions: number;
  period: {
    start: string;
    end: string;
  };
}

/**
 * Calculate spending trends for a given period
 * @param userId - User ID
 * @param period - Period in months (1, 3, 6, 12) or 'all'
 * @param category - Optional category filter
 * @returns Analytics result with trends
 */
export async function getSpendingTrends(
  userId: string,
  period: number | 'all' = 3,
  category?: string
): Promise<AnalyticsResult> {
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();

  if (period === 'all') {
    // Get all transactions
    startDate.setFullYear(2020, 0, 1); // Arbitrary old date
  } else {
    startDate.setMonth(endDate.getMonth() - period);
  }

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  // Build query
  let query = `
    SELECT * FROM transactions
    WHERE user_id = $1
      AND date >= $2
      AND date <= $3
  `;

  const values: any[] = [userId, startStr, endStr];

  if (category) {
    query += ` AND category = $4`;
    values.push(category);
  }

  query += ` ORDER BY date ASC`;

  const result = await pool.query(query, values);
  const transactions: Transaction[] = result.rows;

  // Calculate category trends
  const categoryTrends = calculateCategoryTrends(transactions, startDate, endDate);

  // Calculate average spending per category
  const averageSpendingPerCategory = calculateAverageSpendingPerCategory(transactions);

  // Calculate peak spending days and hours
  const peakSpendingDays = calculatePeakSpendingDays(transactions);
  const peakSpendingHours = calculatePeakSpendingHours(transactions);

  // Calculate totals
  const totalSpending = transactions.reduce(
    (sum, tx) => sum + parseFloat(tx.amount.toString()),
    0
  );

  return {
    categoryTrends,
    averageSpendingPerCategory,
    peakSpendingDays,
    peakSpendingHours,
    totalSpending,
    totalTransactions: transactions.length,
    period: {
      start: startStr,
      end: endStr,
    },
  };
}

/**
 * Calculate category trends with percentage change
 */
function calculateCategoryTrends(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): CategoryTrend[] {
  // Group by category
  const categoryMap = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    if (!categoryMap.has(tx.category)) {
      categoryMap.set(tx.category, []);
    }
    categoryMap.get(tx.category)!.push(tx);
  }

  // Split into two halves to calculate trend
  const midDate = new Date(
    startDate.getTime() + (endDate.getTime() - startDate.getTime()) / 2
  );

  const trends: CategoryTrend[] = [];

  for (const [category, txs] of categoryMap.entries()) {
    const total = txs.reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);
    const average = total / txs.length;
    const transactionCount = txs.length;

    // Split into first half and second half
    const firstHalf = txs.filter((tx) => {
      const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
      return txDate < midDate;
    });
    const secondHalf = txs.filter((tx) => {
      const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
      return txDate >= midDate;
    });

    const firstHalfTotal = firstHalf.reduce(
      (sum, tx) => sum + parseFloat(tx.amount.toString()),
      0
    );
    const secondHalfTotal = secondHalf.reduce(
      (sum, tx) => sum + parseFloat(tx.amount.toString()),
      0
    );

    // Calculate percentage change
    let percentageChange = 0;
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';

    if (firstHalfTotal > 0) {
      percentageChange = ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100;
      if (percentageChange > 5) {
        trend = 'increasing';
      } else if (percentageChange < -5) {
        trend = 'decreasing';
      }
    } else if (secondHalfTotal > 0) {
      percentageChange = 100; // New category
      trend = 'increasing';
    }

    trends.push({
      category,
      total,
      average,
      transactionCount,
      trend,
      percentageChange: Math.round(percentageChange * 100) / 100,
    });
  }

  // Sort by total descending
  return trends.sort((a, b) => b.total - a.total);
}

/**
 * Calculate average spending per category
 */
function calculateAverageSpendingPerCategory(
  transactions: Transaction[]
): Record<string, number> {
  const categoryMap = new Map<string, number[]>();

  for (const tx of transactions) {
    if (!categoryMap.has(tx.category)) {
      categoryMap.set(tx.category, []);
    }
    categoryMap.get(tx.category)!.push(parseFloat(tx.amount.toString()));
  }

  const averages: Record<string, number> = {};

  for (const [category, amounts] of categoryMap.entries()) {
    const sum = amounts.reduce((a, b) => a + b, 0);
    averages[category] = Math.round((sum / amounts.length) * 100) / 100;
  }

  return averages;
}

/**
 * Calculate peak spending days of the week
 */
function calculatePeakSpendingDays(transactions: Transaction[]): PeakSpending[] {
  const dayMap = new Map<string, { total: number; count: number }>();

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (const tx of transactions) {
    const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
    const dayName = dayNames[txDate.getDay()];
    const amount = parseFloat(tx.amount.toString());

    if (!dayMap.has(dayName)) {
      dayMap.set(dayName, { total: 0, count: 0 });
    }

    const dayData = dayMap.get(dayName)!;
    dayData.total += amount;
    dayData.count += 1;
  }

  const peaks: PeakSpending[] = [];

  for (const [dayName, data] of dayMap.entries()) {
    peaks.push({
      dayOfWeek: dayName,
      hourOfDay: 0, // Not applicable for day analysis
      total: Math.round(data.total * 100) / 100,
      transactionCount: data.count,
      averageTransaction: Math.round((data.total / data.count) * 100) / 100,
    });
  }

  // Sort by total descending
  return peaks.sort((a, b) => b.total - a.total);
}

/**
 * Calculate peak spending hours of the day
 */
function calculatePeakSpendingHours(transactions: Transaction[]): PeakSpending[] {
  const hourMap = new Map<number, { total: number; count: number }>();

  for (const tx of transactions) {
    // Use created_at if available, otherwise use date
    const txDate = tx.created_at
      ? tx.created_at instanceof Date
        ? tx.created_at
        : new Date(tx.created_at)
      : tx.date instanceof Date
      ? tx.date
      : new Date(tx.date);

    const hour = txDate.getHours();
    const amount = parseFloat(tx.amount.toString());

    if (!hourMap.has(hour)) {
      hourMap.set(hour, { total: 0, count: 0 });
    }

    const hourData = hourMap.get(hour)!;
    hourData.total += amount;
    hourData.count += 1;
  }

  const peaks: PeakSpending[] = [];

  for (const [hour, data] of hourMap.entries()) {
    peaks.push({
      dayOfWeek: '', // Not applicable for hour analysis
      hourOfDay: hour,
      total: Math.round(data.total * 100) / 100,
      transactionCount: data.count,
      averageTransaction: Math.round((data.total / data.count) * 100) / 100,
    });
  }

  // Sort by total descending
  return peaks.sort((a, b) => b.total - a.total);
}

/**
 * Get category-wise spending over time periods
 * @param userId - User ID
 * @param category - Category name
 * @param period - Period in months
 * @returns Time-based trends
 */
export async function getCategoryTimeTrends(
  userId: string,
  category: string,
  period: number | 'all' = 3
): Promise<TimeBasedTrend[]> {
  const endDate = new Date();
  const startDate = new Date();

  if (period === 'all') {
    startDate.setFullYear(2020, 0, 1);
  } else {
    startDate.setMonth(endDate.getMonth() - period);
  }

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const query = `
    SELECT * FROM transactions
    WHERE user_id = $1
      AND category = $2
      AND date >= $3
      AND date <= $4
    ORDER BY date ASC
  `;

  const result = await pool.query(query, [userId, category, startStr, endStr]);
  const transactions: Transaction[] = result.rows;

  // Group by month
  const monthMap = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
    const month = txDate.getMonth() + 1;
    const monthKey = `${txDate.getFullYear()}-${month < 10 ? '0' : ''}${month}`;

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, []);
    }
    monthMap.get(monthKey)!.push(tx);
  }

  const trends: TimeBasedTrend[] = [];

  for (const [period, txs] of monthMap.entries()) {
    const total = txs.reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);
    const categories: Record<string, number> = {};
    categories[category] = total;

    trends.push({
      period,
      total,
      transactionCount: txs.length,
      categories,
    });
  }

  return trends.sort((a, b) => a.period.localeCompare(b.period));
}

