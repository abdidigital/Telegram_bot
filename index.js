const { Telegraf } = require("telegraf");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const WEBAPP_URL = process.env.WEBAPP_URL;

bot.start((ctx) => {
  ctx.reply("Selamat datang di YouTube WebApp!", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🌐 Buka YouTube Player",
            web_app: { url: WEBAPP_URL },
          },
        ],
      ],
    },
  });
});

bot.launch();
console.log("🤖 Bot aktif...");
