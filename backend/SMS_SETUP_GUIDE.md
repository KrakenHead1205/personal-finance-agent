# SMS Integration Setup Guide

## Automatically Import UPI & Credit Card Transactions from SMS

This guide will help you set up iOS Shortcuts to automatically forward bank transaction SMS to your Personal Finance Agent.

---

## 📱 **Prerequisites**

- iPhone with iOS 13 or later
- Bank transaction SMS notifications enabled
- Your backend server accessible (deployed or using ngrok for local testing)

---

## 🔧 **Part 1: Backend Setup**

### **Step 1: Update Environment Variables**

Edit `backend/.env`:

```env
# Enable SMS webhook
SMS_WEBHOOK_ENABLED=true

# Set a secure API key (use a random string)
SMS_WEBHOOK_KEY=your_secret_key_here_use_random_string

# Default user ID for SMS transactions
DEFAULT_USER_ID=your-user-id
```

**Generate a secure webhook key:**

```bash
# Generate a random key
openssl rand -base64 32
# Example output: K8JDh3k9PmQ2xR5tY7uN0vL4wZ1bA6cE...
```

Copy this key to both `.env` and your iOS Shortcut (see below).

### **Step 2: Restart Backend**

```bash
cd backend
npm run dev
```

Verify the SMS endpoint is available:

```bash
curl http://localhost:4000/sms/test \
  -H "X-API-Key: your_secret_key_here"

# Should return: {"status":"ok","message":"SMS webhook is configured correctly"}
```

---

## 🌐 **Part 2: Make Backend Accessible**

### **Option A: Deploy to Production (Recommended)**

Deploy your backend to a cloud service:
- **Heroku**: Free tier available
- **Railway**: Easy PostgreSQL + Node.js hosting
- **Render**: Free tier with PostgreSQL
- **DigitalOcean**: App Platform
- **AWS/GCP**: More complex but scalable

Once deployed, use your production URL (e.g., `https://your-app.herokuapp.com`)

### **Option B: Use ngrok for Testing**

For local testing, expose your local server:

```bash
# Install ngrok
brew install ngrok

# Authenticate (sign up at ngrok.com for free)
ngrok authtoken YOUR_AUTH_TOKEN

# Expose local server
ngrok http 4000
```

You'll get a public URL like: `https://abc123.ngrok.io`

**Important:** This URL changes each time you restart ngrok. For permanent use, deploy to production.

---

## 📲 **Part 3: iOS Shortcuts Setup**

### **Step 1: Create Personal Automation**

1. Open **Shortcuts** app on iPhone
2. Tap **Automation** tab (bottom)
3. Tap **+** (top right) → **Create Personal Automation**
4. Select **Message** → **Contains** → Type: `debited` (or `credited`)
5. Choose **Run Immediately** (disable "Ask Before Running")
6. Tap **Next**

### **Step 2: Add Shortcut Actions**

1. **Search and add: "Get Contents of URL"**
   - URL: `https://your-backend.com/sms/webhook` (replace with your URL)
   - Method: **POST**
   - Headers:
     - Add Header
     - Key: `X-API-Key`
     - Value: `your_secret_key_here` (same as SMS_WEBHOOK_KEY from .env)
     - Add Header
     - Key: `Content-Type`
     - Value: `application/json`
   - Request Body: **JSON**
   - Click **Add new field**
   - Key: `text`
   - Value: **Shortcut Input** (the SMS text)
   - Click **Add new field**
   - Key: `sender`
   - Value: **Sender** (tap "Shortcut Input" → "Sender")

2. **Optional: Add notification for success/failure**
   - Search and add: "Show Notification"
   - Title: "Transaction Synced"
   - Body: **Contents of URL** (the API response)

### **Step 3: Test the Automation**

1. Tap **Done** to save
2. Send yourself a test SMS with transaction format:
   ```
   Rs.500.00 debited from A/c XX1234 for UPI/PAY123/SWIGGY on 02-Dec-24
   ```
3. Check your backend logs or dashboard - transaction should appear!

---

## 📝 **SMS Format Examples**

The parser supports common Indian bank formats:

### **UPI Transactions:**
```
Rs.500.00 debited from A/c XX1234 for UPI/123456789012/PAYTM on 02-Dec-24
Rs.1,500.00 paid via UPI to AMAZON on 02-Dec-24
```

### **Credit Card:**
```
Rs.2,500.00 spent on Card XX1234 at FLIPKART on 02-Dec-24
INR 1,299.00 debited from Card ending 1234 at NETFLIX
```

### **Debit Card:**
```
Rs.3,000.00 debited from A/c XX1234 at ATM on 02-Dec-24
Rs.450.00 spent at POS STARBUCKS on 02/12/2024
```

---

## 🧪 **Testing Your Integration**

### **Test 1: Parse SMS (Without Creating Transaction)**

