# Panduan Teknis: Data Santri

> Catatan lengkap untuk pengembang dan pengurus: cara membangun `.exe`, lokasi data, serah terima, format Nomor Induk Santri, dan status pengujian. Ringkasan proyek ada di [README](../README.md).

Aplikasi desktop **offline** untuk mengelola data santri pondok pesantren. Satu pengguna, satu laptop, tanpa internet. Berjalan di Windows 10/11 dan dikemas menjadi file `.exe`.

**Teknologi:** Electron · React · Tailwind CSS · SQLite (sql.js) · ExcelJS · electron-builder

---

## Fitur

- Data santri lengkap: identitas, wali, angkatan, kelas, asrama, status (Aktif, Alumni, Boyong, Pindah), catatan, dan foto
- **Nomor Induk Santri otomatis** dengan format yang bisa diatur sendiri (lihat bagian di bawah)
- Daftar santri per angkatan, dipisah blok **Putra** dan **Putri**, tiap blok urut **A–Z**
- Pencarian cepat (nama, nomor induk, nama wali) dan filter angkatan, status, kelas, asrama, jenis kelamin
- **Export Excel:** semua santri, per angkatan, sesuai hasil filter, atau santri tertentu yang dicentang di daftar (berguna untuk lomba dsb.); pilihan kolom; opsi satu sheet per angkatan
- **Import Excel** dari template, dengan pratinjau dan penanda baris bermasalah
- **Backup & Restore** satu klik (satu file `.db`), plus backup otomatis ke folder pilihan setiap aplikasi ditutup
- Dashboard ringkasan, password opsional (dengan kode pemulihan)
- Foto maksimal 500 KB, otomatis diperkecil agar database tetap ringan
- Sepenuhnya offline: font dan semua pustaka dibundel di dalam aplikasi

---

## Membuat file `.exe`

Ada dua cara. Keduanya butuh internet **satu kali** untuk mengunduh pustaka; aplikasi hasilnya tidak butuh internet sama sekali.

### Cara 1: GitHub Actions (tanpa memasang apa pun di laptop)

1. Unggah folder proyek ini ke repositori GitHub (boleh privat).
2. Buka tab **Actions**, pilih **Build Data Santri (Windows)**, klik **Run workflow**.
3. Tunggu sekitar 5–10 menit, lalu unduh hasilnya di bagian **Artifacts** (`DataSantri-Windows`).

Isinya dua file:
- `DataSantri-Setup-1.0.0.exe`: installer biasa
- `DataSantri-Portable-1.0.0.exe`: versi portable, bisa dijalankan dari flashdisk tanpa instalasi

### Cara 2: Build di laptop Windows

Pasang **Node.js 22 LTS** (nodejs.org), lalu di folder proyek:

```
npm install
npm run dist
```

Hasilnya ada di folder `release/`.

Sebelum memasang, aplikasi hasil build bisa dites langsung tanpa instalasi dengan membuka `release\win-unpacked\Data Santri.exe`. Kalau jendela aplikasi terbuka normal, `Setup.exe` aman dipasang.

Versi electron-builder dikunci ke `26.0.13`. Versi 25.1.8 dan 26.0.12 diketahui kadang tidak menyertakan pustaka turunan ke dalam aplikasi, sehingga muncul error `Cannot find module ...` setelah dipasang.

### Menjalankan untuk pengembangan

```
npm install
npm run dev      # buka aplikasi dengan live reload
npm run start    # build tampilan lalu buka aplikasi
```

### Ikon aplikasi

Ikon aplikasi (file `.exe`, installer, pintasan Desktop, dan taskbar) memakai logo pondok di `build/icon.ico` (file `.exe`, installer, pintasan) dan `electron/ikon.png` (ikon jendela aplikasi). Untuk menggantinya, timpa kedua file itu dengan `.ico` dan `.png` baru (minimal 256×256 px, sebaiknya memuat beberapa ukuran) lalu build ulang.

---

## Peringatan Windows SmartScreen

File `.exe` tanpa tanda tangan digital (sertifikat berbayar) akan memunculkan layar biru **"Windows protected your PC"** di laptop lain. Ini normal. Klik **More info**, lalu **Run anyway**. Sebagian antivirus bisa ikut memberi peringatan palsu untuk alasan yang sama.

---

## Lokasi data

| Jenis | Lokasi data |
|---|---|
| Installer | `C:\Users\<nama>\AppData\Roaming\Data Santri\data\santri.db` |
| Portable | Folder `DataSantri-Data` di sebelah file `.exe` |

Data **tidak ikut terhapus** saat aplikasi di-update atau di-uninstall. Menu **Backup & Restore → Buka Folder Data** membuka lokasi ini.

---

## Serah terima ke pengganti pengurus

1. Di laptop lama: menu **Backup & Restore → Backup Sekarang**, simpan file `.db`.
2. Kirim file backup dan `DataSantri-Setup-x.x.x.exe` lewat flashdisk atau WhatsApp.
3. Di laptop baru: pasang aplikasi, buka **Backup & Restore → Pulihkan dari File Backup**, pilih file `.db`.
4. Pengganti sebaiknya membuat password baru di **Pengaturan**.

