const { Telegraf } = require("telegraf");
const ytdl = require("ytdl-core"); // Impor library yang baru diinstal
require("dotenv").config();

// --- Konfigurasi ---
const bot = new Telegraf(process.env.BOT_TOKEN);
const WEBAPP_URL = process.env.WEBAPP_URL;
const DONATE_URL = process.env.DONATE_URL || 'https://saweria.co/ytplay';
const ADMIN_URL = process.env.ADMIN_URL || 'https://t.me/Kangyanpwk';
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
// ===== HANDLER UNTUK TOMBOL DOWNLOAD (KODE BARU) =====
// =======================================================
// Bot akan mendengarkan setiap kali Web App mengirim data
bot.on('web_app_data', async (ctx) => {
  try {
    // 1. Ambil data yang dikirim dari Web App
    const webAppData = ctx.webAppData.data.toString();
    const data = JSON.parse(webAppData);

    // 2. Periksa apakah ini adalah aksi 'download'
    if (data.action === 'download') {
      const videoId = data.videoId;
      const videoTitle = data.title;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      console.log(`Menerima permintaan download untuk: ${videoTitle} (ID: ${videoId})`);

      // 3. Kirim pesan konfirmasi ke pengguna
      const processingMessage = await ctx.reply(`Sedang memproses permintaan download untuk:\n<b>${videoTitle}</b>...\n\nMohon tunggu sebentar 🙏`, { parse_mode: 'HTML' });

      // 4. Proses download menggunakan ytdl-core
      // Kita akan men-stream video agar tidak membebani memori server
      const stream = ytdl(videoUrl, {
        quality: 'highest', // Anda bisa memilih kualitas, misal: '18' untuk 360p mp4
        filter: 'videoandaudio'
      });
      
      const safeFilename = `${videoTitle.replace(/[\\/:*?"<>|]/g, '')}.mp4`;

      // 5. Kirim video ke pengguna
      await ctx.replyWithVideo(
        { source: stream, filename: safeFilename },
        { caption: `✅ Download selesai!\n\n${videoTitle}` }
      );

      // Hapus pesan "sedang memproses" setelah selesai
      await ctx.deleteMessage(processingMessage.message_id);

    }
  } catch (error) {
    console.error("Error saat memproses web_app_data:", error);
    ctx.reply(`Maaf, terjadi kesalahan saat mencoba mengunduh video. Coba lagi nanti.\n\nError: ${error.message}`);
  }
});


// Jalankan bot
bot.launch();
console.log("🤖 Bot aktif...");
