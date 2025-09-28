"""Minimal Telegram bot for Railway deployment demo."""
import logging
import os
import random
from typing import Final

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
LOGGER = logging.getLogger(__name__)

TOKEN_ENV: Final[str] = "TELEGRAM_BOT_TOKEN"


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Greet the user and advertise available commands."""
    user_first_name = update.effective_user.first_name if update.effective_user else "there"
    commands = ["/hi", "/bye", "/roll", "/coin"]
    await update.message.reply_text(
        "Hello, {}! Try these commands: {}".format(
            user_first_name,
            ", ".join(commands),
        )
    )


async def hi(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Say hi to the user."""
    user_first_name = update.effective_user.first_name if update.effective_user else "friend"
    await update.message.reply_text(f"Hi, {user_first_name}!")


async def bye(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Say bye to the user."""
    user_first_name = update.effective_user.first_name if update.effective_user else "friend"
    await update.message.reply_text(f"Bye, {user_first_name}!")


async def roll(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Roll a six-sided dice."""
    roll_result = random.randint(1, 6)
    await update.message.reply_text(f"You rolled a {roll_result}.")


async def coin(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Flip a coin."""
    face = random.choice(["heads", "tails"])
    await update.message.reply_text(f"The coin landed on {face}.")


def _load_token() -> str:
    token = os.getenv(TOKEN_ENV)
    if not token:
        raise RuntimeError(
            f"Missing Telegram token. Set the {TOKEN_ENV} environment variable."
        )
    return token


def main() -> None:
    """Configure the bot and start polling."""
    token = _load_token()
    application = Application.builder().token(token).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("hi", hi))
    application.add_handler(CommandHandler("bye", bye))
    application.add_handler(CommandHandler("roll", roll))
    application.add_handler(CommandHandler("coin", coin))

    LOGGER.info("Bot is polling...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
