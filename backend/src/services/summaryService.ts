import pool from '../db/pool';
import { Transaction, WeeklySummary } from '../types/transaction';

/**
 * Summary service
 * Generates financial summaries and insights
 */

/**
 * Generate a weekly summary of transactions
 * @param weekStart - Start date in YYYY-MM-DD format
 * @returns Weekly summary with total, by category, and top transactions
 */
export async function generateWeeklySummary(weekStart: string): Promise<WeeklySummary> {
  const startDate = new Date(weekStart);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  // Format dates for PostgreSQL
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  // Query all transactions for the week [weekStart, weekEnd)
  const query = `
    SELECT * FROM transactions
    WHERE date >= $1 AND date < $2
    ORDER BY amount DESC
  `;

  const result = await pool.query(query, [startStr, endStr]);
  const transactions: Transaction[] = result.rows;

  // Calculate total: sum of all amounts
  const total = transactions.reduce((sum, transaction) => sum + parseFloat(transaction.amount.toString()), 0);

  // Calculate by category: Record<string, number> mapping category → total amount
  const byCategory: Record<string, number> = {};
  for (const transaction of transactions) {
    const amount = parseFloat(transaction.amount.toString());
    if (!byCategory[transaction.category]) {
      byCategory[transaction.category] = 0;
    }
    byCategory[transaction.category] += amount;
  }

  // Get top 3 transactions with highest amounts
  const topTransactions = transactions.slice(0, 3);

  return {
    total,
    byCategory,
    topTransactions,
  };
}

/**
 * Generate a monthly summary of transactions
 * @param userId - User ID
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Monthly summary
 */
export async function generateMonthlySummary(
  userId: string,
  year: number,
  month: number
): Promise<WeeklySummary> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const query = `
    SELECT * FROM transactions
    WHERE user_id = $1
      AND date >= $2
      AND date < $3
    ORDER BY amount DESC
  `;

  const result = await pool.query(query, [userId, startDate, endDate]);
  const transactions: Transaction[] = result.rows;

  const total = transactions.reduce((sum, transaction) => sum + parseFloat(transaction.amount.toString()), 0);

  const byCategory: Record<string, number> = {};
  for (const transaction of transactions) {
    const amount = parseFloat(transaction.amount.toString());
    if (!byCategory[transaction.category]) {
      byCategory[transaction.category] = 0;
    }
    byCategory[transaction.category] += amount;
  }

  const topTransactions = transactions.slice(0, 10);

  return {
    total,
    byCategory,
    topTransactions,
  };
}

/**
 * Generate insights from summary (rule-based for now)
 * @param summary - Weekly summary
 * @returns Array of insight strings
 */
export async function generateInsights(summary: WeeklySummary): Promise<string[]> {
  const insights: string[] = [];

  // Insight 1: Highest spending category
  if (summary.total > 0) {
    const sortedCategories = Object.entries(summary.byCategory)
      .sort(([, amountA], [, amountB]) => amountB - amountA);

    if (sortedCategories.length > 0) {
      const [highestCategory, highestAmount] = sortedCategories[0];
      const percentage = ((highestAmount / summary.total) * 100).toFixed(1);

      if (highestAmount / summary.total > 0.5) {
        insights.push(
          `Your highest spending category is ${highestCategory} at ${percentage}% of total.`
        );
      } else {
        insights.push(
          `Your highest spending category is ${highestCategory} (${percentage}% of total).`
        );
      }
    }
  }

  // Insight 2: Total spending check
  const HIGH_SPENDING_THRESHOLD = 20000;
  if (summary.total > HIGH_SPENDING_THRESHOLD) {
    insights.push(
      `Your total spend is quite high this week at ₹${summary.total.toFixed(2)}, consider reducing discretionary expenses.`
    );
  } else if (summary.total > 0) {
    insights.push(`Your total spending this week is ₹${summary.total.toFixed(2)}.`);
  }

  // Insight 3: Biggest transaction
  if (summary.topTransactions.length > 0) {
    const biggestTransaction = summary.topTransactions[0];
    const amount = parseFloat(biggestTransaction.amount.toString());
    insights.push(
      `Your biggest transaction was ₹${amount.toFixed(2)} in ${biggestTransaction.category}.`
    );
  }

  // Insight 4: Category diversity
  const categoryCount = Object.keys(summary.byCategory).length;
  if (categoryCount >= 5) {
    insights.push(`You spent across ${categoryCount} different categories this week.`);
  }

  return insights.slice(0, 4);
}
