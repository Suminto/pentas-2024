# Year Book Alumni SMP BPK Penabur 2024

Website buku tahunan digital untuk Alumni SMP BPK Penabur angkatan 2024.
Dibuat dengan HTML/CSS/JavaScript murni (tanpa framework/build step) +
admin panel Decap CMS, deploy ke Netlify — sama seperti stack website
lain yang sudah pernah dibuat (Atomy, math education site, dll).

---

## 📁 Struktur Folder

```
yearbook-project/
├── index.html              -> Halaman utama website
├── netlify.toml             -> Konfigurasi Netlify
├── admin/
│   ├── index.html           -> Halaman admin panel (Decap CMS)
│   └── config.yml           -> Konfigurasi field admin panel
├── assets/
│   ├── css/style.css        -> Semua styling
│   └── js/main.js           -> Logic render data + interaktivitas
├── content/                 -> DATA WEBSITE (diedit lewat admin panel)
│   ├── settings.json        -> Judul, tagline
│   ├── alumni.json          -> Data profil alumni
│   ├── galeri-foto.json     -> Data galeri foto
│   ├── galeri-video.json    -> Data galeri video
│   └── kesan-pesan.json     -> Data kesan & pesan
└── images/uploads/          -> Tempat foto hasil upload disimpan
```

---

## 🚀 Langkah Deploy ke Netlify

### 1. Push ke GitHub
Sama seperti project sebelumnya — buat repo baru di GitHub (misal `yearbook-alumni-2024`),
lalu push seluruh folder ini lewat GitHub Desktop atau `git push`.

### 2. Hubungkan ke Netlify
1. Login ke [app.netlify.com](https://app.netlify.com)
2. **Add new site → Import an existing project → Deploy with GitHub**
3. Pilih repo `yearbook-alumni-2024`
4. Build command: **kosongkan**, Publish directory: **`.`** (titik saja)
5. Klik **Deploy**

### 3. Aktifkan Netlify Identity (WAJIB untuk admin panel)
Ini langkah yang berbeda dari project sebelumnya karena yearbook ini
butuh **login** untuk admin panel:

1. Di dashboard site Netlify → buka tab **Identity**
2. Klik **Enable Identity**
3. Di bagian **Registration**, pilih **Invite only** (supaya bukan
   orang sembarangan bisa daftar jadi admin)
4. Scroll ke **Services** → klik **Enable Git Gateway**
   (ini yang menghubungkan admin panel ke repo GitHub Bapak)

### 4. Undang Admin (Bapak sendiri / panitia)
1. Masih di tab **Identity** → klik **Invite users**
2. Masukkan email Bapak (atau email panitia lain yang akan bantu isi konten)
3. Cek email undangan → klik link → buat password
4. Setelah itu, buka `https://nama-site-bapak.netlify.app/admin/`
   dan login pakai email + password tadi

### 5. Mulai Isi Konten
Setelah login ke `/admin/`, Bapak akan lihat 5 menu:
- **Pengaturan Umum** — judul & tagline website
- **Profil Alumni** — tambah/edit/hapus data tiap alumni (nama, kelas 9A/9B, foto, kesan, cita-cita)
- **Galeri Foto** — upload foto per kategori (Wisuda, Study Tour, Class Meeting, Perpisahan)
- **Galeri Video** — tempel link YouTube video kenangan
- **Kesan & Pesan** — tulis pesan dari guru/wali kelas/alumni

Setiap kali disimpan (**Save**), Decap CMS otomatis push perubahan ke
GitHub, lalu Netlify otomatis rebuild — biasanya perubahan muncul di
website dalam 30 detik - 1 menit.

---

## 🖼️ Tentang Foto

Foto yang diupload lewat admin panel disimpan ke folder `images/uploads/`.
**Sebelum upload, kompres dulu foto pakai script `kompres_foto.py`** yang
sudah dibuat sebelumnya, supaya website tetap ringan diakses dari HP.

Untuk video, **jangan upload file video langsung** — cukup tempel link
YouTube (bisa video unlisted kalau mau semi-privat) di menu Galeri Video.

---

## 🧪 Testing Lokal (opsional)

Karena website ini mengambil data lewat `fetch()`, tidak bisa dibuka
langsung dengan klik dua kali file `index.html` (akan gagal karena
browser memblokir fetch dari `file://`). Perlu server lokal sederhana:

```bash
# Kalau ada Node.js:
npx serve .

# Atau kalau ada Python:
python3 -m http.server 8000
```

Lalu buka `http://localhost:8000` (atau port yang muncul) di browser.

Setelah di-deploy ke Netlify, semua otomatis berjalan normal tanpa
perlu server lokal.

---

## ✏️ Kelas yang Tersedia

Saat ini pilihan kelas di admin panel hanya **9A** dan **9B**. Kalau
nanti ada tambahan kelas, tinggal edit bagian `options` di file
`admin/config.yml` pada collection **alumni**.

---

Suminto with Claude
