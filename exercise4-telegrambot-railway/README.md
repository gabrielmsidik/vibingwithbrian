# Exercise 4: Telegram Bot on Railway

A bare-bones Telegram bot for demonstrating how to deploy a Python app with [Railway](https://railway.app/).

## Features

- `/start` and `/hi` respond with a friendly greeting
- `/bye` signs off politely
- `/roll` returns a random dice roll (1-6)
- `/coin` simulates a coin flip

## Prerequisites

- Python 3.10+ (the bot uses `python-telegram-bot` v20)
- A Telegram bot token (create one with [BotFather](https://core.telegram.org/bots#botfather))

## Local Development

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export TELEGRAM_BOT_TOKEN=your-bot-token-here  # Windows (PowerShell): setx TELEGRAM_BOT_TOKEN "your-bot-token-here"
python bot.py
```

The bot runs with long polling. Talk to it from Telegram once it prints `Bot is polling...`.

## Deploying to Railway (GitHub UI flow)

1. Push this folder to a GitHub repository.
2. In Railway, click **New Project → Deploy from GitHub repo** and connect the repository.
3. Railway auto-detects `requirements.txt` and `Procfile` and builds a Python environment.
4. Open the service → **Variables** and add `TELEGRAM_BOT_TOKEN=<your real BotFather token>`.
5. Click **Deploy** (or wait for the auto-build). Once the worker boots, Railway starts `python bot.py` and the bot begins polling.

## Deploying with the Railway CLI

1. Install the CLI (`npm i -g @railway/cli` or `brew install railway` on macOS).
2. Log in and initialize the project from inside this directory:
   ```bash
   railway login
   railway init
   ```
   Follow the prompts to create a new project and service (or link to an existing one).
3. Set the environment variable in Railway:
   ```bash
   railway variables --set "TELEGRAM_BOT_TOKEN=your-real-token"
   ```
4. Deploy the code:
   ```bash
   railway up
   ```
   The CLI uploads the repo, runs the build, and starts the worker defined in the `Procfile`.

## Notes

- Ignore your local `.venv/` and `.env` files so the Linux build doesn’t pick up macOS binaries. This repo includes `.gitignore` and `.railwayignore` entries for you.
- `.tool-versions` pins Python 3.12.6 on Railway because `python-telegram-bot==20.7` misbehaves on 3.13. Update both files if you bump either dependency.
- Railway keeps the worker running, so the bot remains responsive.
- Long polling is the simplest setup. For webhooks you would need to expose an HTTPS endpoint, which is intentionally out of scope here.
- Update the bot by committing changes and triggering another deploy (`railway up` or GitHub push).
