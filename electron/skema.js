'use strict';

// Skema database SQLite aplikasi Data Santri.
// Aman dijalankan berulang kali (CREATE ... IF NOT EXISTS), jadi file backup
// dari versi lama tetap bisa dibuka. Jika kelak perlu kolom baru, tambahkan
// dengan "ALTER TABLE" di akhir file ini, jangan mengubah tabel yang sudah ada.

module.exports = `
CREATE TABLE IF NOT EXISTS angkatan (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  nama  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS kelas (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  nama  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS asrama (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  nama  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS santri (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  nis            TEXT NOT NULL UNIQUE,
  nisn           TEXT,
  nik            TEXT,
  nama           TEXT NOT NULL,
  jenis_kelamin  TEXT NOT NULL CHECK (jenis_kelamin IN ('Putra', 'Putri')),
  tempat_lahir   TEXT,
  tanggal_lahir  TEXT,
  alamat         TEXT,
  angkatan_id    INTEGER,
  kelas_id       INTEGER,
  asrama_id      INTEGER,
  kamar          TEXT,
  status         TEXT NOT NULL DEFAULT 'Aktif'
                 CHECK (status IN ('Aktif', 'Alumni', 'Boyong', 'Pindah')),
  tanggal_masuk  TEXT,
  catatan        TEXT,
  nama_ayah      TEXT,
  nama_ibu       TEXT,
  nama_wali      TEXT,
  hp_wali        TEXT,
  foto           TEXT,
  dibuat         TEXT,
  diubah         TEXT
);

CREATE INDEX IF NOT EXISTS idx_santri_angkatan ON santri (angkatan_id);
CREATE INDEX IF NOT EXISTS idx_santri_nama ON santri (nama);

CREATE TABLE IF NOT EXISTS pengaturan (
  kunci  TEXT PRIMARY KEY,
  nilai  TEXT
);
`;
