# Quick Start: SMS Integration Setup

## Step 1: Install ngrok (for local development)

### Option A: Using Homebrew (Recommended)
```bash
brew install ngrok/ngrok/ngrok
```

### Option B: Download directly
1. Go to https://ngrok.com/download
2. Download for macOS
3. Extract and move to `/usr/local/bin/` or add to PATH

### Verify installation:
```bash
ngrok --version
```

---

## Step 2: Get your webhook key

```bash
cd backend

# Check if you have a webhook key set
grep SMS_WEBHOOK_KEY .env

# If not set, generate one:
openssl rand -base64 32
# Copy this output - you'll need it for iOS Shortcuts
```

**Save this key somewhere safe!** You'll paste it into iOS Shortcuts.

---

## Step 3: Start your backend

```bash
cd backend
npm run dev
```

Your backend should be running on `http://localhost:4000`

---

## Step 4: Expose backend with ngrok

In a **new terminal window**:

```bash
ngrok http 4000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:4000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`) - this is your public webhook URL!

⚠️ **Important:** Keep ngrok running while testing. The URL changes each time you restart ngrok (unless you have a paid plan).

---

## Step 5: Test the webhook manually

```bash
# Replace with your actual values
WEBHOOK_URL="https://your-ngrok-url.ngrok-free.app"
WEBHOOK_KEY="your-webhook-key-from-step-2"

curl -X POST "$WEBHOOK_URL/sms/webhook" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $WEBHOOK_KEY" \
  -d '{
    "text": "Rs.500.00 debited from A/c XX1234 for UPI/123456789012/SWIGGY on 02-Dec-24",
    "sender": "HDFC"
  }'
```

Expected response:
```json
{
  "success": true,
  "transaction": {
    "id": "...",
    "amount": 500,
    "description": "SWIGGY",
    "category": "Food",
    ...
  }
}
```

---

## Step 6: Set up iOS Shortcuts

### 6.1: Open Shortcuts App
- Open the **Shortcuts** app on your iPhone
- Tap the **Automation** tab (bottom)

### 6.2: Create New Automation
1. Tap **+** (top right)
2. Select **Create Personal Automation**
3. Scroll down and tap **Message**
4. Select **Any Message** (or filter by specific senders like your bank)
5. Tap **Next**

### 6.3: Configure Trigger
1. Toggle **Run Immediately** ON
2. Toggle **Ask Before Running** OFF (important for automatic processing)
3. Tap **Next**

### 6.4: Add Actions

Add these actions **in order**:

#### Action 1: Get Message Text
- Tap **+ Add Action**
- Search: **"Get Text from Input"**
- Select it
- The input should automatically be set to **Shortcut Input** (the SMS message)

#### Action 2: Get Current Date
- Tap **+ Add Action**
- Search: **"Get Current Date"**
- Select it
- Tap on the date format → Change to **ISO 8601**

#### Action 3: Get Sender (Optional)
- Tap **+ Add Action**
- Search: **"Get Details of Messages"**
- Select it
- Tap **Details** → Select **Sender**

#### Action 4: Make HTTP Request
- Tap **+ Add Action**
- Search: **"Get Contents of URL"**
- Select it
- Configure:
  - **URL**: `https://your-ngrok-url.ngrok-free.app/sms/webhook`
    (Replace with your actual ngrok URL from Step 4)
  - **Method**: Tap and change to **POST**
  - **Headers**: Tap **Add Header**
    - Key: `Content-Type`
    - Value: `application/json`
    - Tap **Add Header** again
    - Key: `X-API-Key`
    - Value: `your-webhook-key-from-step-2`
  - **Request Body**: Tap and select **JSON**
    - Tap **Add Field**
    - Key: `text`
    - Value: Tap and select **Text** (from Action 1)
    - Tap **Add Field**
    - Key: `receivedAt`
    - Value: Tap and select **Current Date** (from Action 2)
    - Tap **Add Field**
    - Key: `sender`
    - Value: Tap and select **Sender** (from Action 3, or leave empty)

### 6.5: Save Automation
1. Tap **Done**
2. Your automation is now active! ✅

---

## Step 7: Test it!

1. Send yourself a test SMS with a transaction format:
   ```
   Rs.500.00 debited from A/c XX1234 for UPI/123456789012/PAYTM on 02-Dec-24
   ```

2. Check your backend terminal - you should see:
   ```
   ✅ ADK categorization: "PAYTM" → Food
   Transaction created: { id: "...", amount: 500, ... }
   ```

3. Verify in database:
   ```bash
   cd backend
   ./view-db.sh recent
   ```

---

## Troubleshooting

### Shortcut not triggering?
- Make sure **Run Immediately** is ON
- Make sure **Ask Before Running** is OFF
- Check that the trigger is set to **Any Message** or includes your bank's sender

### 401 Unauthorized?
- Verify `X-API-Key` header matches `SMS_WEBHOOK_KEY` in `.env`
- Check for extra spaces in the key

### Connection failed?
- Make sure ngrok is still running
- Verify the ngrok URL is correct (it changes on restart)
- Check that backend is running on port 4000

### Transaction not created?
- Check backend logs for errors
- Verify SMS format matches supported patterns
- Test with `/sms/parse` endpoint first

---

## Production Deployment (Optional)

For a permanent solution, deploy your backend to:
- **Railway**: https://railway.app (free tier available)
- **Render**: https://render.com (free tier available)
- **Heroku**: https://heroku.com
- **Fly.io**: https://fly.io

Then use your production URL instead of ngrok in iOS Shortcuts.

---

## Next Steps

Once working:
1. ✅ Transactions sync automatically from SMS
2. ✅ AI categorizes them intelligently
3. ✅ View in dashboard at `/dashboard`
4. ✅ Weekly summaries include SMS transactions

**No manual entry needed!** 🎉

