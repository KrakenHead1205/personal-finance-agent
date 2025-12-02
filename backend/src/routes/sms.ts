import { Router, Request, Response } from 'express';
import { parseSMSTransaction } from '../services/smsParserService';
import { createTransactionFromSMS } from '../services/transactionService';
import { SMSWebhookRequest, ParsedTransaction } from '../types/transaction';

const router = Router();

/**
 * Rate limiting storage (in-memory)
 * Maps API key to { count, windowStart }
 */
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Rate limiting: 100 requests per hour per API key
 */
function checkRateLimit(apiKey: string): boolean {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  const maxRequests = 100;

  const entry = rateLimitMap.get(apiKey);

  if (!entry) {
    // First request for this API key
    rateLimitMap.set(apiKey, { count: 1, windowStart: now });
    return true;
  }

  // Check if window has expired (more than 1 hour passed)
  if (now - entry.windowStart >= oneHour) {
    // Reset window
    rateLimitMap.set(apiKey, { count: 1, windowStart: now });
    return true;
  }

  // Check if limit exceeded
  if (entry.count >= maxRequests) {
    return false;
  }

  // Increment count
  entry.count++;
  return true;
}

/**
 * Middleware to validate API key and check rate limit for SMS webhook
 */
function validateWebhookKey(req: Request, res: Response, next: Function) {
  const apiKey = req.headers['x-api-key'] as string;
  const expectedKey = process.env.SMS_WEBHOOK_KEY;

  // Check feature flag
  if (process.env.SMS_WEBHOOK_ENABLED !== 'true') {
    return res.status(403).json({
      error: 'SMS webhook is disabled',
      message: 'Set SMS_WEBHOOK_ENABLED=true in .env to enable',
    });
  }

  // Check if API key is configured
  if (!expectedKey) {
    console.error('SMS_WEBHOOK_KEY not configured in environment');
    return res.status(500).json({
      error: 'Webhook not configured',
      message: 'Contact administrator',
    });
  }

  // Validate API key
  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing X-API-Key header',
    });
  }

  // Check rate limit
  if (!checkRateLimit(apiKey)) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Maximum 100 requests per hour allowed',
    });
  }

  next();
}

/**
 * POST /sms/webhook
 * Receive and parse SMS transaction notifications
 */
router.post('/webhook', validateWebhookKey, async (req: Request, res: Response) => {
  try {
    const { text, receivedAt, sender }: SMSWebhookRequest = req.body;

    // Validate required fields
    if (!text) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'SMS text is required',
      });
    }

    // Parse SMS
    const parsed: ParsedTransaction | null = parseSMSTransaction(text, sender);

    if (!parsed) {
      return res.status(200).json({
        success: false,
        reason: 'Not a transaction SMS',
      });
    }

    // Get user ID from environment or use default
    const userId = process.env.USER_ID_FOR_SMS || 'demo-user';

    // Create transaction in database (awaits full pipeline: parse → categorize → insert)
    const transaction = await createTransactionFromSMS(parsed, userId);

    // Return success response
    res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('Error processing SMS webhook:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }

    // Return generic error response
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /sms/test
 * Test endpoint to verify webhook configuration
 */
router.get('/test', validateWebhookKey, (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'SMS webhook is configured correctly',
    enabled: process.env.SMS_WEBHOOK_ENABLED === 'true',
  });
});

/**
 * POST /sms/parse
 * Test SMS parsing without creating transaction (for debugging)
 */
router.post('/parse', validateWebhookKey, (req: Request, res: Response) => {
  try {
    const { text, sender } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'SMS text is required',
      });
    }

    const parsed = parseSMSTransaction(text, sender);

    res.json({
      parsed,
      isValid: parsed !== null,
    });
  } catch (error) {
    console.error('Error parsing SMS:', error);
    res.status(500).json({
      error: 'Failed to parse SMS',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

