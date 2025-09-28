# Simple Telegram Bot on NextJS

A simple, fun Telegram bot built with NextJS and Grammy that can be deployed on Vercel.

## Features

- **Basic Commands:**
  - `/start` - Start the bot
  - `/help` - Show available commands
  - `/hello` - Get a personalized greeting
  - `/bye` - Say goodbye

- **Fun Commands:**
  - `/dice` - Roll a dice (1-6)
  - `/coin` - Flip a coin
  - `/joke` - Get a random joke

- **Smart Responses:**
  - Responds to "thank" messages
  - Responds to messages containing "love"
  - General fallback response for other messages

## Quick Start

### Prerequisites

- Node.js 18+ installed
- A Vercel account (free tier works)
- Telegram app installed

## Setup Instructions

### 1. Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Choose a name for your bot (e.g., "My Cool Bot")
4. Choose a username (must end with 'bot', e.g., `mycoolbot`)
5. Copy the bot token provided by BotFather (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
6. Save your bot's username for later

### 2. Configure Local Environment

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your bot token:
   ```
   TELEGRAM_BOT_TOKEN=your_actual_bot_token_here
   # Optional: Add a webhook secret for extra security (currently disabled in code)
   # TELEGRAM_WEBHOOK_SECRET=generate-a-random-secret-here
   ```

### 3. Deploy to Vercel

#### Option A: Deploy via CLI (Recommended)

1. Install Vercel CLI if you haven't:
   ```bash
   npm install -g vercel
   ```

2. Deploy to Vercel:
   ```bash
   npx vercel deploy --prod
   ```

3. Add environment variables:
   ```bash
   # Add your bot token
   npx vercel env add TELEGRAM_BOT_TOKEN production
   # Paste your token when prompted

   # Optional: Add webhook secret
   npx vercel env add TELEGRAM_WEBHOOK_SECRET production
   # Generate and paste a random secret
   ```

4. Redeploy with environment variables:
   ```bash
   npx vercel deploy --prod
   ```

#### Option B: Deploy via GitHub

1. Push this code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import your repository
3. During setup, add environment variables:
   - `TELEGRAM_BOT_TOKEN` - Your bot token from BotFather
   - `TELEGRAM_WEBHOOK_SECRET` - Optional security token (currently disabled)
4. Click Deploy

### 4. Set Up Webhook

#### Option A: Use the Setup Script (Easiest)

```bash
# Make sure .env.local has your bot token
./setup-webhook.sh
# Press Enter to use default URL or enter your custom deployment URL
```

#### Option B: Manual Setup

```bash
# Replace YOUR_BOT_TOKEN with your actual token
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://simple-telegram-bot-nextjs.vercel.app/api/telegram/webhook"
  }'
```

For custom deployments, replace the URL with your deployment URL:
- Default: `https://simple-telegram-bot-nextjs.vercel.app`
- Custom: `https://simple-telegram-bot-nextjs-[hash].vercel.app`

### 5. Verify & Test Your Bot

1. **Check webhook status:**
   ```bash
   ./test-bot.sh
   # Or manually:
   curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
   ```

2. **Test in Telegram:**
   - Open Telegram
   - Search for your bot username (e.g., @yourcoolbot)
   - Press "Start" or send `/start`
   - Try the commands!

3. **Monitor logs (if needed):**
   ```bash
   npx vercel logs
   ```

## Serverless Limitations & Considerations

### ⚠️ Important: Understand Serverless Trade-offs

This bot runs on Vercel's serverless architecture, which has both benefits and limitations:

#### Limitations

1. **Stateless Execution**
   - No persistent memory between webhook calls
   - Can't store conversation context in memory
   - Requires external database for any state management

2. **Cold Start Delays**
   - First message after ~5min inactivity may take 1-3 seconds
   - Inconsistent response times
   - Telegram may show "typing" indicator during cold starts

3. **Execution Time Limits**
   - 10 seconds max on free tier (60s on Pro)
   - Can't handle long operations (file processing, complex calculations)
   - No streaming responses

4. **No Background Processing**
   - Can't send scheduled/reminder messages
   - No proactive notifications
   - Webhook-only (no long polling)

5. **Cost at Scale**
   - Free tier: 100k function invocations/month
   - High traffic = potentially high costs
   - Each message = one function invocation

#### Benefits

✅ **Perfect for:**
- Simple command-response bots
- Low to moderate traffic (<100k messages/month)
- Prototypes and hobby projects
- Zero maintenance hosting
- Automatic scaling
- Free SSL/HTTPS

❌ **Not ideal for:**
- High-traffic bots
- Bots needing conversation state
- Scheduled messaging features
- Media processing
- Complex multi-step flows

#### Alternative Hosting Options

If you need persistent connections or state:
- **VPS** (DigitalOcean, Linode): $5-10/month, full control
- **Railway/Render**: $5-7/month, container-based
- **Cloudflare Workers**: Better limits, Durable Objects for state

#### Workarounds for Production

To address limitations while staying serverless:
- Use **Redis/Upstash** for session state
- Use **Supabase/PlanetScale** for database
- Use **QStash** for scheduled messages
- Implement webhook batching to reduce invocations

## Local Development

To run locally (webhook won't work locally without ngrok):

```bash
npm install
npm run dev
```

For testing the webhook locally, you can use ngrok:

1. Install ngrok: `brew install ngrok` (on macOS)
2. Run: `ngrok http 3000`
3. Use the ngrok URL for setting the webhook

## Project Structure

```
├── app/
│   └── api/
│       └── telegram/
│           └── webhook/
│               └── route.ts    # Main bot logic & webhook handler
├── .env.local.example          # Environment variables template
├── .env.local                  # Your local environment variables (not committed)
├── vercel.json                 # Vercel configuration
├── setup-webhook.sh            # Automated webhook setup script
├── test-bot.sh                 # Bot testing utility
└── README.md                   # This file
```

## Tech Stack

- **NextJS 15** - React framework
- **Grammy** - Telegram Bot framework
- **TypeScript** - Type safety
- **Vercel** - Deployment platform

## Troubleshooting

### Bot not responding
- Run `./test-bot.sh` to check webhook status
- Ensure `pending_update_count` is 0
- Verify the webhook URL matches your deployment

### 401 Unauthorized errors
- The webhook secret check is currently disabled in the code
- If you want to enable it, uncomment lines 90-94 in `app/api/telegram/webhook/route.ts`

### 500 Internal Server Error
- Check Vercel function logs: `npx vercel logs`
- Ensure environment variables are set in Vercel
- Redeploy after adding environment variables

### Bot token issues
- Verify token with: `curl https://api.telegram.org/bot<TOKEN>/getMe`
- Should return your bot's info if valid

### Webhook not updating
- Delete old webhook: `curl https://api.telegram.org/bot<TOKEN>/deleteWebhook`
- Set new webhook using setup script

## Utility Scripts

- **`./setup-webhook.sh`** - Automated webhook configuration
- **`./test-bot.sh`** - Check bot and webhook status

## Security Notes

- Never commit your `.env.local` file
- The webhook secret verification is currently disabled for simplicity
- To enable webhook secret:
  1. Uncomment the security check in `app/api/telegram/webhook/route.ts`
  2. Set `TELEGRAM_WEBHOOK_SECRET` in Vercel environment variables
  3. Include `secret_token` when setting webhook

## License

MIT
