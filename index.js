const { Telegraf } = require("telegraf");
const { spawn } = require('child_process'); // Impor 'spawn' untuk menjalankan perintah eksternal
require("dotenv").config();

// --- Konfigurasi ---
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error('"BOT_TOKEN" env var is required!');
const bot = new Telegraf(BOT_TOKEN);

const WEBAPP_URL = process.env.WEBAPP_URL;
const DONATE_URL = process.env.DONATE_URL || 'https://saweria.co/ytplay';
const ADMIN_URL = process.env.ADMIN_URL || 'https://t.me/Kangyanpwk';
const WELCOME_IMAGE_URL = 'https://i.ibb.co/vj2fVp9/teletube.jpg'; // Menggunakan URL gambar kustom Anda

// --- Logika Bot ---

bot.start(async (ctx) => {
    try {
        const caption = `<b>Selamat Datang di TeleTube!</b>\n\n<i>Temukan dan putar video YouTube favoritmu langsung dari Telegram tanpa Iklan</i>\n\nKlik tombol di bawah untuk memulai.`;
        const inline_keyboard = [];
        if (WEBAPP_URL) inline_keyboard.push([{ text: "🌐 NONTON YOUTUBE TANPA IKLAN", web_app: { url: WEBAPP_URL } }]);
        const utilityButtons = [];
        if (DONATE_URL) utilityButtons.push({ text: "💰 Donasi", url: DONATE_URL });
        if (ADMIN_URL) utilityButtons.push({ text: "💬 Chat Admin", url: ADMIN_URL });
        if (utilityButtons.length > 0) inline_keyboard.push(utilityButtons);

        await ctx.replyWithPhoto(
            WELCOME_IMAGE_URL,
            { caption: caption, parse_mode: 'HTML', reply_markup: { inline_keyboard } }
        );
    } catch (error) {
        console.error("Error di handler /start:", error);
        ctx.reply("Maaf, terjadi masalah saat menampilkan pesan selamat datang.");
    }
});

bot.on('web_app_data', async (ctx) => {
  try {
    const data = JSON.parse(ctx.webAppData.data.toString());
    if (data.action === 'download') {
      const { videoId, title } = data;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      console.log(`[yt-dlp] Menerima permintaan download untuk: ${title}`);
      
      const processingMessage = await ctx.reply(`⏳ Memproses dengan yt-dlp: <b>${title}</b>...`, { parse_mode: 'HTML' });
      
      const safeFilename = `${title.replace(/[\\/:*?"<>|]/g, '')}.mp4`;

      // Menjalankan perintah 'yt-dlp' sebagai proses terpisah
      // -f 'bv+ba/b': Memilih format video (bv) dan audio (ba) terbaik, atau format gabungan (b) terbaik
      // -o - : Mengarahkan output ke stream, bukan file di server
      const ytdlp = spawn('yt-dlp', [
        videoUrl,
        '-f', 'bv[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best',
        '--recode-video', 'mp4', // Memastikan output akhirnya selalu mp4
        '-o', '-'
      ]);

      // Mengirim video menggunakan stream dari output yt-dlp
      await ctx.replyWithVideo(
        { source: ytdlp.stdout, filename: safeFilename },
        { caption: `✅ Selesai!\n\n${title}` }
      );

      // Menangani error dari proses yt-dlp (penting untuk debugging)
      ytdlp.stderr.on('data', (data) => {
        console.error(`yt-dlp stderr: ${data}`);
      });

      // Setelah proses selesai
      ytdlp.on('close', async (code) => {
        console.log(`yt-dlp process exited with code ${code}`);
        // Hapus pesan "memproses" setelah selesai
        await ctx.deleteMessage(processingMessage.message_id);
        if (code !== 0) {
            ctx.reply(`Maaf, terjadi masalah saat mengunduh video dengan yt-dlp.`);
        }
      });
    }
  } catch (error) {
    console.error("Error memproses web_app_data:", error);
    ctx.reply(`Maaf, terjadi kesalahan: ${error.message}`);
  }
});


// Jalankan bot menggunakan metode polling yang stabil
bot.launch();
console.log("🤖 Bot aktif dan berjalan dengan metode Polling...");
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

