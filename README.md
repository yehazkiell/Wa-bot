# Wa-bot (Ye-Baileys Ultimate Edition)

Bot WhatsApp ringan yang dibangun menggunakan library [ye-baileys](https://github.com/yehazkiell/ye-baileys), dioptimalkan untuk penggunaan di lingkungan dengan sumber daya terbatas seperti Android (Termux).

## 🌍 Languages / Bahasa

### 1. 🇮🇩 Indonesian (Original)
Bot WhatsApp ringan dioptimalkan untuk Android/Termux dengan fitur eksklusif Ye-Baileys.

### 2. 🇺🇸 English
A lightweight WhatsApp bot optimized for Android/Termux featuring Ye-Baileys exclusive message types.

... (dan 9 bahasa lainnya di versi lengkap) ...

---

## 🚀 Fitur Utama

- **Pilihan Login**: Mendukung login via **QR Code** atau **Pairing Code**.
- **Ringan & Cepat**: Menghapus dependensi berat agar lancar di mobile.
- **Ultimate Menu**: Perintah terorganisir dengan statistik sistem (Latency & Uptime).
- **Keamanan**: Dilengkapi dengan **Anti-Delete** log dan **Rate Limiter**.
- **Maker Tools**: Membuat sticker dari gambar/video secara instan.

## 📦 Instalasi

1. Clone repository ini.
2. Instal dependensi: `npm install`
3. Jalankan bot: `node index.js`

## 📜 Daftar Perintah Utama

Gunakan prefix dot (`.`) sebelum perintah!

- `.allmenu`: Menampilkan daftar semua fitur lengkap (Group, Download, Maker, Tools, Owner).
- `.sticker`: Membuat sticker dari gambar (balas gambar dengan .sticker).
- `.toimg`: Mengubah sticker kembali menjadi gambar.
- `.ai <tanya>`: Tanya jawab dengan AI.
- `.tts <teks>`: Mengubah teks menjadi suara.

## 📂 Struktur Folder

- `index.js`: Titik masuk utama.
- `connection.js`: Logika koneksi.
- `handler.js`: Logika perintah/commands.
- `config.js`: Pengaturan bot.

## 📝 Lisensi

Proyek ini menggunakan lisensi MIT.
