# Laritta Bakery - Team Task Manager

Aplikasi manajemen tugas tim berbasis web dengan backend Google Sheets. Aplikasi ini dirancang untuk membantu mengelola tugas tim di Laritta Bakery dengan fitur:

- ✅ Manajemen tugas (Insidentil, Harian, Mingguan, Bulanan)
- 📊 Dashboard KPI Bulanan
- 👥 Master Data Tim dengan Hirarki
- 🎯 Problem Solving (WPS) Tracking
- 🔐 Role-Based Access Control (Manager/PA/Staff)
- 📱 Responsive Design (Mobile & Desktop)

## 🚀 Cara Setup

### Bagian 1: Setup Google Sheets Backend

1. **Buat Google Spreadsheet Baru**
   - Buka https://sheets.google.com
   - Klik "Blank" untuk membuat spreadsheet baru
   - Beri nama: "Laritta Task Manager Database"

2. **Buat 3 Sheet dengan Nama Berikut:**
   - `MasterData` - untuk data anggota tim
   - `Tasks` - untuk tugas reguler
   - `WPSTasks` - untuk tugas problem solving

   **PENTING:** Nama sheet harus PERSIS seperti di atas (case sensitive)

3. **Setup Google Apps Script**
   - Di Google Spreadsheet, klik menu **Extensions > Apps Script**
   - Hapus code default yang ada
   - Copy semua isi file `Code.gs` dari repository ini
   - Paste ke Apps Script editor
   - Klik **Save** (ikon disket) dan beri nama project: "Laritta Task Manager API"

4. **Deploy Web App**
   - Di Apps Script editor, klik **Deploy > New deployment**
   - Klik ikon ⚙️ (gear) di samping "Select type"
   - Pilih **Web app**
   - Isi pengaturan:
     - **Description:** "Laritta Task Manager API v1"
     - **Execute as:** Me (your email)
     - **Who has access:** Anyone
   - Klik **Deploy**
   - **PENTING:** Copy **Web app URL** yang muncul (akan terlihat seperti: `https://script.google.com/macros/s/ABC123.../exec`)
   - Klik **Done**

5. **Authorize Script**
   - Saat pertama kali deploy, Google akan meminta authorization
   - Klik **Authorize access**
   - Pilih akun Google Anda
   - Klik **Advanced** jika muncul warning
   - Klik **Go to [Project Name] (unsafe)**
   - Klik **Allow**

### Bagian 2: Setup Frontend (GitHub Pages)

#### Opsi A: Menggunakan GitHub Desktop (Mudah untuk Pemula)

1. **Install GitHub Desktop**
   - Download dari https://desktop.github.com
   - Install dan login dengan akun GitHub Anda

2. **Create Repository**
   - Buka GitHub Desktop
   - Klik **File > New Repository**
   - Isi:
     - Name: `laritta-task-manager`
     - Local Path: Pilih folder di komputer Anda
   - Klik **Create Repository**

3. **Add Files**
   - Copy 3 file ke folder repository:
     - `index.html`
     - `app.js`
     - `README.md`
   
4. **Edit app.js**
   - Buka file `app.js` dengan text editor
   - Cari baris:
     ```javascript
     const SCRIPT_URL = 'GANTI_DENGAN_URL_WEB_APP_ANDA';
     ```
   - Ganti dengan URL Web App dari Google Apps Script (langkah 4 di atas)
   - Save file

5. **Commit & Publish**
   - Kembali ke GitHub Desktop
   - Akan muncul daftar perubahan
   - Isi commit message: "Initial commit"
   - Klik **Commit to main**
   - Klik **Publish repository**
   - Pastikan **Keep this code private** TIDAK dicentang (kecuali Anda ingin private)
   - Klik **Publish Repository**

6. **Enable GitHub Pages**
   - Buka browser, buka https://github.com
   - Buka repository `laritta-task-manager`
   - Klik **Settings**
   - Di sidebar kiri, klik **Pages**
   - Di bagian "Source", pilih:
     - Branch: **main**
     - Folder: **/ (root)**
   - Klik **Save**
   - Tunggu beberapa menit, lalu refresh halaman
   - URL aplikasi Anda akan muncul (format: `https://[username].github.io/laritta-task-manager`)

#### Opsi B: Menggunakan Git Command Line

1. **Install Git**
   ```bash
   # Windows: Download dari https://git-scm.com
   # Mac: brew install git
   # Linux: sudo apt install git
   ```

2. **Setup Repository**
   ```bash
   mkdir laritta-task-manager
   cd laritta-task-manager
   git init
   ```

3. **Add Files**
   - Copy 3 file (`index.html`, `app.js`, `README.md`) ke folder ini
   - Edit `app.js` dan ganti `SCRIPT_URL` dengan URL Web App Anda

