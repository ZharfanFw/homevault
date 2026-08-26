# 🏦 HomeVault

**HomeVault** adalah aplikasi pelacak keuangan pribadi & keluarga mandiri (*Self-Hosted Personal & Family Finance Tracker*) yang cepat, ringan, dan dioptimalkan sebagai **Progressive Web App (PWA)** untuk perangkat iOS (iPhone) dan home-server.

---

## ✨ Fitur Utama

- ⚡ **Pencatatan Super Cepat (*Quick Logging* < 10 Detik):** Bottom sheet ramah jempol dengan tombol shortcut nominal cepat (`+10rb`, `+50rb`, `+100rb`, `000`).
- 🔒 **100% Privat & Multi-User Terisolasi:** Setiap anggota keluarga memiliki akun tersendiri. Data saldo, dompet, dan mutasi terisolasi penuh.
- 📱 **Optimal untuk iOS PWA:** Tampilan *standalone*, mendukung *safe area insets* (Notch & Dynamic Island), icon home screen, dan sesi login awet (90 hari).
- 💳 **Manajemen Dompet Dinamis:** Dukungan Bank, E-Wallet, Uang Tunai, Kartu Kredit dengan kalkulasi saldo dinamis realtime dan fitur arsip.
- 📊 **Visual Analytics & Laporan:** Net Worth, arus kas bulanan, breakdown pengeluaran per kategori, dan grafik tren pengeluaran harian.
- 🎯 **Budgeting Bulanan:** Pasang target anggaran per kategori dengan progress bar indikator warna (Hijau, Kuning, Merah).
- 📥 **Ekspor CSV (Excel):** Unduh riwayat transaksi dalam format CSV (UTF-8 BOM) yang langsung kompatibel dengan Excel dan Google Sheets.
- 🛡️ **Kendali Admin:** User pertama otomatis menjadi Admin dan dapat mengunci pendaftaran akun baru.
- 🐳 **Self-Hosted & Hemat Resource:** Berjalan di home-server dengan konsumsi memori rendah (< 150MB RAM).

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS + Lucide Icons (Glassmorphic Dark Mode)
- **Database:** SQLite (`better-sqlite3`) + Drizzle ORM
- **Autentikasi:** Session Auth (Signed JWT) + `bcryptjs`
- **Deployment:** Docker & Docker Compose

---

## 🚀 Cara Menjalankan

### Menggunakan Docker Compose (Direkomendasikan)

1. Clone repositori:
   ```bash
   git clone git@github.com:ZharfanFw/homevault.git
   cd homevault
   ```

2. Jalankan dengan Docker Compose:
   ```bash
   docker compose up -d --build
   ```

3. Buka browser di `http://localhost:3000` (atau IP home-server Anda). Database SQLite otomatis tersimpan di `./data/finance.db`.

---

### Menjalankan Secara Lokal (Node.js)

1. Pastikan terinstal **Node.js v20+ LTS**.
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
4. Buka `http://localhost:3000`.

---

## 📱 Cara Pasang di iPhone (iOS PWA)

1. Buka aplikasi di Safari: `http://<ip-server-anda>:3000`
2. Tekan tombol **Share** (ikon kotak dengan panah ke atas) di bagian bawah Safari.
3. Pilih **"Add to Home Screen"** (*Tambah ke Layar Utama*).
4. Beri nama **HomeVault** dan tekan **Add**.
5. Buka dari Home Screen untuk pengalaman aplikasi fullscreen tanpa address bar.

---

## 📄 Lisensi

MIT License © 2026 ZharfanFw
