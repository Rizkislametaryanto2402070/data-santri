'use strict';

// Aturan Nomor Induk Santri (NIS) dan urutan santri. Berisi fungsi murni (tanpa
// database), supaya mudah diuji dan dipakai ulang oleh db.js dan excel.js.
//
// Format NIS diatur di Pengaturan, memakai kode:
//   {ANGKATAN}  nama angkatan (disarankan berupa tahun, mis. 2024)  -- wajib
//   {JK}        1 untuk Putra, 2 untuk Putri
//   {LP}        L untuk Putra, P untuk Putri
//   {URUT:3}    nomor urut, diisi angka nol di depan sampai 3 digit  -- wajib, tepat satu
//
// Aturan nomor urut:
//   - Jika format memuat {JK} atau {LP}, urutan dimulai dari 1 lagi untuk Putra dan Putri.
//   - Jika tidak, urutan berjalan satu per angkatan: Putra dulu, lalu Putri.
// Dengan aturan ini nomor tidak mungkin kembar.

const FORMAT_BAWAAN = '{ANGKATAN}-{JK}-{URUT:3}';
const KODE = { JK: { Putra: '1', Putri: '2' }, LP: { Putra: 'L', Putri: 'P' } };
const URUTAN_JK = { Putra: 0, Putri: 1 };
const SUMBER_TOKEN = '\\{([A-Z]+)(?::(\\d+))?\\}';
const tokenBaru = () => new RegExp(SUMBER_TOKEN, 'g');

function periksa(format) {
  const f = String(format || '').trim();
  if (!f) return { ok: false, error: 'Format tidak boleh kosong.' };
  if (f.length > 40) return { ok: false, error: 'Format terlalu panjang (maksimal 40 karakter).' };

  const hitung = { ANGKATAN: 0, URUT: 0 };
  let salah = null;
  const sisa = f.replace(tokenBaru(), (_m, nama, lebar) => {
    if (nama === 'ANGKATAN' || nama === 'JK' || nama === 'LP') {
      if (lebar) salah = salah || `Kode {${nama}} tidak memakai angka.`;
    } else if (nama === 'URUT') {
      if (lebar && (Number(lebar) < 1 || Number(lebar) > 8)) salah = salah || 'Jumlah digit {URUT} harus 1 sampai 8.';
    } else {
      salah = salah || `Kode {${nama}} tidak dikenal. Yang tersedia: {ANGKATAN}, {JK}, {LP}, {URUT:3}.`;
    }
    if (nama in hitung) hitung[nama] += 1;
    return '';
  });

  if (salah) return { ok: false, error: salah };
  if (hitung.URUT !== 1) return { ok: false, error: 'Format harus memuat tepat satu {URUT}, misalnya {URUT:3}.' };
  if (hitung.ANGKATAN < 1) return { ok: false, error: 'Format harus memuat {ANGKATAN} supaya nomor tidak kembar antar angkatan.' };
  if (/[{}]/.test(sisa)) return { ok: false, error: 'Tanda { } hanya untuk kode seperti {ANGKATAN}. Tulis kode dengan huruf besar.' };
  if (!/^[A-Za-z0-9 ._\-/]*$/.test(sisa)) {
    return { ok: false, error: 'Selain kode, hanya huruf, angka, spasi, titik, strip, garis miring, dan garis bawah yang boleh dipakai.' };
  }
  return { ok: true, format: f };
}

function perJk(format) {
  return /\{(JK|LP)\}/.test(format);
}

function bentuk(format, { angkatan, jenisKelamin, urut }) {
  return format.replace(tokenBaru(), (_m, nama, lebar) => {
    if (nama === 'ANGKATAN') return String(angkatan === null || angkatan === undefined ? '' : angkatan).trim();
    if (nama === 'JK') return KODE.JK[jenisKelamin] || '';
    if (nama === 'LP') return KODE.LP[jenisKelamin] || '';
    return String(urut).padStart(lebar ? Number(lebar) : 3, '0');
  });
}

const lolos = (s) => s.replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&');

// Ekspresi reguler untuk mengenali nomor yang sudah ada di satu kelompok
// (angkatan, dan jenis kelamin jika format memuatnya). Tangkapan 1 = nomor urut.
function pola(format, grup) {
  const t = tokenBaru();
  let re = '';
  let akhir = 0;
  let m;
  while ((m = t.exec(format))) {
    re += lolos(format.slice(akhir, m.index));
    akhir = m.index + m[0].length;
    re += m[1] === 'URUT' ? '(\\d+)' : lolos(bentuk(m[0], { ...grup, urut: 0 }));
  }
  re += lolos(format.slice(akhir));
  return new RegExp('^' + re + '$');
}

function urutTertinggi(format, grup, daftarNis) {
  const re = pola(format, grup);
  let maks = 0;
  for (const n of daftarNis) {
    const m = re.exec(String(n || ''));
    if (m) maks = Math.max(maks, parseInt(m[1], 10));
  }
  return maks;
}

// ---------------------------------------------------------------- urutan

const bandingNama = (a, b) => String(a || '').localeCompare(String(b || ''), 'id', { sensitivity: 'base' });

// Angkatan terbaru di atas (2026, 2025, ...).
const bandingAngkatan = (a, b) => String(b || '').localeCompare(String(a || ''), 'id', { numeric: true });

const bandingJk = (a, b) => (URUTAN_JK[a] ?? 9) - (URUTAN_JK[b] ?? 9);

// Angkatan, lalu Putra sebelum Putri, lalu abjad nama.
function bandingSantri(a, b) {
  return (
    bandingAngkatan(a.angkatan, b.angkatan) ||
    bandingJk(a.jenis_kelamin, b.jenis_kelamin) ||
    bandingNama(a.nama, b.nama) ||
    (a.id || 0) - (b.id || 0)
  );
}

// Susunan nomor untuk SATU angkatan: Putra A-Z, lalu Putri A-Z.
function rencanaUrut(format, angkatan, baris) {
  const urut = baris
    .slice()
    .sort((a, b) => bandingJk(a.jenis_kelamin, b.jenis_kelamin) || bandingNama(a.nama, b.nama) || (a.id || 0) - (b.id || 0));
  const pj = perJk(format);
  const hitung = { Putra: 0, Putri: 0 };
  let berjalan = 0;
  return urut.map((r) => {
    const n = pj ? ++hitung[r.jenis_kelamin] : ++berjalan;
    return { id: r.id, nis: bentuk(format, { angkatan, jenisKelamin: r.jenis_kelamin, urut: n }) };
  });
}

// Contoh nomor untuk ditampilkan di Pengaturan.
function contoh(format, angkatan) {
  const label = { 1: 'Putra pertama (A-Z)', 2: 'Putra kedua', 3: 'Putri pertama (A-Z)' };
  return rencanaUrut(format, angkatan, [
    { id: 1, nama: 'Abdullah', jenis_kelamin: 'Putra' },
    { id: 2, nama: 'Budi', jenis_kelamin: 'Putra' },
    { id: 3, nama: 'Aisyah', jenis_kelamin: 'Putri' }
  ]).map((r) => ({ label: label[r.id], nis: r.nis }));
}

module.exports = {
  FORMAT_BAWAAN, periksa, perJk, bentuk, pola, urutTertinggi,
  bandingNama, bandingAngkatan, bandingJk, bandingSantri, rencanaUrut, contoh
};
