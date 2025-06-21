const { Telegraf } = require("telegraf");
const ytdl = require("ytdl-core");
require("dotenv").config();

// --- Konfigurasi ---
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error('"BOT_TOKEN" env var is required!');

const bot = new Telegraf(BOT_TOKEN);

const WEBAPP_URL = process.env.WEBAPP_URL;
const DONATE_URL = process.env.DONATE_URL || 'https://saweria.co/username_anda';
const ADMIN_URL = process.env.ADMIN_URL || 'https://t.me/username_admin_anda';
const WELCOME_IMAGE_URL = 'https://placehold.co/1280x720/FF0000/FFFFFF/png?text=YouTube+WebApp&font=roboto';

// --- Logika Bot ---

// Perintah /start
bot.start((ctx) => {
    const caption = `<b>Selamat Datang di YouTube WebApp Bot!</b>\n\n<i>Temukan dan putar video YouTube favoritmu langsung dari Telegram.</i>\n\nKlik tombol di bawah untuk memulai.`;
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

// Handler untuk data dari Web App (Download)
bot.on('web_app_data', async (ctx) => {
  try {
    const data = JSON.parse(ctx.webAppData.data.toString());
    if (data.action === 'download') {
      const { videoId, title } = data;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      console.log(`Menerima permintaan download untuk: ${title}`);
      
      const processingMessage = await ctx.reply(`⏳ Memproses: <b>${title}</b>...`, { parse_mode: 'HTML' });

      const stream = ytdl(videoUrl, { quality: 'highest', filter: 'videoandaudio' });
      const safeFilename = `${title.replace(/[\\/:*?"<>|]/g, '')}.mp4`;

      await ctx.replyWithVideo(
        { source: stream, filename: safeFilename },
        { caption: `✅ Selesai!\n\n${title}` }
      );
      // Hapus pesan "memproses" setelah selesai
      await ctx.deleteMessage(processingMessage.message_id);
    }
  } catch (error) {
    console.error("Error memproses web_app_data:", error);
    ctx.reply(`Maaf, terjadi kesalahan saat mengunduh video: ${error.message}`);
  }
});

// Jalankan bot menggunakan metode polling
bot.launch();

console.log("🤖 Bot aktif dan berjalan dengan metode Polling...");

// Pencegahan agar bot tidak crash saat ada error kecil
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

          