> File backup berisi data pribadi anak-anak (NIK, alamat, data wali). Simpan di tempat yang aman dan jangan dibagikan sembarangan. Password aplikasi hanya mengunci tampilan; file `santri.db` dan file backup **tidak dienkripsi**.

Update aplikasi dilakukan manual: kirim `Setup.exe` versi baru dan pasang di atas yang lama. Data tetap aman.

---

## Nomor Induk Santri

Nomor induk menggantikan kolom "No" di daftar dan di Excel. Format diatur di **Pengaturan → Format Nomor Induk Santri**, dengan kode:

| Kode | Arti |
|---|---|
| `{ANGKATAN}` | Nama angkatan (tulis sebagai tahun, mis. 2024). **Wajib** |
| `{JK}` | 1 = Putra, 2 = Putri |
| `{LP}` | L = Putra, P = Putri |
| `{URUT:3}` | Nomor urut, diisi nol di depan sampai 3 digit. **Wajib**, tepat satu |

Format bawaan: `{ANGKATAN}-{JK}-{URUT:3}`, misalnya `2024-1-001`.

**Aturan nomor urut**
- Jika format memuat `{JK}` atau `{LP}`, urutan dimulai lagi dari 1 untuk Putra dan Putri.
- Jika tidak, urutan berjalan per angkatan: Putra dulu, lalu Putri.

**Cara kerja**
- Santri baru otomatis mendapat **nomor berikutnya**. Santri lain **tidak digeser**, sehingga nomor yang sudah tercetak di kartu atau dokumen tetap benar.
- Tombol **Urutkan Ulang Nomor Induk** (muncul di Data Santri saat satu angkatan dipilih) menyusun ulang nomor satu angkatan: Putra A–Z, lalu Putri A–Z. Ada pratinjau dan salinan data otomatis (5 terbaru disimpan di folder data). Jalankan hanya jika nomor belum dipakai di dokumen resmi, misalnya sekali setelah penerimaan angkatan selesai.
- Saat impor Excel, baris dengan kolom NIS kosong diberi nomor otomatis **urut abjad**, walau urutan di file acak. Baris yang sudah punya NIS mempertahankan nomornya.
- Jika angkatan atau jenis kelamin santri diubah, nomornya dibuat ulang otomatis kecuali nomor diisi manual.
- Mengubah format **tidak** mengubah nomor yang sudah ada. Terapkan ke santri lama lewat Urutkan Ulang.

---

## Struktur proyek

```
electron/
  main.js      proses utama: jendela, dialog file, saluran IPC, backup otomatis
  preload.js   jembatan aman ke tampilan (hanya saluran yang diizinkan)
  db.js        semua operasi database dan aturan data
  nis.js       format dan urutan nomor induk (fungsi murni)
  excel.js     export, template, dan pembacaan file impor
  skema.js     skema tabel SQLite
src/
  App.jsx      kerangka, menu, kunci aplikasi
  ui.jsx       komponen dasar (tombol, dialog, toast, ikon)
  halaman/     Dashboard, DaftarSantri, FormSantri, ExportDialog, UrutUlang,
               Master, Impor, Backup, Pengaturan, Kunci
```

## Catatan teknis

- Database memakai **sql.js** (SQLite WebAssembly): tidak ada komponen native yang harus dikompilasi. Seluruh database dimuat ke memori dan ditulis ke file `santri.db` setiap ada perubahan, lewat file sementara agar file utama tidak pernah setengah jadi. Untuk ratusan santri ini sangat cepat.
- Foto disimpan di dalam database sebagai gambar JPEG kecil (±360 px). Daftar santri tidak memuat foto, hanya form ubah.
- Jika file `santri.db` rusak, aplikasi memindahkannya (tidak menghapus) ke `santri.db.rusak-...` lalu mulai dari kosong dan memberi tahu pengguna.
- Perubahan struktur tabel di versi berikutnya: tambahkan `ALTER TABLE` di akhir `electron/skema.js`, jangan mengubah tabel yang sudah ada, agar backup lama tetap bisa dibuka.
- Keamanan Electron: `contextIsolation` aktif, `nodeIntegration` mati, `sandbox` aktif, dan ada Content-Security-Policy yang menolak sumber luar.

## Status pengujian

Sudah diuji otomatis (di lingkungan pengembangan tanpa Windows):
- Logika format dan urutan nomor induk (`nis.js`)
- Seluruh logika database (`db.js`): simpan, nomor otomatis, urut ulang, pindah angkatan, impor, format, password, backup, pulihkan, file rusak. Pengujian memakai pengganti sql.js di atas SQLite bawaan Node.
- Sintaks semua file Electron dan semua file tampilan, serta validitas skema SQL
- Tampilan desain baru (acuan: SIMS Santri PP. An Nur Slawi) dirender di Chromium dengan data contoh: Dashboard, Data Santri, dialog Export, Form, Angkatan & Kelas, Import, Backup, Pengaturan; tanpa error di konsol

**Belum diuji, mohon dicoba pada build pertama:**
- Tampilan di jendela Electron yang sebenarnya (ukuran jendela kecil, layar Kunci, dialog pemulihan password)
- Pembuatan dan pembukaan file Excel yang sebenarnya (`excel.js` memakai ExcelJS)
- Dialog simpan/buka file Windows, pemilihan foto, dan pembuatan `.exe` itu sendiri
