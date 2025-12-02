import { Transaction } from '@prisma/client';
import prisma from '../db/prisma';
import { WeeklySummary } from '../types/transaction';
import { runAgent } from './googleAdkClient';

/**
 * Generate a weekly summary of transactions
 * @param weekStart - Start date in YYYY-MM-DD format or ISO string
 * @returns Weekly summary with total, by category, and top 3 transactions
 */
export async function generateWeeklySummary(weekStart: string): Promise<WeeklySummary> {
  const startDate = new Date(weekStart);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  // Query all transactions for the week [weekStart, weekEnd)
  const transactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    orderBy: {
      amount: 'desc',
    },
  });

  // Calculate total: sum of all amounts
  const total = transactions.reduce((sum: number, transaction: Transaction) => sum + transaction.amount, 0);

  // Calculate by category: Record<string, number> mapping category → total amount
  const byCategory: Record<string, number> = {};
  for (const transaction of transactions) {
    if (!byCategory[transaction.category]) {
      byCategory[transaction.category] = 0;
    }
    byCategory[transaction.category] += transaction.amount;
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
 * Type definition for summary input to insights generation
 */
export type SummaryType = {
  total: number;
  byCategory: Record<string, number>;
  topTransactions: any[];
};

/**
 * Rule-based insight generation (fallback)
 * @param summary - The weekly summary object
 * @returns Array of 2-4 concise insight strings
 */
function generateInsightsWithRules(summary: SummaryType): string[] {
  const insights: string[] = [];

  // Insight 1: Check if a single category dominates (>50% of total)
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

  // Insight 2: Check if total spending is high
  const HIGH_SPENDING_THRESHOLD = 20000;
  if (summary.total > HIGH_SPENDING_THRESHOLD) {
    insights.push(
      `Your total spend is quite high this week at ₹${summary.total.toFixed(2)}, consider reducing discretionary expenses.`
    );
  } else if (summary.total > 0) {
    insights.push(
      `Your total spending this week is ₹${summary.total.toFixed(2)}.`
    );
  }

  // Insight 3: Biggest transaction
  if (summary.topTransactions.length > 0) {
    const biggestTransaction = summary.topTransactions[0];
    insights.push(
      `Your biggest transaction was ₹${biggestTransaction.amount.toFixed(2)} in ${biggestTransaction.category}.`
    );
  }

  // Insight 4: Number of categories insight
  const categoryCount = Object.keys(summary.byCategory).length;
  if (categoryCount >= 5) {
    insights.push(
      `You spent across ${categoryCount} different categories this week.`
    );
  }

  // Return 2-4 insights (prioritize the most important ones)
  return insights.slice(0, 4);
}

/**
 * Generate human-readable insights from a weekly summary using Google ADK
 * Falls back to rule-based insights if ADK is unavailable
 * @param summary - The weekly summary object
 * @returns Array of 2-4 concise insight strings
 */
export async function generateInsights(summary: SummaryType): Promise<string[]> {
  // Try AI-powered insights first
  try {
    const result = await runAgent('insights-agent', summary);

    // Validate that result has insights array
    if (result && Array.isArray(result.insights) && result.insights.length > 0) {
      // Validate that all insights are strings
      const validInsights = result.insights.filter(
        (insight: any) => typeof insight === 'string' && insight.trim().length > 0
      );

      if (validInsights.length > 0) {
        console.log(`✅ ADK insights generated: ${validInsights.length} insights`);
        return validInsights.slice(0, 4); // Return max 4 insights
      } else {
        console.warn('ADK returned insights in invalid format, falling back to rules');
        return generateInsightsWithRules(summary);
      }
    } else {
      console.warn('ADK returned no insights or invalid format, falling back to rules');
      return generateInsightsWithRules(summary);
    }
  } catch (error) {
    // Log the error and fall back to rule-based insights
    if (error instanceof Error && error.message.includes('not configured')) {
      // ADK not configured - this is expected, don't spam logs
      console.debug('ADK not configured, using rule-based insights');
    } else {
      console.warn('ADK insights generation failed, falling back to rules:', error instanceof Error ? error.message : error);
    }

    return generateInsightsWithRules(summary);
  }
}

/**
 * Generate a monthly summary of transactions
 * @param userId - User ID
 * @param year - Year
 * @param month - Month (1-12)
 */
export async function generateMonthlySummary(
  userId: string,
  year: number,
  month: number
): Promise<WeeklySummary> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    orderBy: {
      amount: 'desc',
    },
  });

  const total = transactions.reduce((sum: number, transaction: Transaction) => sum + transaction.amount, 0);

  const byCategory: Record<string, number> = {};
  for (const transaction of transactions) {
    if (!byCategory[transaction.category]) {
      byCategory[transaction.category] = 0;
    }
    byCategory[transaction.category] += transaction.amount;
  }

  const topTransactions = transactions.slice(0, 10);

  return {
    total,
    byCategory,
    topTransactions,
  };
}

