/**
 * Categorization service
 * Temporary rule-based categorization (will be replaced with AI)
 */

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
 * Categorize a transaction based on description
 * @param description - Transaction description
 * @returns Category string
 */
export async function categorizeTransaction(description: string): Promise<string> {
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
