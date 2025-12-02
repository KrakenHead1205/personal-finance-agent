import { Router, Request, Response } from 'express';
import { parseSMSTransaction } from '../services/smsParserService';
import { createTransactionFromSMS } from '../services/transactionService';
import { SMSWebhookRequest } from '../types/transaction';

const router = Router();

/**
 * Middleware to validate API key for SMS webhook
 */
function validateWebhookKey(req: Request, res: Response, next: Function) {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.SMS_WEBHOOK_KEY;

  // Check if webhook is enabled
  if (process.env.SMS_WEBHOOK_ENABLED !== 'true') {
    return res.status(503).json({
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
    const parsed = parseSMSTransaction(text, sender);

    if (!parsed) {
      return res.status(200).json({
        success: false,
        message: 'SMS does not contain valid transaction information',
        reason: 'Not a transaction SMS or unable to parse',
      });
    }

    // Create transaction in database
    // Use a default user_id for now (can be configured or extracted from sender)
    const userId = process.env.DEFAULT_USER_ID || 'sms-user';
    
    const transaction = await createTransactionFromSMS(parsed, userId);

    res.status(201).json({
      success: true,
      message: 'Transaction created from SMS',
      transaction,
      parsed: {
        amount: parsed.amount,
        merchant: parsed.merchant,
        type: parsed.type,
        channel: parsed.channel,
        bank: parsed.bank,
      },
    });
  } catch (error) {
    console.error('Error processing SMS webhook:', error);
    res.status(500).json({
      error: 'Failed to process SMS',
      details: error instanceof Error ? error.message : 'Unknown error',
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

