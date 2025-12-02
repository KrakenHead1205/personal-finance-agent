import { runAgent } from './googleAdkClient';

/**
 * Categorization service
 * Uses Google ADK for AI-powered categorization with rule-based fallback
 */

/**
 * Normalize category string: trim and capitalize first letter
 * @param category - Raw category string
 * @returns Normalized category (e.g., "food" -> "Food", "TRANSPORT" -> "Transport")
 */
function normalizeCategory(category: string): string {
  const trimmed = category.trim();
  if (!trimmed) return 'Other';
  
  // Capitalize first letter, lowercase the rest
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Rule-based categorization using keyword matching
 * @param description - Transaction description
 * @returns Category string
 */
export function ruleBasedCategorize(description: string): string {
  const lowerDescription = description.toLowerCase();

  // ATM Cash Withdrawals (must check early, before other patterns)
  if (
    lowerDescription.includes('withdrawn at') ||
    (lowerDescription.includes('withdrawn') && lowerDescription.includes('atm')) ||
    lowerDescription.includes('cash withdrawal') ||
    lowerDescription.includes('atm withdrawal')
  ) {
    return 'Cash';
  }

  // Credit Card Bill Payments (must check first, before other patterns)
  if (
    lowerDescription.includes('american express') ||
    lowerDescription.includes('amex') ||
    lowerDescription.includes('cred club') ||
    (lowerDescription.includes('cred') && (lowerDescription.includes('trf') || lowerDescription.includes('payment'))) ||
    lowerDescription.includes('credit card') ||
    lowerDescription.includes('card payment') ||
    lowerDescription.includes('card bill') ||
    (lowerDescription.includes('trf to') && (
      lowerDescription.includes('express') ||
      lowerDescription.includes('cred') ||
      lowerDescription.includes('card')
    ))
  ) {
    return 'Bills';
  }

  // Food keywords
  if (
    lowerDescription.includes('swiggy') ||
    lowerDescription.includes('zomato') ||
    lowerDescription.includes('restaurant') ||
    lowerDescription.includes('food')
  ) {
    return 'Food';
  }

  // Transport keywords
  if (
    lowerDescription.includes('uber') ||
    lowerDescription.includes('ola') ||
    lowerDescription.includes('rapido') ||
    lowerDescription.includes('taxi') ||
    lowerDescription.includes('cab')
  ) {
    return 'Transport';
  }

  // Rent keywords
  if (lowerDescription.includes('rent')) {
    return 'Rent';
  }

  // Bills keywords (utilities, etc.)
  if (
    lowerDescription.includes('electricity') ||
    lowerDescription.includes('wifi') ||
    lowerDescription.includes('broadband') ||
    lowerDescription.includes('mobile bill')
  ) {
    return 'Bills';
  }

  // Shopping keywords
  if (
    lowerDescription.includes('amazon') ||
    lowerDescription.includes('flipkart') ||
    lowerDescription.includes('myntra')
  ) {
    return 'Shopping';
  }

  // Default
  return 'Other';
}

/**
 * Categorize a transaction using Google ADK with rule-based fallback
 * @param description - Transaction description
 * @param context - Optional context (amount, channel, rawText)
 * @returns Category string
 */
export async function categorizeTransaction(
  description: string,
  context?: {
    amount?: number;
    channel?: string;
    rawText?: string;
  }
): Promise<string> {
  // Try ADK categorization first
  try {
    const input = {
      description,
      amount: context?.amount,
      channel: context?.channel,
      rawText: context?.rawText,
    };

    const result = await runAgent('categorization-agent', input);

    // Handle different response formats
    let category: string | null = null;

    if (typeof result === 'string') {
      // Plain string response
      category = result;
    } else if (result && typeof result === 'object') {
      // Object response: { category: "Food" }
      if (result.category && typeof result.category === 'string') {
        category = result.category;
      }
    }

    // Validate and normalize category
    if (category && category.trim().length > 0) {
      const normalized = normalizeCategory(category);
      console.log(`✅ ADK categorization: "${description}" → ${normalized}`);
      return normalized;
    } else {
      // Invalid response, fall back to rules
      console.warn('ADK returned invalid category, falling back to rules');
      const fallbackCategory = ruleBasedCategorize(description);
      return fallbackCategory;
    }
  } catch (error) {
    // ADK call failed, use rule-based fallback
    if (error instanceof Error && error.message.includes('not configured')) {
      // ADK not configured - this is expected, don't spam logs
      console.debug('ADK not configured, using rule-based categorization');
    } else {
      console.warn('ADK categorization failed, falling back to rules:', error instanceof Error ? error.message : error);
    }

    const fallbackCategory = ruleBasedCategorize(description);
    return fallbackCategory;
  }
}
