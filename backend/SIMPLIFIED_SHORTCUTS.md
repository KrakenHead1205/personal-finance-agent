# 📱 Simplified iOS Shortcuts Setup (Without Get Sender)

## Quick Setup (3 Actions Only)

### Action 1: Get Message Text
1. Tap **+ Add Action**
2. Search: **"Get Text from Input"**
3. Add it
4. Input should be **Shortcut Input** (the SMS)

### Action 2: Get Current Date
1. Tap **+ Add Action**
2. Search: **"Get Current Date"**
3. Add it
4. Change format to **ISO 8601**

### Action 3: Make HTTP Request
1. Tap **+ Add Action**
2. Search: **"Get Contents of URL"**
3. Add it

**Configure:**
- **URL:** `https://YOUR_NGROK_URL.ngrok-free.app/sms/webhook`
  - Replace `YOUR_NGROK_URL` with your ngrok URL from Terminal 2
  - Example: `https://abc123xyz.ngrok-free.app/sms/webhook`
- **Method:** Change to **POST**
- **Headers:**
  - `Content-Type`: `application/json`
  - `X-API-Key`: `6qV0R4VdmFYqHWftVXaqMZHOf3+tF6zXlTxyybkbz4U=`
- **Request Body:** Select **JSON**
  - Field 1:
    - Key: `text`
    - Value: Select **Text** (from Action 1)
  - Field 2:
    - Key: `receivedAt`
    - Value: Select **Current Date** (from Action 2)
  - Field 3 (Optional):
    - Key: `sender`
    - Value: Leave empty or type `""`

**Done!** Tap **Done** to save.

---

## How to Find Your ngrok URL

1. **Run ngrok:**
   ```bash
   ngrok http 4000
   ```

2. **Look for this line:**
   ```
   Forwarding    https://abc123xyz.ngrok-free.app -> http://localhost:4000
   ```

3. **Copy the HTTPS part:**
   - Copy: `https://abc123xyz.ngrok-free.app`
   - This is your ngrok URL!

4. **Use it in Shortcuts:**
   - Full webhook URL: `https://abc123xyz.ngrok-free.app/sms/webhook`

---

## Visual Example

**Terminal 2 (ngrok output):**
```
Forwarding    https://abc123xyz.ngrok-free.app -> http://localhost:4000
              ↑
              Copy this entire URL
```

**iOS Shortcuts URL field:**
```
https://abc123xyz.ngrok-free.app/sms/webhook
```

---

## That's It!

Your automation will:
1. ✅ Get SMS text
2. ✅ Get current date
3. ✅ Send to your backend via ngrok
4. ✅ Backend processes and stores transaction

**No "Get Sender" needed!** It works without it.

