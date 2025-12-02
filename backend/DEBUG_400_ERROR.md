# 🔍 Debugging 400 Bad Request Error

## What 400 Bad Request Means

A 400 error means the request reached your backend, but something is wrong with the request format.

Looking at your webhook code, a 400 is returned when:
- The `text` field is missing from the JSON body
- The JSON format is invalid
- The Content-Type header is not set correctly

---

## Common Issues & Fixes

### Issue 1: Missing `text` Field

**Problem:** The JSON body doesn't have a `text` field.

**Fix in iOS Shortcuts:**
- Make sure Action 3 (Get Contents of URL) has:
  - Request Body set to **JSON**
  - A field with Key: `text`
  - Value should be the **Text** from Action 1

### Issue 2: Wrong JSON Format

**Problem:** The JSON body is not properly formatted.

**Fix in iOS Shortcuts:**
- Make sure Request Body is set to **JSON** (not Text or Form)
- Check that all field values are properly connected to previous actions

### Issue 3: Missing Content-Type Header

**Problem:** The `Content-Type: application/json` header is missing.

**Fix in iOS Shortcuts:**
- In Action 3, make sure Headers section has:
  - Key: `Content-Type`
  - Value: `application/json`

### Issue 4: Wrong API Key

**Problem:** The `X-API-Key` header is missing or incorrect.

**Fix in iOS Shortcuts:**
- Make sure Headers section has:
  - Key: `X-API-Key`
  - Value: `6qV0R4VdmFYqHWftVXaqMZHOf3+tF6zXlTxyybkbz4U=`

---

## How to Debug

### Step 1: Check Backend Logs

Look at Terminal 1 (where `npm run dev` is running). You should see error messages like:
```
Missing required field
SMS text is required
```

### Step 2: Check ngrok Dashboard

1. Open http://127.0.0.1:4040 in your browser
2. Click on the failed request
3. Check:
   - **Request Headers** - Are Content-Type and X-API-Key present?
   - **Request Body** - Does it have a `text` field?

### Step 3: Test with curl

Test your webhook manually to verify it works:

```bash
# Replace YOUR_NGROK_URL with your actual ngrok URL
curl -X POST https://YOUR_NGROK_URL.ngrok-free.app/sms/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 6qV0R4VdmFYqHWftVXaqMZHOf3+tF6zXlTxyybkbz4U=" \
  -d '{
    "text": "Rs.500.00 debited from A/c XX1234 for UPI/123456789012/SWIGGY on 02-Dec-24",
    "receivedAt": "2024-12-02T22:57:20.000Z",
    "sender": ""
  }'
```

If this works, the issue is in your iOS Shortcuts configuration.

---

## Correct iOS Shortcuts Configuration

### Action 3: Get Contents of URL

**URL:**
```
https://YOUR_NGROK_URL.ngrok-free.app/sms/webhook
```

**Method:**
```
POST
```

**Headers:**
```
Content-Type: application/json
X-API-Key: 6qV0R4VdmFYqHWftVXaqMZHOf3+tF6zXlTxyybkbz4U=
```

**Request Body:**
- Type: **JSON**
- Fields:
  1. Key: `text`
     Value: **Text** (from Action 1 - Get Text from Input)
  2. Key: `receivedAt`
     Value: **Current Date** (from Action 2 - Get Current Date)
  3. Key: `sender` (optional)
     Value: Leave empty or `""`

---

## Quick Checklist

- [ ] Backend is running (`npm run dev`)
- [ ] ngrok is running (`ngrok http 4000`)
- [ ] URL in Shortcuts is correct (includes `/sms/webhook`)
- [ ] Method is set to **POST**
- [ ] Headers include `Content-Type: application/json`
- [ ] Headers include `X-API-Key` with correct value
- [ ] Request Body is set to **JSON** (not Text)
- [ ] JSON has a `text` field
- [ ] `text` field value is connected to Action 1 (Get Text from Input)

---

## Still Not Working?

1. **Check ngrok dashboard:** http://127.0.0.1:4040
   - Click on the failed request
   - See what was actually sent

2. **Check backend terminal:**
   - Look for error messages
   - Check what the backend received

3. **Try the curl test:**
   - If curl works, the issue is in Shortcuts
   - If curl fails, the issue is in backend/ngrok

4. **Share the error:**
   - What does the backend terminal show?
   - What does the ngrok dashboard show?

