import pool from '../db/pool';
import { Transaction, WeeklySummary } from '../types/transaction';
import { runAgent } from './googleAdkClient';

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
 * Generate insights from summary using AI with rule-based fallback
 * @param summary - Weekly summary
 * @returns Array of insight strings
 */
export async function generateInsights(summary: WeeklySummary): Promise<string[]> {
  // Try AI-powered insights first
  try {
    const input = {
      total: summary.total,
      byCategory: summary.byCategory,
      topTransactions: summary.topTransactions.map((tx) => ({
        description: tx.description,
        amount: parseFloat(tx.amount.toString()),
        category: tx.category,
        date: tx.date instanceof Date ? tx.date.toISOString() : tx.date,
      })),
    };

    const result = await runAgent('insights-agent', input);

    // Handle different response formats
    let insights: string[] = [];

    if (result && typeof result === 'object' && result.insights) {
      insights = Array.isArray(result.insights) ? result.insights : [result.insights];
    } else if (Array.isArray(result)) {
      insights = result;
    } else if (typeof result === 'string') {
      insights = [result];
    }

    // Validate and filter insights
    if (insights.length > 0 && insights.every((insight) => typeof insight === 'string' && insight.trim().length > 0)) {
      console.log(`✅ AI-generated ${insights.length} insights`);
      return insights.slice(0, 5); // Return up to 5 insights
    } else {
      console.warn('AI returned invalid insights, falling back to rules');
      return generateRuleBasedInsights(summary);
    }
  } catch (error) {
    // AI failed, use rule-based fallback
    if (error instanceof Error && error.message.includes('not configured')) {
      console.debug('AI not configured, using rule-based insights');
    } else {
      console.warn('AI insights generation failed, falling back to rules:', error instanceof Error ? error.message : error);
    }
    return generateRuleBasedInsights(summary);
  }
}

/**
 * Generate rule-based insights (fallback)
 * @param summary - Weekly summary
 * @returns Array of insight strings
 */
function generateRuleBasedInsights(summary: WeeklySummary): string[] {
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