4. **Commit dan Push**
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/[username]/laritta-task-manager.git
   git push -u origin main
   ```

5. **Enable GitHub Pages**
   - Ikuti langkah 6 dari Opsi A

## 📱 Cara Menggunakan Aplikasi

### Login Pertama Kali

1. Buka URL aplikasi Anda di browser
2. Pilih nama dari dropdown (akan muncul daftar dari Master Data)
3. Masukkan password: `123456`
4. Klik **Login ke Sistem**

**Default Users:**
- Faris (MANAGER)
- Leony (PA)
- Dea, Yulia, Laila, Budi, Ely, Isa, Ita, Sita (STAFF)
- Dan lainnya sesuai struktur tim

### Fitur-Fitur Utama

#### 1. Input Tugas (Sheet 1)
- Pilih jenis tugas: Insidentil, Harian, Mingguan, atau Bulanan
- Tugas berulang otomatis dibuat untuk 12 bulan ke depan
- Multi-PIC: Pilih beberapa orang sekaligus (CTRL/CMD + Klik)
- Setiap PIC akan mendapat tugas terpisah

#### 2. List Tugas Tim (Sheet 2)
- Filter tugas berdasarkan jenis
- Accordion per PIC dengan status jumlah tugas
- Tandai tugas selesai/belum selesai
- Lihat deskripsi dan link pendukung

#### 3. Laporan KPI (Sheet 3)
- Filter berdasarkan bulan
- Filter berdasarkan leader tim (melihat tim dan sub-tim)
- Skor KPI 1-5 otomatis
- Ranking: Top Performance, Good, Support, Butuh Partisipan

#### 4. Master Data (Sheet 4) - Manager/PA Only
- Tambah/edit anggota tim
- Atur hirarki (Reporting To)
- Set role: Manager, PA, atau Staff

#### 5. Problem Solving (Sheet 5) - Manager/PA Only
- Buat tugas WPS yang berulang setiap minggu
- Otomatis 52 minggu (1 tahun)
- Due date otomatis Jumat 17:00
- Manager/PA bisa set status Goal: Tercapai/Gagal

## 🔧 Troubleshooting

### "Gagal menghubungkan ke Google Sheets"
- ✅ Pastikan URL Web App sudah benar di `app.js`
- ✅ Pastikan Web App sudah di-deploy dengan setting "Anyone" can access
- ✅ Coba deploy ulang Web App dengan versi baru

### "Nama pengguna tidak ditemukan"
- ✅ Pastikan nama ada di Sheet `MasterData`
- ✅ Periksa ejaan nama (case sensitive)
- ✅ Refresh halaman dan coba lagi

### Data tidak muncul/tidak update
- ✅ Periksa Sheet names sudah benar: `MasterData`, `Tasks`, `WPSTasks`
- ✅ Buka Google Sheets, cek apakah data masuk
- ✅ Clear cache browser atau coba browser lain

### GitHub Pages tidak muncul
- ✅ Tunggu 5-10 menit setelah enable GitHub Pages
- ✅ Pastikan repository public (jika ingin public URL)
- ✅ Cek Settings > Pages, pastikan source branch sudah di-set

## 🔒 Keamanan

**PENTING:**
- Password default adalah `123456` untuk SEMUA user
- Ini adalah aplikasi demo, gunakan hanya untuk data non-sensitif
- Jika ingin production:
  1. Implementasi authentication yang proper
  2. Gunakan environment variables untuk sensitive data
  3. Set Google Sheets permissions dengan benar
  4. Pertimbangkan membuat repository private

## 📊 Struktur Data Google Sheets

### Sheet: MasterData
| name | role | reportingTo |
|------|------|-------------|
| Faris | MANAGER | N/A |
| Leony | PA | Faris |
| Dea | STAFF | Faris |

### Sheet: Tasks
| id | title | description | link | type | assignedTo | assignedBy | dueDate | isComplete | completedAt | createdAt |
|----|-------|-------------|------|------|------------|------------|---------|------------|-------------|-----------|

### Sheet: WPSTasks
| id | title | description | link | type | assignedTo | assignedBy | dueDate | isComplete | completedAt | goalAchieved | createdAt |
|----|-------|-------------|------|------|------------|------------|---------|------------|-------------|--------------|-----------|

## 🆘 Support

Jika mengalami kendala:
1. Cek bagian Troubleshooting di atas
2. Periksa Console browser (F12) untuk error messages
3. Periksa Google Apps Script logs: Apps Script > Executions

## 📝 Lisensi

Aplikasi ini dibuat khusus untuk Laritta Bakery. Silakan modifikasi sesuai kebutuhan Anda.

## 🎯 Roadmap

Fitur yang bisa ditambahkan:
- [ ] Email notifications untuk deadline
- [ ] Export data ke Excel
- [ ] Grafik visualisasi performa tim
- [ ] Mobile app (React Native/Flutter)
- [ ] Integration dengan WhatsApp Bot
- [ ] Advanced analytics dashboard

---

**Made with ❤️ for Laritta Bakery**
