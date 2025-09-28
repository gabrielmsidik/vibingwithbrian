import { Bot, webhookCallback } from 'grammy';
import { NextRequest, NextResponse } from 'next/server';

const token = process.env.TELEGRAM_BOT_TOKEN || '';
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

let bot: Bot | null = null;

if (token) {
  bot = new Bot(token);

  bot.command('start', async (ctx) => {
    await ctx.reply('Hello! I\'m your simple bot. Try /help to see what I can do!');
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(
      'Here are my commands:\n' +
      '/start - Start the bot\n' +
      '/help - Show this help message\n' +
      '/hello - Say hello\n' +
      '/bye - Say goodbye\n' +
      '/dice - Roll a dice\n' +
      '/coin - Flip a coin\n' +
      '/joke - Get a random joke'
    );
  });

  bot.command('hello', async (ctx) => {
    const userName = ctx.from?.first_name || 'there';
    await ctx.reply(`Hello ${userName}! 👋 How are you doing today?`);
  });

  bot.command('bye', async (ctx) => {
    const userName = ctx.from?.first_name || 'friend';
    await ctx.reply(`Goodbye ${userName}! 👋 See you later!`);
  });

  bot.command('dice', async (ctx) => {
    const diceValue = Math.floor(Math.random() * 6) + 1;
    const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    await ctx.reply(`You rolled a ${diceValue}! ${diceEmojis[diceValue - 1]}`);
  });

  bot.command('coin', async (ctx) => {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const emoji = result === 'Heads' ? '🪙' : '🌙';
    await ctx.reply(`Coin flip result: ${result} ${emoji}`);
  });

  const jokes = [
    "Why don't scientists trust atoms? Because they make up everything!",
    "Why did the scarecrow win an award? He was outstanding in his field!",
    "Why don't eggs tell jokes? They'd crack each other up!",
    "What do you call a fake noodle? An impasta!",
    "Why did the bicycle fall over? It was two-tired!",
    "What do you call a bear with no teeth? A gummy bear!",
    "Why can't a bicycle stand up by itself? It's two tired!",
    "What did one wall say to the other wall? I'll meet you at the corner!",
  ];

  bot.command('joke', async (ctx) => {
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    await ctx.reply(`😄 ${joke}`);
  });

  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text.toLowerCase();

    if (text.includes('thank')) {
      await ctx.reply('You\'re welcome! 😊');
    } else if (text.includes('love')) {
      await ctx.reply('❤️ Spread the love!');
    } else {
      await ctx.reply('I heard you! Try /help to see what I can do.');
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!bot || !token) {
      return NextResponse.json(
        { error: 'Bot not configured. Please set TELEGRAM_BOT_TOKEN environment variable.' },
        { status: 503 }
      );
    }

    // Temporarily disabled for testing
    // const secretHeader = req.headers.get('x-telegram-bot-api-secret-token');
    // if (webhookSecret && secretHeader !== webhookSecret) {
    //   console.error('Invalid webhook secret');
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await req.json();
    console.log('Received update:', JSON.stringify(body, null, 2));

    const handleWebhook = webhookCallback(bot, 'std/http');
    await handleWebhook(
      new Request(req.url, {
        method: 'POST',
        headers: req.headers,
        body: JSON.stringify(body),
      })
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'Telegram bot webhook is running',
      commands: [
        '/start', '/help', '/hello', '/bye',
        '/dice', '/coin', '/joke'
      ]
    },
    { status: 200 }
  );
}