```bash
curl -X POST http://localhost:4000/sms/parse \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_secret_key_here" \
  -d '{
    "text": "Rs.500.00 debited from A/c XX1234 for UPI/PAY123/SWIGGY on 02-Dec-24",
    "sender": "HDFC"
  }'
```

**Expected response:**
```json
{
  "parsed": {
    "rawText": "Rs.500.00...",
    "amount": 500,
    "merchant": "SWIGGY",
    "date": "2024-12-02T00:00:00.000Z",
    "type": "DEBIT",
    "channel": "UPI",
    "bank": "HDFC"
  },
  "isValid": true
}
```

### **Test 2: Create Transaction from SMS**

```bash
curl -X POST http://localhost:4000/sms/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_secret_key_here" \
  -d '{
    "text": "Rs.1,500.00 spent on Card XX1234 at AMAZON on 02-Dec-24",
    "sender": "ICICI"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Transaction created from SMS",
  "transaction": {
    "id": "uuid-here",
    "user_id": "sms-user",
    "amount": 1500,
    "description": "AMAZON",
    "category": "Shopping",
    "source": "ICICI CARD",
    "date": "2024-12-02T00:00:00.000Z"
  }
}
```

---

## 🔒 **Security Best Practices**

### **1. Strong Webhook Key**

Generate a secure random key:

```bash
# Generate 32-byte random key
openssl rand -base64 32
```

### **2. HTTPS Only (Production)**

Never use HTTP in production - always HTTPS:
- Protects your API key in transit
- Prevents SMS content interception

### **3. Rate Limiting**

The webhook has built-in basic security:
- API key validation
- Input validation
- Error handling

For production, consider adding:
- Rate limiting (express-rate-limit)
- IP whitelisting
- Request logging

### **4. Keep Keys Secret**

- Never commit `.env` to git
- Never share your webhook key
- Rotate keys periodically

---

## 🎯 **Supported Banks**

The parser is designed for Indian banks:

- HDFC Bank
- ICICI Bank
- State Bank of India (SBI)
- Axis Bank
- Kotak Mahindra Bank
- IDFC First Bank
- Paytm Payments Bank
- PhonePe

**Note:** SMS formats vary by bank. The parser uses flexible regex patterns to handle variations.

---

## 🐛 **Troubleshooting**

### **Issue 1: SMS Not Parsed**

Check the `/sms/parse` endpoint to see if parsing works:

```bash
curl -X POST http://localhost:4000/sms/parse \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_key" \
  -d '{"text": "paste your actual SMS text here"}'
```

If `isValid: false`, the SMS format may not be recognized.

### **Issue 2: Unauthorized Error**

Check that:
- `X-API-Key` header matches `SMS_WEBHOOK_KEY` in `.env`
- No extra spaces in the key
- Backend server was restarted after updating `.env`

### **Issue 3: iOS Shortcut Not Triggering**

- Verify automation trigger matches your SMS keywords
- Check if "Run Immediately" is enabled
- Test with a manual SMS first
- Check iPhone Settings → Shortcuts → Advanced → Allow Running Scripts

### **Issue 4: Wrong Category**

The merchant name extraction might not be perfect. You can:
- Manually edit transaction categories in the dashboard
- Update parsing regex in `smsParserService.ts`
- Add bank-specific patterns

---

## 📊 **What Gets Auto-Imported**

Once set up, these will sync automatically:

✅ **UPI payments** (Google Pay, PhonePe, Paytm, etc.)
✅ **Credit card transactions**
✅ **Debit card purchases**
✅ **ATM withdrawals**
✅ **Net banking transfers**

❌ **Won't sync:**
- Balance check SMS
- OTP messages
- Promotional offers
- Non-transaction notifications

---

## 🚀 **Advanced: Multiple Triggers**

Create multiple automations for better coverage:

1. **Automation 1:** Contains "debited"
2. **Automation 2:** Contains "credited"
3. **Automation 3:** Contains "spent"
4. **Automation 4:** Contains "paid"

All using the same webhook URL and actions.

---

## 📈 **Benefits**

Once configured:

✅ **Automatic tracking** - No manual entry needed
✅ **Real-time sync** - Transactions appear instantly
✅ **AI categorization** - Smart category detection
✅ **Complete history** - All transactions captured
✅ **No missed expenses** - Every SMS = automatic entry

---

## 🎯 **Next Steps**

1. Deploy your backend or set up ngrok
2. Generate a secure webhook key
3. Update `.env` with SMS configuration
4. Create iOS Shortcut automation
5. Test with a sample SMS
6. Enable for all transaction SMS

Your finance tracking becomes completely automatic! 🎉

---

## 📞 **Support**

If SMS parsing doesn't work for your bank's format:
1. Copy the actual SMS text
2. Test with `/sms/parse` endpoint
3. Share the format (with sensitive data removed)
4. Custom parser can be added to `smsParserService.ts`

