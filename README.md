# 🏦 HomeVault

**HomeVault** adalah aplikasi pelacak keuangan pribadi & keluarga mandiri (*Self-Hosted Personal & Family Finance Tracker*) yang cepat, ringan, dan dioptimalkan sebagai **Progressive Web App (PWA)** untuk perangkat iOS (iPhone) dan home-server.

---

## ✨ Fitur Utama

- ⚡ **Pencatatan Super Cepat (*Quick Logging* < 10 Detik):** Bottom sheet ramah jempol dengan tombol shortcut nominal cepat (`+10rb`, `+50rb`, `+100rb`, `000`).
- 🔒 **100% Privat & Multi-User Terisolasi:** Setiap anggota keluarga memiliki akun tersendiri. Data saldo, dompet, dan mutasi terisolasi penuh.
- 📱 **Optimal untuk iOS PWA:** Tampilan *standalone*, mendukung *safe area insets* (Notch & Dynamic Island), icon home screen, dan sesi login awet (90 hari).
- 🎨 **Nord Theme Palette:** Antarmuka elegan, modern, dan nyaman di mata dengan palet warna Nord Theme.
- 💳 **Manajemen Dompet Dinamis:** Dukungan Bank, E-Wallet, Uang Tunai, Kartu Kredit dengan kalkulasi saldo dinamis realtime dan fitur arsip.
- 📊 **Visual Analytics & Laporan:** Net Worth, arus kas bulanan, breakdown pengeluaran per kategori, dan grafik tren pengeluaran harian.
- 🎯 **Budgeting Bulanan:** Pasang target anggaran per kategori dengan progress bar indikator warna (Hijau, Kuning, Merah).
- 📥 **Ekspor CSV (Excel):** Unduh riwayat transaksi dalam format CSV (UTF-8 BOM) yang langsung kompatibel dengan Excel dan Google Sheets.
- 🛡️ **Kendali Admin:** User pertama otomatis menjadi Admin dan dapat mengunci pendaftaran akun baru.
- 🤖 **Automated CI/CD via GitHub Actions:** Otomatis build image Docker multi-arch (`linux/amd64`, `linux/arm64`) dan publish ke GitHub Container Registry (GHCR). Home-server cukup lakukan `docker compose pull` tanpa perlu build lokal yang berat.
- 🐳 **Self-Hosted & Hemat Resource:** Berjalan di home-server dengan konsumsi memori sangat rendah (< 120MB RAM).

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS + Lucide Icons (Nord Theme)
- **Database:** SQLite (`better-sqlite3`) + Drizzle ORM (WAL Mode)
- **Autentikasi:** Session Auth (Signed JWT) + `bcryptjs`
- **CI/CD & Registry:** GitHub Actions & GitHub Container Registry (`ghcr.io`)
- **Deployment:** Docker & Docker Compose

---

## 🚀 Cara Menjalankan di Home-Server

### 1. Menjalankan Container (Otomatis via GHCR)

1. Clone repositori:
   ```bash
   git clone git@github.com:ZharfanFw/homevault.git
   cd homevault
   ```

2. Jalankan dengan Docker Compose (mengunduh pre-built image dari GHCR):
   ```bash
   docker compose pull
   docker compose up -d
   ```

3. Buka browser di `http://<ip-homeserver>:3050` (atau `http://localhost:3050`).
   Database SQLite otomatis tersimpan persisten di `./data/finance.db`.

---

### 2. Memperbarui Versi Terbaru di Home-Server (Super Cepat)

Setiap ada commit baru di `main`, GitHub Actions otomatis mem-build image baru di cloud. Di home-server Anda cukup jalankan:

```bash
cd ~/srv/apps/finance-tracker
docker compose pull && docker compose up -d
```
*(Proses update hanya memakan waktu 2-3 detik tanpa membebani CPU/RAM home-server Anda)*.

---

### 3. Menjalankan Secara Lokal untuk Development (Node.js)

1. Pastikan terinstal **Node.js v22+ LTS**.
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

1. Buka aplikasi di Safari: `http://<ip-homeserver>:3050`
2. Tekan tombol **Share** (ikon kotak dengan panah ke atas) di bagian bawah Safari.
3. Pilih **"Add to Home Screen"** (*Tambah ke Layar Utama*).
4. Beri nama **HomeVault** dan tekan **Add**.
5. Buka dari Home Screen untuk pengalaman aplikasi fullscreen tanpa address bar.

---

## 📄 Lisensi

MIT License © 2026 ZharfanFw
