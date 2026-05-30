# Wa-bot (Ye-Baileys Edition)

Bot WhatsApp ringan yang dibangun menggunakan library [ye-baileys](https://github.com/yehazkiell/ye-baileys), dioptimalkan untuk penggunaan di lingkungan dengan sumber daya terbatas seperti Android (Termux).

## 🚀 Fitur Utama

- **Pilihan Login**: Mendukung login via **QR Code** atau **Pairing Code**.
- **Ringan & Cepat**: Menghapus dependensi berat (sharp, sqlite3, ffmpeg) agar lancar di mobile.
- **Ye-Baileys Exclusive**: Mendukung tipe pesan khusus seperti Album, Event, Order, Product, dan Newsletter.
- **Struktur Modular**: Kode dipisah menjadi `config.js`, `connection.js`, `handler.js`, dan `index.js`.

## 📦 Instalasi

1. Clone repository ini.
2. Pastikan Anda memiliki Node.js (versi 20 atau lebih baru).
3. Instal dependensi:
   ```bash
   npm install
   ```

## 🛠️ Cara Penggunaan

Jalankan bot dengan perintah:
```bash
node index.js
```

Setelah menjalankan perintah di atas, Anda akan diberikan pilihan di terminal:
1. **QR Code**: Pilih 'n' saat ditanya "Do you want to use Pairing Code?". Scan QR yang muncul menggunakan WhatsApp di HP Anda (Linked Devices).
2. **Pairing Code**: Pilih 'y', masukkan nomor HP Anda (dengan kode negara, contoh: 628123456789), lalu masukkan kode pairing yang muncul di WhatsApp HP Anda.

## 📜 Daftar Perintah (Commands)

Kirim pesan berikut ke bot:

- `ping`: Membalas dengan "pong!".
- `menu`: Menampilkan daftar semua fitur.
- `event`: Mengirim contoh pesan Event (Ye-Baileys exclusive).
- `order`: Mengirim contoh pesan Order/Pesanan.
- `poll`: Mengirim contoh hasil voting/poll.
- `call`: Mengirim contoh pesan panggilan terjadwal.
- `album`: Mengirim beberapa gambar sekaligus dalam satu album.
- `payment`: Mengirim permintaan pembayaran (Request Payment).
- `interactive`: Mengirim pesan interaktif dengan tombol.
- `product`: Mengirim katalog produk.
- `react`: Memberikan reaksi emoji pada pesan Anda.
- `newsletter <jid>`: Mengambil metadata dari JID Newsletter tertentu.

## 📂 Struktur Folder

- `index.js`: Titik masuk utama aplikasi.
- `connection.js`: Menangani koneksi socket dan autentikasi.
- `handler.js`: Menangani logika pesan masuk dan perintah.
- `config.js`: Pengaturan konfigurasi bot.
- `auth_info_baileys/`: Folder penyimpanan sesi (jangan dihapus jika ingin tetap login).

## 📝 Lisensi

Proyek ini menggunakan lisensi MIT.
