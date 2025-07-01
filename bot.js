const { Telegraf } = require("telegraf");
require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error('"BOT_TOKEN" env var is required!');
const bot = new Telegraf(BOT_TOKEN);

const WEBAPP_URL = process.env.WEBAPP_URL;
const DONATE_URL = process.env.DONATE_URL || 'https://saweria.co/ytplay';
const ADMIN_URL = process.env.ADMIN_URL || 'https://t.me/Kangyanpwk';
const WELCOME_IMAGE_URL = 'https://i.ibb.co/27gPb276/teletube.png';

bot.start(async (ctx) => {
    try {
        const caption = `<b>Selamat Datang di TeleTube!</b>\n\n<i>Temukan dan putar video YouTube favoritmu langsung dari Telegram tanpa Iklan</i>\n\nKlik tombol di bawah untuk memulai.`;
        const inline_keyboard = [];
        if (WEBAPP_URL) inline_keyboard.push([{ text: "🌐 NONTON YOUTUBE TANPA IKLAN", web_app: { url: WEBAPP_URL } }]);
        
        const utilityButtons = [];
        if (DONATE_URL) utilityButtons.push({ text: "💰 Donasi", url: DONATE_URL });
        if (ADMIN_URL) utilityButtons.push({ text: "💬 Chat Admin", url: ADMIN_URL });
        if (utilityButtons.length > 0) inline_keyboard.push(utilityButtons);

        await ctx.replyWithPhoto(WELCOME_IMAGE_URL, { caption: caption, parse_mode: 'HTML', reply_markup: { inline_keyboard } });
    } catch (error) {
        console.error("Error di handler /start:", error);
    }
});

// Handler web_app_data sudah tidak diperlukan lagi.

bot.launch();
console.log("🤖 Bot aktif dan berjalan dengan metode Polling...");
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

