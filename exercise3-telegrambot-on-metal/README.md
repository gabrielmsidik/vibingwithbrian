# Exercise 5: Telegram Bot on Bare Metal (VPS)

A containerised version of the Exercise 4 bot, ready to run anywhere Docker is available.

## Features

- `/start` and `/hi` greet the user
- `/bye` signs off politely
- `/roll` returns a random dice roll (1-6)
- `/coin` flips a virtual coin

## Local Development (optional)

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
# edit .env and set TELEGRAM_BOT_TOKEN
export $(cat .env | xargs)
python bot.py
```

The bot uses long polling; it is ready once `Bot is polling...` appears.

## Build and run with Docker

```bash
cp .env.example .env  # populate with your real token
# build the container image
docker build -t exercise5-telegrambot .
# run the bot using the env file
docker run --rm --name exercise5-telegrambot --env-file .env exercise5-telegrambot
```

Stop the container with `Ctrl+C` or `docker stop exercise5-telegrambot` from another terminal.

## Deploying to a VPS with Docker

1. **Install Docker (run on the server)**
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   # log out/in to refresh your group membership
   ```
   Ensure the server has outbound network access so the container can reach the Telegram API.
2. **Copy the project to the server**
   ```bash
   rsync -avz ./exercise5-telegrambot-on-metal/ user@vps:/opt/exercise5-telegrambot
   ```
   Replace `user@vps` with your SSH target. `git clone` inside `/opt/exercise5-telegrambot` also works.
3. **Configure secrets**
   ```bash
   cd /opt/exercise5-telegrambot
   cp .env.example .env
   nano .env  # set TELEGRAM_BOT_TOKEN
   ```
4. **Start the container with Compose**
   ```bash
   docker compose up -d
   ```
   If your Docker installation uses the legacy `docker-compose` binary, run `docker-compose up -d` instead. The service name is `bot` in `docker-compose.yml`.
5. **Check status and logs**
   ```bash
   docker compose ps
   docker compose logs -f
   ```
   Stop the bot with `docker compose down`.

## Updating the bot

```bash
ssh user@vps
cd /opt/exercise5-telegrambot
git pull  # or sync new files via rsync
docker compose build
docker compose up -d
```

The Docker setup is minimal on purpose. Feel free to push the image to a registry and pull it on the server, or integrate with tools like Watchtower for automated updates.
