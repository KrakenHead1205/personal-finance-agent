# SMS Transaction Webhook - iOS Shortcuts Setup

## Overview

This guide explains how to set up iOS Shortcuts automation to automatically forward bank transaction SMS messages to your backend webhook. When you receive a transaction SMS (UPI, credit card, etc.), it will be automatically parsed and added to your finance tracking system via HTTP POST.

---

## Prerequisites

- **Running backend** with a publicly accessible URL:
  - Local development: Use [ngrok](https://ngrok.com/) to expose `http://localhost:4000`
  - Production: Deploy to Heroku, Railway, Render, or similar service
- **SMS_WEBHOOK_KEY** configured in `backend/.env`
- **iPhone** with iOS 13+ and the **Shortcuts** app installed
- **Bank SMS notifications** enabled on your phone

---

## Webhook Details

### Endpoint

```
POST https://<your-domain>/sms/webhook
```

### Headers

```
Content-Type: application/json
X-API-Key: <SMS_WEBHOOK_KEY>
```

### Request Body (JSON)

```json
{
  "text": "<full SMS body>",
  "receivedAt": "<ISO timestamp>",
  "sender": "<optional sender>"
}
```

### Response

**Success (200):**
```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "user_id": "demo-user",
    "amount": 500,
    "description": "SWIGGY",
    "category": "Food",
    "source": "UPI",
    "date": "2024-12-02T00:00:00.000Z"
  }
}
```

**Not a transaction (200):**
```json
{
  "success": false,
  "reason": "Not a transaction SMS"
}
```

**Error (401/403/429/500):**
```json
{
  "error": "Error message",
  "message": "Details"
}
```

---

## Step-by-Step Shortcut Setup

### Step 1: Create Personal Automation

1. Open **Shortcuts** app on iPhone
2. Tap **Automation** tab (bottom)
3. Tap **+** (top right) → **Create Personal Automation**
4. Select **Message** → **Any Message**
5. Optionally filter by **Sender** (add your bank's SMS sender IDs)
6. Tap **Next**

### Step 2: Configure Trigger

1. Enable **Run Immediately** (disable "Ask Before Running" for automatic processing)
2. Tap **Next**

### Step 3: Add Actions

Add the following actions in order:

#### Action 1: Get Message Text
- Search: **"Get Text from Input"**
- Input: **Shortcut Input** (the received message)

#### Action 2: Get Current Date
- Search: **"Get Current Date"**
- Format: **ISO 8601**

#### Action 3: Get Sender (Optional)
- Search: **"Get Details of Messages"**
- Get: **Sender**

#### Action 4: Make HTTP Request
- Search: **"Get Contents of URL"**
- Configure:
  - **URL**: `https://your-backend-url.com/sms/webhook`
  - **Method**: **POST**
  - **Headers**:
    - Add Header
    - Key: `Content-Type`
    - Value: `application/json`
    - Add Header
    - Key: `X-API-Key`
    - Value: `<paste your SMS_WEBHOOK_KEY here>`
  - **Request Body**: **JSON**
    - Add Field:
      - Key: `text`
      - Value: **Text** (from Action 1)
    - Add Field:
      - Key: `receivedAt`
      - Value: **Current Date** (from Action 2)
    - Add Field:
      - Key: `sender`
      - Value: **Sender** (from Action 3, or leave empty)

### Step 4: Save Automation

1. Tap **Done**
2. Automation is now active and will trigger on incoming SMS

---

## Testing

### Test 1: Send Test SMS

1. Send yourself a test SMS with transaction format:
   ```
   Rs.500.00 debited from A/c XX1234 for UPI/123456789012/PAYTM on 02-Dec-24
   ```

2. Check backend logs:
   ```bash
   # In your backend terminal, you should see:
   # Request received at /sms/webhook
   # Transaction created: { id: "...", amount: 500, ... }
   ```

3. Verify in database or dashboard:
   - Check `http://localhost:3000/dashboard`
   - Transaction should appear automatically

### Test 2: Check Backend Logs

If the request fails, check your backend terminal for error messages:

```bash
# Common log messages:
✅ "Transaction created from SMS"
❌ "Error processing SMS webhook: ..."
❌ "Rate limit exceeded"
❌ "Invalid or missing X-API-Key header"
```

### Test 3: Manual Webhook Test

Test the webhook directly with curl:

```bash
curl -X POST https://your-backend-url.com/sms/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-webhook-key" \
  -d '{
    "text": "Rs.500.00 debited from A/c XX1234 for UPI/123456789012/PAYTM on 02-Dec-24",
    "sender": "HDFC"
  }'
```

---

## Troubleshooting

### 401 Unauthorized

**Problem:** Invalid or missing API key

**Solutions:**
- Verify `X-API-Key` header in Shortcut matches `SMS_WEBHOOK_KEY` in `.env`
- Check for extra spaces or quotes in the key
- Restart backend after updating `.env`

### 403 Forbidden

**Problem:** SMS webhook is disabled

**Solutions:**
- Set `SMS_WEBHOOK_ENABLED=true` in `backend/.env`
- Restart backend server
- Verify with: `curl https://your-backend-url.com/sms/test -H "X-API-Key: your-key"`

### 429 Too Many Requests

**Problem:** Rate limit exceeded (100 requests/hour)

**Solutions:**
- Wait for the rate limit window to reset (1 hour)
- Reduce automation triggers (filter by specific senders)
- For production, consider increasing the limit in `backend/src/routes/sms.ts`

### 200 OK but `success: false`

**Problem:** SMS was not recognized as a transaction

**Possible reasons:**
- SMS format not supported by parser
- Contains OTP or balance check (filtered out)
- Missing amount or transaction keywords

**Solutions:**
- Check SMS format matches supported patterns (see parser documentation)
- Test with `/sms/parse` endpoint to see parsing details
- Manually add transaction if needed

### No Response / Timeout

**Problem:** Backend not reachable

**Solutions:**
- Verify backend is running: `curl https://your-backend-url.com/health`
- Check ngrok is running (if using): `ngrok http 4000`
- Verify URL in Shortcut matches your backend URL
- Check network connectivity on iPhone

### Transaction Not Appearing in Dashboard

**Problem:** Transaction created but not visible

**Solutions:**
- Check `user_id` matches your dashboard user
- Verify date range in dashboard includes transaction date
- Check database directly: `psql finance_agent -c "SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5;"`

---

## Example SMS Formats Supported

The parser recognizes these formats:

- **UPI**: `Rs.500.00 debited from A/c XX1234 for UPI/123456789012/PAYTM on 02-Dec-24`
- **Credit Card**: `Rs.1,500.00 spent on Card XX1234 at AMAZON on 02-Dec-24`
- **Debit Card**: `Rs.2,000.00 debited from A/c XX1234 at ATM on 02-Dec-24`

---

## Security Notes

- **Never commit** `.env` file to git
- **Use HTTPS** in production (never HTTP)
- **Rotate API keys** periodically
- **Monitor logs** for suspicious activity
- **Rate limiting** prevents abuse (100 req/hour)

---

## Next Steps

Once set up:

1. ✅ Transactions sync automatically from SMS
2. ✅ AI categorizes transactions intelligently
3. ✅ View in dashboard at `/dashboard`
4. ✅ Weekly summaries include SMS transactions
5. ✅ No manual entry needed!

---

## Support

For issues or questions:
- Check backend logs for detailed error messages
- Test with `/sms/parse` endpoint to debug parsing
- Verify webhook configuration with `/sms/test` endpoint
