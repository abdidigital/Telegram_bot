const { Telegraf } = require("telegraf");
// const ytdl = require("ytdl-core"); // <-- HAPUS BARIS INI
require("dotenv").config();

// --- Konfigurasi ---
const bot = new Telegraf(process.env.BOT_TOKEN);
const WEBAPP_URL = process.env.WEBAPP_URL;
const DONATE_URL = process.env.DONATE_URL || 'https://saweria.co/ytplas';
const ADMIN_URL = process.env.ADMIN_URL || 'https://t.me/Khunaypwk';
const WELCOME_IMAGE_URL = 'https://placehold.co/1280x720/FF0000/FFFFFF/png?text=YouTube+WebApp&font=roboto';

// --- Perintah /start (Tidak berubah) ---
bot.start((ctx) => {
    const caption = `<b>Selamat Datang di YouTube WebApp Bot!</b>\n\n<i>Temukan dan putar video YouTube favoritmu langsung dari Telegram.</i>\n\nKlik tombol di bawah untuk memulai petualanganmu atau dukung kami melalui donasi. Terima kasih! 🙏`;
    ctx.replyWithPhoto(
        { url: WELCOME_IMAGE_URL },
        {
            caption: caption,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🌐 Buka YouTube Player", web_app: { url: WEBAPP_URL } }],
                    [{ text: "💰 Donasi", url: DONATE_URL }, { text: "💬 Chat Admin", url: ADMIN_URL }],
                ],
            },
        }
    );
});


// =======================================================
// ===== SELURUH BLOK 'bot.on('web_app_data')' DIHAPUS =====
// =======================================================


// Jalankan bot
bot.launch();
console.log("🤖 Bot aktif...");
