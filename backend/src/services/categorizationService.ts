/**
 * Categorization service with AI-powered categorization (Google ADK)
 * Falls back to rule-based categorization if ADK is unavailable
 */

import { runAgent } from './googleAdkClient';

const categoryRules: Record<string, string[]> = {
  Food: ['swiggy', 'zomato', 'restaurant', 'food', 'cafe', 'pizza', 'burger', 'dominos', 'kfc', 'mcdonald'],
  Transport: ['uber', 'ola', 'ride', 'taxi', 'metro', 'bus', 'petrol', 'fuel'],
  Rent: ['rent', 'landlord', 'house rent'],
  Bills: ['electricity', 'mobile', 'wifi', 'internet', 'water', 'gas', 'phone bill', 'broadband'],
  Shopping: ['amazon', 'flipkart', 'myntra', 'ajio', 'shopping', 'mall', 'store'],
  Entertainment: ['netflix', 'prime', 'spotify', 'movie', 'cinema', 'theatre', 'hotstar'],
  Healthcare: ['hospital', 'doctor', 'medicine', 'pharmacy', 'medical', 'health'],
  Groceries: ['grocery', 'supermarket', 'market', 'vegetables', 'fruits'],
};

/**
 * Rule-based categorization fallback
 * @param description - Transaction description
 * @returns Category string
 */
function categorizeWithRules(description: string): string {
  const lowerDescription = description.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryRules)) {
    for (const keyword of keywords) {
      if (lowerDescription.includes(keyword)) {
        return category;
      }
    }
  }

  return 'Other';
}

/**
 * Normalize category string: trim and capitalize first letter
 * @param category - Raw category from ADK
 * @returns Normalized category
 */
function normalizeCategory(category: string): string {
  const trimmed = category.trim();
  if (!trimmed) return 'Other';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Categorize a transaction using Google ADK with rule-based fallback
 * @param description - Transaction description
 * @returns Category string
 */
export async function categorizeTransaction(description: string): Promise<string> {
  // Try AI-powered categorization first
  try {
    const result = await runAgent('categorization-agent', { description });

    // Check if result has a valid category
    if (result && result.category && typeof result.category === 'string') {
      const normalized = normalizeCategory(result.category);
      console.log(`✅ ADK categorization: "${description}" → ${normalized}`);
      return normalized;
    } else {
      console.warn('ADK returned invalid category format, falling back to rules');
      return categorizeWithRules(description);
    }
  } catch (error) {
    // Log the error and fall back to rule-based categorization
    if (error instanceof Error && error.message.includes('not configured')) {
      // ADK not configured - this is expected, don't spam logs
      console.debug('ADK not configured, using rule-based categorization');
    } else {
      console.warn('ADK categorization failed, falling back to rules:', error instanceof Error ? error.message : error);
    }
    
    return categorizeWithRules(description);
  }
}

