#!/bin/bash

# Helper script to start SMS integration setup

echo "🚀 SMS Integration Setup Helper"
echo "================================"
echo ""

# Check if backend is running
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Backend is running on port 4000"
else
    echo "❌ Backend is NOT running"
    echo "   Start it with: npm run dev"
    echo ""
    exit 1
fi

# Check ngrok
if command -v ngrok &> /dev/null; then
    echo "✅ ngrok is installed"
    
    # Check if ngrok is already running
    if lsof -Pi :4040 -sTCP:LISTEN -t >/dev/null ; then
        echo "✅ ngrok is already running"
        echo ""
        echo "📋 Your webhook URL should be visible at: http://localhost:4040"
        echo "   Open that in your browser to see the ngrok dashboard"
    else
        echo "⚠️  ngrok is not running"
        echo ""
        echo "📋 To start ngrok, run in a new terminal:"
        echo "   ngrok http 4000"
        echo ""
        echo "   Then copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)"
    fi
else
    echo "❌ ngrok is NOT installed"
    echo ""
    echo "📋 Install it with:"
    echo "   brew install ngrok/ngrok/ngrok"
    echo ""
    echo "   Or download from: https://ngrok.com/download"
fi

echo ""
echo "📱 iOS Shortcuts Setup:"
echo "   1. Open Shortcuts app → Automation tab"
echo "   2. Create Personal Automation → Message → Any Message"
echo "   3. Add actions: Get Text → Get Date → Get Contents of URL"
echo "   4. Use your ngrok URL + webhook key"
echo ""
echo "📖 Full guide: See QUICK_START_SMS.md"
echo ""

# Get webhook key if .env exists
if [ -f .env ]; then
    WEBHOOK_KEY=$(grep "SMS_WEBHOOK_KEY=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    if [ -n "$WEBHOOK_KEY" ] && [ "$WEBHOOK_KEY" != "your-long-random-secret-here" ]; then
        echo "🔑 Your webhook key: $WEBHOOK_KEY"
        echo "   (Copy this for iOS Shortcuts X-API-Key header)"
    fi
fi

echo ""
echo "🧪 Test your webhook:"
echo "   See QUICK_START_SMS.md for curl command"
echo ""

