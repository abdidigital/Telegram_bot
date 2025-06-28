const { Telegraf } = require("telegraf");
const ytdl = require("ytdl-core");
const fs = require('fs'); // Mengimpor modul File System dari Node.js
require("dotenv").config();

// --- Konfigurasi ---
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error('"BOT_TOKEN" env var is required!');
const bot = new Telegraf(BOT_TOKEN);

// Tambahkan ADMIN_ID dari file .env Anda. Ini sangat penting untuk fitur admin.
const ADMIN_ID = process.env.ADMIN_ID; 
if (!ADMIN_ID) {
    console.warn("PERINGATAN: Variabel ADMIN_ID tidak diatur. Fitur admin tidak akan berfungsi.");
}

const WEBAPP_URL = process.env.WEBAPP_URL;
const DONATE_URL = process.env.DONATE_URL || 'https://saweria.co/ytplay';
const ADMIN_URL = process.env.ADMIN_URL || 'https://t.me/Kangyanpwk';
const WELCOME_IMAGE_URL = 'https://i.ibb.co/27gPb276/teletube.png'; // URL gambar kustom Anda

// --- Pengaturan Database JSON Sederhana ---
const DB_FILE = './db.json';
let database = {
    users: [], // Menyimpan ID chat semua pengguna
    ads: []    // Menyimpan semua teks iklan
};

// Fungsi untuk memuat database dari file saat bot dimulai
function loadDatabase() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            database = JSON.parse(data);
            console.log(`Database berhasil dimuat. Total pengguna: ${database.users.length}, Total iklan: ${database.ads.length}`);
        } else {
            // Jika file tidak ada, buat file baru dengan struktur default
            saveDatabase();
            console.log("File database baru telah dibuat.");
        }
    } catch (error) {
        console.error("Gagal memuat database:", error);
        // Jika file rusak, mulai dengan database kosong
        database = { users: [], ads: [] };
    }
}

// Fungsi untuk menyimpan perubahan ke file database
function saveDatabase() {
    try {
        // Menggunakan null, 2 untuk membuat format JSON lebih mudah dibaca (pretty-print)
        fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2));
    } catch (error) {
        console.error("Gagal menyimpan database:", error);
    }
}

// --- Logika Bot Utama ---

// Perintah /start
bot.start(async (ctx) => {
    // Simpan ID pengguna baru jika belum ada di database
    const userId = ctx.chat.id;
    if (!database.users.includes(userId)) {
        database.users.push(userId);
        saveDatabase();
        console.log(`Pengguna baru ditambahkan: ${userId}. Total pengguna: ${database.users.length}`);
    }
    
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

// Handler untuk download
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
            await ctx.replyWithVideo({ source: stream, filename: safeFilename }, { caption: `✅ Selesai!\n\n${title}` });
            await ctx.deleteMessage(processingMessage.message_id);
        }
    } catch (error) {
        console.error("Error memproses web_app_data:", error);
        ctx.reply(`Maaf, terjadi kesalahan saat mengunduh video: ${error.message}`);
    }
});

// --- Perintah Khusus Admin ---

// Middleware untuk memeriksa apakah pengguna adalah admin
const isAdmin = (ctx, next) => {
    if (ADMIN_ID && String(ctx.from.id) === String(ADMIN_ID)) {
        return next();
    }
    return ctx.reply('Maaf, perintah ini hanya untuk admin.');
};

// /add_ad [teks iklan]
bot.command('add_ad', isAdmin, (ctx) => {
    const adText = ctx.message.text.split(' ').slice(1).join(' ');
    if (!adText) return ctx.reply('Gunakan format: /add_ad [teks iklan Anda]');
    database.ads.push(adText);
    saveDatabase();
    ctx.reply(`✅ Iklan berhasil ditambahkan!\nTotal iklan sekarang: ${database.ads.length}`);
});

// /list_ads
bot.command('list_ads', isAdmin, (ctx) => {
    if (database.ads.length === 0) return ctx.reply('Belum ada iklan yang ditambahkan.');
    let message = 'Daftar Iklan:\n\n';
    database.ads.forEach((ad, index) => { message += `${index + 1}. ${ad}\n`; });
    ctx.reply(message);
});

// /delete_ad [nomor iklan]
bot.command('delete_ad', isAdmin, (ctx) => {
    const adNumber = parseInt(ctx.message.text.split(' ')[1], 10);
    if (isNaN(adNumber) || adNumber < 1 || adNumber > database.ads.length) {
        return ctx.reply(`Gunakan format: /delete_ad [nomor iklan]. Nomor tidak valid.`);
    }
    const deletedAd = database.ads.splice(adNumber - 1, 1);
    saveDatabase();
    ctx.reply(`🗑️ Iklan nomor ${adNumber} ("${deletedAd}") telah dihapus.`);
});

// --- Logika Siaran (Broadcast) ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function broadcastMessage(text) {
    console.log(`Memulai siaran ke ${database.users.length} pengguna...`);
    let successCount = 0, failureCount = 0;
    for (const userId of database.users) {
        try {
            await bot.telegram.sendMessage(userId, text, { parse_mode: 'HTML' });
            successCount++;
        } catch (error) {
            failureCount++;
            console.error(`Gagal mengirim ke ${userId}:`, error.description);
        }
        await sleep(200); // Jeda 200ms untuk menghindari rate limit
    }
    console.log(`Siaran selesai. Berhasil: ${successCount}, Gagal: ${failureCount}`);
    return { successCount, failureCount };
}

// /broadcast [teks siaran]
bot.command('broadcast', isAdmin, async (ctx) => {
    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text) return ctx.reply('Gunakan format: /broadcast [teks yang ingin dikirim]');
    ctx.reply('Memulai proses siaran manual...');
    const result = await broadcastMessage(text);
    ctx.reply(`Siaran manual selesai.\nBerhasil terkirim: ${result.successCount}\nGagal: ${result.failureCount}`);
});

// --- Penjadwal Iklan Otomatis ---
const AD_INTERVAL_HOURS = 4; // Kirim iklan setiap 4 jam
setInterval(() => {
    if (database.ads.length > 0 && database.users.length > 0) {
        const randomAdIndex = Math.floor(Math.random() * database.ads.length);
        const randomAd = database.ads[randomAdIndex];
        const adMessage = `-- Pesan Sponsor --\n\n${randomAd}\n\nTerima kasih telah menggunakan TeleTube!`;
        broadcastMessage(adMessage);
    }
}, AD_INTERVAL_HOURS * 60 * 60 * 1000);

// --- Jalankan Bot ---
loadDatabase(); // Muat database saat bot pertama kali dijalankan
bot.launch();
console.log("🤖 Bot aktif dan berjalan dengan metode Polling...");
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

                                  
