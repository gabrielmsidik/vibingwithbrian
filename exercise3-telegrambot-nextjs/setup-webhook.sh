#!/bin/bash

# Telegram Bot Webhook Setup Script
# This script helps you set up the webhook for your Telegram bot

echo "======================================"
echo "Telegram Bot Webhook Setup"
echo "======================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Please create one from .env.local.example:"
    echo "  cp .env.local.example .env.local"
    echo ""
    exit 1
fi

# Read environment variables from .env.local
export $(cat .env.local | grep -v '^#' | xargs)

# Check if required variables are set
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN is not set in .env.local"
    echo "Please add your bot token to .env.local"
    exit 1
fi

# Test the bot token
echo "Testing bot token..."
BOT_INFO=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe")
if echo "$BOT_INFO" | grep -q '"ok":true'; then
    BOT_USERNAME=$(echo "$BOT_INFO" | grep -o '"username":"[^"]*' | grep -o '[^"]*$')
    echo "✅ Bot found: @$BOT_USERNAME"
    echo ""
else
    echo "❌ Invalid bot token!"
    echo "Please check your TELEGRAM_BOT_TOKEN in .env.local"
    exit 1
fi

# Get the deployment URL
echo "Enter your Vercel deployment URL (or press Enter to use default)"
echo "Default: https://simple-telegram-bot-nextjs.vercel.app"
read -p "URL: " DEPLOYMENT_URL

# Use default if empty
if [ -z "$DEPLOYMENT_URL" ]; then
    DEPLOYMENT_URL="https://simple-telegram-bot-nextjs.vercel.app"
    echo "Using default URL: $DEPLOYMENT_URL"
fi

# Construct webhook URL
WEBHOOK_URL="${DEPLOYMENT_URL}/api/telegram/webhook"

echo ""
echo "Setting up webhook..."
echo "Webhook URL: $WEBHOOK_URL"
echo ""

# Note: Webhook secret is currently disabled in the code for simplicity
# If you want to use it, uncomment the security check in app/api/telegram/webhook/route.ts
PAYLOAD="{\"url\":\"${WEBHOOK_URL}\"}"

# Set the webhook
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

# Check if successful
if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo ""
    echo "✅ Webhook set successfully!"
    echo ""

    # Verify webhook status
    sleep 2
    WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo")
    PENDING_COUNT=$(echo "$WEBHOOK_INFO" | grep -o '"pending_update_count":[0-9]*' | grep -o '[0-9]*')

    echo "Your bot is now live! 🎉"
    echo "Bot username: @$BOT_USERNAME"
    echo "Webhook URL: $WEBHOOK_URL"
    if [ "$PENDING_COUNT" == "0" ]; then
        echo "Status: ✅ Processing messages"
    else
        echo "Status: ⏳ $PENDING_COUNT pending messages"
    fi
    echo ""
    echo "To test your bot:"
    echo "1. Open Telegram"
    echo "2. Search for @$BOT_USERNAME"
    echo "3. Start a conversation with /start"
    echo ""
    echo "Available commands:"
    echo "  /start - Start the bot"
    echo "  /help - Show help message"
    echo "  /hello - Say hello"
    echo "  /bye - Say goodbye"
    echo "  /dice - Roll a dice"
    echo "  /coin - Flip a coin"
    echo "  /joke - Get a random joke"
else
    echo ""
    echo "❌ Failed to set webhook!"
    echo "Response: $RESPONSE"
    echo ""
    echo "Common issues:"
    echo "1. Invalid bot token - check TELEGRAM_BOT_TOKEN in .env.local"
    echo "2. Invalid URL - make sure the deployment URL is correct"
    echo "3. Bot already has a webhook - you may need to delete the old one first"
fi

echo ""
echo "======================================"
echo "To check webhook status, run:"
echo "curl https://api.telegram.org/bot\${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
echo ""
echo "To remove webhook, run:"
echo "curl https://api.telegram.org/bot\${TELEGRAM_BOT_TOKEN}/deleteWebhook"
echo "======================================"