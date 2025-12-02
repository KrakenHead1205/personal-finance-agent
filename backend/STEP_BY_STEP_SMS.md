# 📱 Step-by-Step: SMS Integration from iPhone

## ✅ Prerequisites Check
- [x] ngrok downloaded
- [ ] Backend running
- [ ] ngrok running
- [ ] iOS Shortcuts configured

---

## Step 1: Start Your Backend Server

**Open Terminal 1:**

```bash
cd /Users/samarthsharma/Desktop/Agentic-AI/personal-finance-agent/backend
npm run dev
```

**Expected output:**
```
🚀 Server running on http://localhost:4000
📊 Health check: http://localhost:4000/health
💰 Transactions API: http://localhost:4000/transactions
📈 Reports API: http://localhost:4000/reports
📱 SMS Webhook: http://localhost:4000/sms/webhook
🗄️  Database: PostgreSQL
```

✅ **Keep this terminal running!** Don't close it.

---

## Step 2: Start ngrok

**Open Terminal 2 (new terminal window):**

```bash
ngrok http 4000
```

**Expected output:**
```
Session Status                online
Account                       Your Account
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123xyz.ngrok-free.app -> http://localhost:4000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**📋 IMPORTANT: Copy the HTTPS URL** 
- Look for the line that says `Forwarding`
- Copy the **HTTPS URL** (e.g., `https://abc123xyz.ngrok-free.app`)
- This is **NOT** your port number - it's a public URL that ngrok creates
- This URL forwards to your `localhost:4000` backend
- **Example:** If you see `https://abc123xyz.ngrok-free.app`, that's your URL!

✅ **Keep this terminal running too!** The URL will change if you restart ngrok.

**💡 Tip:** You can also open http://127.0.0.1:4040 in your browser to see the ngrok dashboard and copy the URL from there.

---

## Step 3: Test the Webhook (Optional but Recommended)

**In Terminal 3 (or use Terminal 1 if backend is running):**

```bash
# Replace YOUR_NGROK_URL with the URL from Step 2
curl -X POST https://YOUR_NGROK_URL.ngrok-free.app/sms/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 6qV0R4VdmFYqHWftVXaqMZHOf3+tF6zXlTxyybkbz4U=" \
  -d '{
    "text": "Rs.500.00 debited from A/c XX1234 for UPI/123456789012/SWIGGY on 02-Dec-24",
    "sender": "HDFC"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "transaction": {
    "id": "...",
    "amount": 500,
    "description": "SWIGGY",
    "category": "Food",
    "source": "UPI",
    ...
  }
}
```

If you see this, your backend is working! ✅

---

## Step 4: Set Up iOS Shortcuts on Your iPhone

### 4.1: Open Shortcuts App
- Find and open the **Shortcuts** app on your iPhone
- Tap the **Automation** tab at the bottom

### 4.2: Create New Automation
1. Tap the **+** button (top right)
2. Tap **Create Personal Automation**
3. Scroll down and tap **Message**
4. Select **Any Message** (or filter by specific bank senders if you want)
5. Tap **Next** (top right)

### 4.3: Configure Trigger Settings
1. Toggle **Run Immediately** to **ON** (green)
2. Toggle **Ask Before Running** to **OFF** (gray) ⚠️ **Important!**
3. Tap **Next**

### 4.4: Add Actions

You'll add 4 actions in order:

#### Action 1: Get Message Text
1. Tap **+ Add Action**
2. Search for: **"Get Text from Input"**
3. Tap on it to add
4. The input should automatically be set to **Shortcut Input** (the SMS message)
   - If not, tap the input field and select **Shortcut Input**

#### Action 2: Get Current Date
1. Tap **+ Add Action**
2. Search for: **"Get Current Date"**
3. Tap on it to add
4. Tap on the date format (it might say "Date")
5. Change format to **ISO 8601**

#### Action 3: Get Sender (OPTIONAL - Skip if not available)
**Note:** Some iOS versions don't have this action. That's okay - you can skip it!

**If available:**
1. Tap **+ Add Action**
2. Search for: **"Get Details of Messages"**
3. Tap on it to add
4. Tap on **Details** and select **Sender**

**If NOT available:**
- Just skip this step - it's optional!
- In Action 4, you can leave the `sender` field empty or remove it

#### Action 4: Make HTTP Request
1. Tap **+ Add Action**
2. Search for: **"Get Contents of URL"**
3. Tap on it to add

**Now configure this action:**

**a) Set the URL:**
- Tap on the URL field
- Enter: `https://YOUR_NGROK_URL.ngrok-free.app/sms/webhook`
  - **Replace `YOUR_NGROK_URL`** with the HTTPS URL you copied from Step 2
  - **This is NOT your port number!** It's the ngrok URL (e.g., `abc123xyz.ngrok-free.app`)
  - **Full example:** `https://abc123xyz.ngrok-free.app/sms/webhook`
  - **Where to find it:** Look in Terminal 2 where ngrok is running, find the "Forwarding" line

