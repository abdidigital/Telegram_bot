const { Telegraf } = require("telegraf");
require("dotenv").config(); // Pastikan Anda sudah menginstal: npm install dotenv

// --- Konfigurasi ---
// Ambil token dan URL dari file .env Anda
const bot = new Telegraf(process.env.BOT_TOKEN);

// URL WAJIB
const WEBAPP_URL = process.env.WEBAPP_URL; 

// URL OPSIONAL (Gunakan URL default jika tidak ada di .env)
const DONATE_URL = process.env.DONATE_URL || 'https://saweria.co/ytplay';
const ADMIN_URL = process.env.ADMIN_URL || 'https://t.me/username_admin_anda';

// URL Gambar untuk pesan selamat datang. Anda bisa menggantinya dengan gambar lain.
const WELCOME_IMAGE_URL = 'https://placehold.co/1280x720/FF0000/FFFFFF/png?text=YouTube+WebApp&font=roboto';

// --- Logika Bot ---

// Perintah /start
bot.start((ctx) => {
  // Teks caption dengan format HTML untuk gaya
  const caption = `<b>Selamat Datang di YouTube WebApp Bot!</b>
  
<i>Temukan dan putar video YouTube favoritmu langsung dari Telegram.</i>

Klik tombol di bawah untuk memulai petualanganmu atau dukung kami melalui donasi. Terima kasih! 🙏`;

  // Mengirim pesan dengan foto, caption, dan tombol-tombol inline
  ctx.replyWithPhoto(
    { url: WELCOME_IMAGE_URL }, // Sumber gambar
    {
      caption: caption,
      parse_mode: 'HTML', // Mengaktifkan format HTML untuk teks (<b>, <i>, dll.)
      reply_markup: {
        inline_keyboard: [
          // Baris 1: Tombol utama untuk membuka Web App
          [
            {
              text: "🌐 Buka YouTube Player",
              web_app: { url: WEBAPP_URL },
            },
          ],
          // Baris 2: Tombol Donasi dan Chat Admin berdampingan
          [
            { text: "💰 Donasi", url: DONATE_URL },
            { text: "💬 Chat Admin", url: ADMIN_URL },
          ],
        ],
      },
    }
  );
});

// Jalankan bot
bot.launch();
console.log("🤖 Bot aktif...");
