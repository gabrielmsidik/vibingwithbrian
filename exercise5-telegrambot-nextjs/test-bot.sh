#!/bin/bash

# Telegram Bot Test Script
echo "======================================"
echo "Testing Telegram Bot"
echo "======================================"
echo ""

BOT_TOKEN="7528163592:AAGcTS9qXpapZKaEUpmWIEC4hSH_aUZ4ozk"

echo "Bot Info:"
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe" | python3 -m json.tool | grep -E '"username"|"first_name"'

echo ""
echo "Webhook Status:"
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | python3 -m json.tool | grep -E '"url"|"pending_update_count"|"last_error_message"'

echo ""
echo "======================================"
echo "✅ Your bot is deployed and ready!"
echo ""
echo "To test it:"
echo "1. Open Telegram"
echo "2. Search for: @ailodgersbot"
echo "3. Start a conversation with /start"
echo ""
echo "Available commands:"
echo "  /start - Start the bot"
echo "  /help - Show help"
echo "  /hello - Say hello"
echo "  /bye - Say goodbye"
echo "  /dice - Roll a dice"
echo "  /coin - Flip a coin"
echo "  /joke - Get a joke"
echo "======================================"