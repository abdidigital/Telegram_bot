const { Telegraf } = require("telegraf");
const ytdl = require("ytdl-core");
const express = require('express'); // Impor express
require("dotenv").config();

// --- Konfigurasi ---
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;
const DONATE_URL = process.env.DONATE_URL || 'https://saweria.co/username_anda';
const ADMIN_URL = process.env.ADMIN_URL || 'https://t.me/username_admin_anda';
// URL server Anda akan disediakan oleh Railway secara otomatis
const SERVER_URL = `https://${process.env.RAILWAY_STATIC_URL}`; 

if (!BOT_TOKEN) throw new Error('"BOT_TOKEN" env var is required!');

const bot = new Telegraf(BOT_TOKEN);
const app = express(); // Buat instance server express

// --- Logika Bot (Tidak Berubah) ---
bot.start((ctx) => {
    const caption = `<b>Selamat Datang di YouTube WebApp Bot!</b>\n\n<i>Temukan dan putar video YouTube favoritmu langsung dari Telegram.</i>`;
    ctx.replyWithPhoto(
        'https://placehold.co/1280x720/FF0000/FFFFFF/png?text=YouTube+WebApp&font=roboto',
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
      await ctx.deleteMessage(processingMessage.message_id);
    }
  } catch (error) {
    console.error("Error memproses web_app_data:", error);
    ctx.reply(`Maaf, terjadi kesalahan saat mengunduh video: ${error.message}`);
  }
});

// --- Pengaturan Webhook ---
// Gunakan middleware dari Telegraf untuk memproses update dari Telegram
app.use(bot.webhookCallback(`/webhook`));

// Beritahu Telegram di mana alamat webhook kita
bot.telegram.setWebhook(`${SERVER_URL}/webhook`);

// Jalankan server express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🤖 Bot aktif dan berjalan di port ${PORT}`);
});

// (Perintah bot.launch() tidak lagi digunakan)

                
