import { ParsedTransaction } from '../types/transaction';

/**
 * SMS Parser Service
 * Parses Indian bank SMS notifications for UPI and card transactions
 */

/**
 * Detect transaction type from SMS text
 */
export function detectTransactionType(
  smsText: string
): 'UPI' | 'CARD' | 'ATM' | 'NETBANKING' | 'OTHER' {
  const lowerText = smsText.toLowerCase();

  if (lowerText.includes('upi') || lowerText.includes('paytm') || lowerText.includes('gpay') || lowerText.includes('cred') || lowerText.includes('phonepe')) {
    return 'UPI';
  }
  if (lowerText.includes('card') || lowerText.includes('pos')) {
    return 'CARD';
  }
  if (lowerText.includes('atm')) {
    return 'ATM';
  }
  if (lowerText.includes('netbanking') || lowerText.includes('neft') || lowerText.includes('imps')) {
    return 'NETBANKING';
  }

  return 'OTHER';
}

/**
 * Extract amount from SMS text
 * Handles Indian number format with commas (e.g., Rs.1,500.00 or INR 1,500.00)
 */
export function extractAmount(smsText: string): number | null {
  // Try multiple patterns for Indian currency formats
  const patterns = [
    /(?:rs\.?|inr)\s*([0-9,]+\.?\d*)/i,
    /(?:debited|credited|spent|paid|received)\s+(?:rs\.?|inr)?\s*([0-9,]+\.?\d*)/i,
    /(?:amount|amt)[:.\s]+(?:rs\.?|inr)?\s*([0-9,]+\.?\d*)/i,
  ];

  for (const pattern of patterns) {
    const match = smsText.match(pattern);
    if (match && match[1]) {
      // Remove commas and parse as float
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }

  return null;
}

/**
 * Extract merchant/description from SMS text
 */
export function extractMerchant(smsText: string): string {
  const lowerText = smsText.toLowerCase();

  // Try to extract merchant name from common patterns
  const patterns = [
    /trf\s+to\s+([A-Z][A-Z0-9\s]+?)(?:\s+Refno|\s+on|\s+dated|\.|$)/i,  // Credit card payments: "trf to American Express"
    /withdrawn\s+at\s+([A-Z][A-Z0-9\s]+?)(?:\s+ATM|\s+from|\s+on|\.|$)/i,  // ATM withdrawals: "withdrawn at ICI ATM"
    /(?:at|to|for)\s+([A-Z][A-Z0-9\s]+?)(?:\s+on|\s+dated|\.|$)/,
    /upi\/\d+\/([A-Z@]+)/i,
    /paid to\s+([A-Z][A-Z0-9\s]+)/i,
    /merchant\s+([A-Z][A-Z0-9\s]+)/i,
  ];

  for (const pattern of patterns) {
    const match = smsText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback: try to get some context from the middle of the message
  const words = smsText.split(/\s+/).filter(w => w.length > 3);
  if (words.length > 3) {
    return words.slice(3, 6).join(' ');
  }

  return 'Transaction';
}

/**
 * Extract date from SMS text
 * Handles formats: DD-MMM-YY, DD/MM/YYYY, DD-MM-YYYY
 */
export function extractDate(smsText: string): Date {
  // Try DD-MMM-YY format (e.g., 02-Dec-24)
  const ddMmmYyMatch = smsText.match(/(\d{1,2})-([A-Za-z]{3})-(\d{2})/);
  if (ddMmmYyMatch) {
    const [, day, month, year] = ddMmmYyMatch;
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIndex = monthNames.indexOf(month.toLowerCase());
    if (monthIndex !== -1) {
      const fullYear = 2000 + parseInt(year);
      return new Date(fullYear, monthIndex, parseInt(day));
    }
  }

  // Try DD/MM/YYYY or DD-MM-YYYY format
  const ddMmYyyyMatch = smsText.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (ddMmYyyyMatch) {
    const [, day, month, year] = ddMmYyyyMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Fallback to current date
  return new Date();
}

/**
 * Detect bank name from SMS sender or content
 */
export function detectBank(smsText: string, sender?: string): string | undefined {
  const lowerText = (smsText + ' ' + (sender || '')).toLowerCase();

  const banks = ['hdfc', 'icici', 'sbi', 'axis', 'kotak', 'idfc', 'paytm', 'phonepe', 'cred'];
  
  for (const bank of banks) {
    if (lowerText.includes(bank)) {
      return bank.toUpperCase();
    }
  }

  return undefined;
}

/**
 * Determine if transaction is debit or credit
 */
export function determineTransactionDirection(smsText: string): 'DEBIT' | 'CREDIT' {
  const lowerText = smsText.toLowerCase();

  const creditKeywords = ['credited', 'received', 'refund', 'cashback'];
  const debitKeywords = ['debited', 'spent', 'paid', 'withdrawn', 'purchase'];

  for (const keyword of creditKeywords) {
    if (lowerText.includes(keyword)) {
      return 'CREDIT';
    }
  }

  for (const keyword of debitKeywords) {
    if (lowerText.includes(keyword)) {
      return 'DEBIT';
    }
  }

  // Default to debit (most common for expense tracking)
  return 'DEBIT';
}

/**
 * Check if SMS is a valid transaction message (filter out OTP, balance checks, etc.)
 */
export function isTransactionSMS(smsText: string): boolean {
  const lowerText = smsText.toLowerCase();

  // Strong OTP indicators - if these are present, it's definitely an OTP message
  const strongOtpIndicators = [
    'one-time password',
    'one time password',
    'safekey',
    'valid for',
    'do not disclose',
    'do not share',
    'please do not share',
    'verification code',
    'authentication code',
    'transaction code',
    'secret otp',
    'otp valid for',
    'otp for txn',
  ];

  for (const indicator of strongOtpIndicators) {
    if (lowerText.includes(indicator)) {
      return false; // Definitely an OTP, not a transaction
    }
  }

  // Filter out non-transaction SMS (with weaker checks)
  const nonTransactionKeywords = [
    'otp',
    'balance enquiry',
    'avl bal:',
    'available balance',
    'mini statement',
    'promotional',
    'offer',
    'alert',
  ];

  for (const keyword of nonTransactionKeywords) {
    // If keyword is present and no transaction happened (no debited/credited), it's not a transaction
    if (lowerText.includes(keyword) && !lowerText.includes('debited') && !lowerText.includes('credited')) {
      return false;
    }
  }

  // Check for OTP pattern: "is 010908", "is 123456", or "574652 is" (4-8 digit code)
  const otpCodePattern = /\b\d{4,8}\s+(?:is\s+)?(?:secret\s+)?otp\b|\b(?:is|for)\s+\d{4,8}\b/i;
  if (otpCodePattern.test(smsText) && (lowerText.includes('otp') || lowerText.includes('password') || lowerText.includes('code') || lowerText.includes('secret'))) {
    return false; // Has OTP code pattern, likely an OTP message
  }
  
  // Check for "SECRET OTP for txn" pattern (Axis Bank format)
  if (lowerText.includes('secret otp') && lowerText.includes('for txn')) {
    return false; // Axis Bank OTP format
  }

  // Must have amount indicator
  const hasAmount = /(?:rs\.?|inr)\s*[0-9,]+/i.test(smsText);
  
  // Must have transaction indicator (actual transaction keywords)
  const hasTransactionKeyword = /(debited|credited|spent|paid|received|withdrawn|purchase|trf\s+to)/i.test(smsText);

  // Both amount and transaction keyword must be present
  return hasAmount && hasTransactionKeyword;
}

/**
 * Main parser function - parses SMS text into structured transaction data
 */
export function parseSMSTransaction(
  smsText: string,
  sender?: string
): ParsedTransaction | null {
  // Check if it's a valid transaction SMS
  if (!isTransactionSMS(smsText)) {
    return null;
  }

  const amount = extractAmount(smsText);
  if (!amount) {
    return null;
  }

  const merchant = extractMerchant(smsText);
  const date = extractDate(smsText);
  const type = determineTransactionDirection(smsText);
  const channel = detectTransactionType(smsText);
  const bank = detectBank(smsText, sender);

  return {
    rawText: smsText,
    amount,
    merchant,
    date,
    type,
    channel,
    bank,
    meta: {
      sender,
      parsedAt: new Date().toISOString(),
    },
  };
}