**b) Change Method to POST:**
- Tap on **GET** (it might say "Get" or show a dropdown)
- Change it to **POST**

**c) Add Headers:**
- Tap **Show More** (if visible)
- Tap **Headers** → **Add Header**
  - Key: `Content-Type`
  - Value: `application/json`
- Tap **Add Header** again
  - Key: `X-API-Key`
  - Value: `6qV0R4VdmFYqHWftVXaqMZHOf3+tF6zXlTxyybkbz4U=`

**d) Set Request Body:**
- Find **Request Body** section
- Tap on it and select **JSON**
- Tap **Add Field**
  - Key: `text`
  - Value: Tap the value field → Select **Text** (from Action 1)
- Tap **Add Field**
  - Key: `receivedAt`
  - Value: Tap the value field → Select **Current Date** (from Action 2)
- Tap **Add Field**
  - Key: `sender`
  - Value: 
    - **If you added Action 3:** Tap the value field → Select **Sender** (from Action 3)
    - **If you skipped Action 3:** Just leave it empty or type an empty string `""`
    - **Note:** This field is optional - the webhook will work without it!

### 4.5: Save the Automation
1. Tap **Done** (top right)
2. Your automation is now active! ✅

---

## Step 5: Test It!

### Test 1: Send Yourself a Test SMS
1. Send yourself an SMS with this text:
   ```
   Rs.500.00 debited from A/c XX1234 for UPI/123456789012/PAYTM on 02-Dec-24
   ```

2. **Check Terminal 1 (backend):** You should see:
   ```
   ✅ ADK categorization: "PAYTM" → Food
   Transaction created: { id: "...", amount: 500, ... }
   ```

3. **Check Terminal 2 (ngrok):** You should see the request in the dashboard

### Test 2: Verify in Database
```bash
cd /Users/samarthsharma/Desktop/Agentic-AI/personal-finance-agent/backend
./view-db.sh recent
```

You should see your test transaction! ✅

---

## Step 6: Test with Real Bank SMS

Once the test works, try with a real bank SMS:
- Receive a real transaction SMS from your bank
- The automation should trigger automatically
- Check your backend logs and database

---

## 🎉 You're Done!

Your iPhone will now automatically:
1. ✅ Detect bank transaction SMS
2. ✅ Forward to your backend
3. ✅ Parse and categorize (using AI!)
4. ✅ Store in database
5. ✅ Show in your dashboard

**No manual entry needed!**

---

## 🔧 Troubleshooting

### Shortcut not triggering?
- ✅ Make sure **Run Immediately** is ON
- ✅ Make sure **Ask Before Running** is OFF
- ✅ Check that trigger is set to **Any Message** or includes your bank

### 401 Unauthorized error?
- ✅ Verify `X-API-Key` header matches: `6qV0R4VdmFYqHWftVXaqMZHOf3+tF6zXlTxyybkbz4U=`
- ✅ Check for extra spaces in the key

### Connection failed?
- ✅ Make sure ngrok is still running (Terminal 2)
- ✅ Make sure backend is still running (Terminal 1)
- ✅ Verify ngrok URL is correct (it changes on restart)
- ✅ Check ngrok dashboard at http://127.0.0.1:4040

### Transaction not created?
- ✅ Check backend logs for errors
- ✅ Verify SMS format matches supported patterns
- ✅ Test with curl command first (Step 3)

### Need to update ngrok URL?
- If you restart ngrok, the URL changes
- Update the URL in iOS Shortcuts Action 4

---

## 📝 Important Notes

1. **Keep both terminals running:**
   - Terminal 1: Backend (`npm run dev`)
   - Terminal 2: ngrok (`ngrok http 4000`)

2. **ngrok URL changes:**
   - Free ngrok URLs change every time you restart
   - For permanent solution, deploy to Railway/Render/Heroku

3. **Webhook key:**
   - Your key: `6qV0R4VdmFYqHWftVXaqMZHOf3+tF6zXlTxyybkbz4U=`
   - Keep it secret!

4. **Production deployment:**
   - For permanent setup, deploy backend to:
     - Railway: https://railway.app
     - Render: https://render.com
     - Heroku: https://heroku.com
   - Then use production URL in iOS Shortcuts

---

## 🎯 Next Steps

1. ✅ Test with real bank SMS
2. ✅ View transactions: `./view-db.sh recent`
3. ✅ Check dashboard: `http://localhost:3000/dashboard`
4. ✅ Deploy to production (optional, for permanent URL)

**Happy tracking! 📱💰**

