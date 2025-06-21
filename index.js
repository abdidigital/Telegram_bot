const { Telegraf } = require("telegraf");
const ytdl = require("ytdl-core");
const express = require('express');
require("dotenv").config();

// --- Konfigurasi Penting ---
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error('"BOT_TOKEN" env var is required!');

const WEBAPP_URL = process.env.WEBAPP_URL;
// Railway menyediakan URL publik melalui variabel ini.
// Pastikan tidak ada https:// di awal, karena kita akan menambahkannya nanti.
const RAILWAY_URL = process.env.RAILWAY_STATIC_URL;

const DONATE_URL = process.env.DONATE_URL || 'https://saweria.co/username_anda';
const ADMIN_URL = process.env.ADMIN_URL || 'https://t.me/username_admin_anda';

const bot = new Telegraf(BOT_TOKEN);
const app = express();

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

// --- Pengaturan Server dan Webhook ---
// Pemeriksaan kesehatan untuk Railway. Anggap ini sebagai cara bot berkata "Saya hidup!"
app.get('/', (req, res) => {
    res.send('Halo! Bot Telegram sedang berjalan.');
});

// Gunakan middleware Telegraf untuk memproses update
const secretPath = `/webhook/${bot.token}`;
app.use(bot.webhookCallback(secretPath));

// Jalankan server di port yang disediakan Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`🤖 Bot aktif dan server berjalan di port ${PORT}`);
    try {
        if (!RAILWAY_URL) {
            console.error("Variabel RAILWAY_STATIC_URL tidak ditemukan. Webhook tidak dapat diatur.");
            return;
        }
        const webhookUrl = `https://${RAILWAY_URL}${secretPath}`;
        await bot.telegram.setWebhook(webhookUrl);
        console.log(`Webhook berhasil diatur ke: ${webhookUrl}`);
    } catch (error) {
        console.error('Error saat mengatur webhook:', error);
    }
});

      
