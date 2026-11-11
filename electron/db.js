'use strict';

// Lapisan database. Memakai sql.js (SQLite versi WebAssembly), sehingga tidak ada
// komponen native yang harus dikompilasi dan aplikasi jalan sepenuhnya offline.
// Seluruh database berada di memori, lalu ditulis ke satu file (santri.db) setiap
// kali ada perubahan. Untuk ratusan santri ini sangat cepat.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const initSqlJs = require('sql.js');
const SKEMA = require('./skema');
const NIS = require('./nis');

const STATUS = ['Aktif', 'Alumni', 'Boyong', 'Pindah'];
const MASTER = { angkatan: 'angkatan_id', kelas: 'kelas_id', asrama: 'asrama_id' };

const FIELD = [
  'nis', 'nisn', 'nik', 'nama', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 'alamat',
  'angkatan_id', 'kelas_id', 'asrama_id', 'kamar', 'status', 'tanggal_masuk', 'catatan',
  'nama_ayah', 'nama_ibu', 'nama_wali', 'hp_wali', 'foto'
];
const FIELD_ID = ['angkatan_id', 'kelas_id', 'asrama_id'];

let SQL = null;
let db = null;
let berkasDb = null;

const sekarang = () => new Date().toISOString();

function tanggalFile(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ---------------------------------------------------------------- dasar

async function buka(folderData) {
  const dirWasm = path.dirname(require.resolve('sql.js'));
  const wasmBinary = fs.readFileSync(path.join(dirWasm, 'sql-wasm.wasm'));
  SQL = await initSqlJs({ wasmBinary });
  fs.mkdirSync(folderData, { recursive: true });
  berkasDb = path.join(folderData, 'santri.db');

  try {
    muatUlang();
    return { rusakKe: null };
  } catch (e) {
    // File database tidak bisa dibaca: pindahkan (jangan dihapus) lalu mulai dari kosong.
    const rusakKe = berkasDb + '.rusak-' + Date.now();
    fs.renameSync(berkasDb, rusakKe);
    muatUlang();
    return { rusakKe };
  }
}

function siap() {
  return db !== null;
}

function berkas() {
  return berkasDb;
}

function muatUlang() {
  if (db) {
    db.close();
    db = null;
  }
  const baru = fs.existsSync(berkasDb)
    ? new SQL.Database(new Uint8Array(fs.readFileSync(berkasDb)))
    : new SQL.Database();
  baru.exec(SKEMA);
  db = baru;
  simpan();
}

// Tulis ke disk lewat file sementara agar file utama tidak pernah setengah jadi.
function simpan() {
  const data = Buffer.from(db.export());
  const sementara = berkasDb + '.tmp';
  fs.writeFileSync(sementara, data);
  try {
    fs.renameSync(sementara, berkasDb);
  } catch (e) {
    fs.writeFileSync(berkasDb, data);
    try { fs.unlinkSync(sementara); } catch (_) { /* abaikan */ }
  }
}

function semua(sql, params = []) {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const hasil = [];
    while (stmt.step()) hasil.push(stmt.getAsObject());
    return hasil;
  } finally {
    stmt.free();
  }
}

function satu(sql, params = []) {
  return semua(sql, params)[0] || null;
}

// Menulis tanpa menyimpan ke disk (dipakai di dalam transaksi).
function tulis(sql, params = []) {
  db.run(sql, params);
  return { id: satu('SELECT last_insert_rowid() AS id').id, ubah: db.getRowsModified() };
}

function transaksi(fn) {
  db.run('BEGIN');
  try {
    const hasil = fn();
    db.run('COMMIT');
    simpan();
    return hasil;
  } catch (e) {
    try { db.run('ROLLBACK'); } catch (_) { /* abaikan */ }
    throw e;
  }
}

function ambil(kunci) {
  const r = satu('SELECT nilai FROM pengaturan WHERE kunci = ?', [kunci]);
  return r ? r.nilai : null;
}

function atur(kunci, nilai) {
  if (nilai === null || nilai === undefined) {
    tulis('DELETE FROM pengaturan WHERE kunci = ?', [kunci]);
  } else {
    tulis('INSERT OR REPLACE INTO pengaturan (kunci, nilai) VALUES (?, ?)', [kunci, String(nilai)]);
  }
  simpan();
}

// ---------------------------------------------------------------- santri

const KOLOM_TAMPIL = FIELD.filter((f) => f !== 'foto').map((f) => 's.' + f).join(', ');

function selectSantri(denganFoto) {
  return `SELECT s.id, ${KOLOM_TAMPIL}${denganFoto ? ', s.foto' : ''}, s.dibuat, s.diubah,
    a.nama AS angkatan, k.nama AS kelas, r.nama AS asrama
    FROM santri s
    LEFT JOIN angkatan a ON a.id = s.angkatan_id
    LEFT JOIN kelas k ON k.id = s.kelas_id
    LEFT JOIN asrama r ON r.id = s.asrama_id`;
}

function daftarSantri(f = {}) {
  const where = [];
  const p = [];
  if (f.q && String(f.q).trim()) {
    const like = '%' + String(f.q).trim() + '%';
    where.push('(s.nama LIKE ? OR s.nis LIKE ? OR s.nama_ayah LIKE ? OR s.nama_ibu LIKE ? OR s.nama_wali LIKE ?)');
    p.push(like, like, like, like, like);
  }
  if (f.angkatanId) { where.push('s.angkatan_id = ?'); p.push(Number(f.angkatanId)); }
  if (f.kelasId) { where.push('s.kelas_id = ?'); p.push(Number(f.kelasId)); }
  if (f.asramaId) { where.push('s.asrama_id = ?'); p.push(Number(f.asramaId)); }
  if (f.status) { where.push('s.status = ?'); p.push(f.status); }
  if (f.jenisKelamin) { where.push('s.jenis_kelamin = ?'); p.push(f.jenisKelamin); }
  // Urutan: angkatan terbaru dulu, di tiap angkatan Putra lalu Putri, di tiap blok A-Z.
  return semua(
    selectSantri(false) + (where.length ? ' WHERE ' + where.join(' AND ') : ''),
    p
  ).sort(NIS.bandingSantri);
}

function ambilSantri(id) {
  return satu(selectSantri(true) + ' WHERE s.id = ?', [Number(id)]);
}

function bersihkan(d) {
  const o = {};
  for (const k of FIELD) {
    let v = d[k];
    if (typeof v === 'string') v = v.trim();
    if (v === '' || v === undefined) v = null;
    if (FIELD_ID.includes(k) && v !== null) v = Number(v);
    o[k] = v;
  }
  if (!o.status) o.status = 'Aktif';
  return o;
}

// Foto dikirim sebagai data URL base64. Batas 500 KB dicek di tampilan; ini pengaman terakhir.
const BATAS_FOTO_KARAKTER = 700000;

function validasi(o) {
  if (!o.nama) return 'Nama lengkap wajib diisi.';
  if (o.jenis_kelamin !== 'Putra' && o.jenis_kelamin !== 'Putri') return 'Pilih jenis kelamin.';
  if (!o.angkatan_id) return 'Pilih angkatan.';
  if (!o.nis) return 'Nomor induk santri tidak bisa dibuat. Periksa angkatan dan jenis kelamin.';
  if (!STATUS.includes(o.status)) return 'Status tidak dikenal.';
  if (o.foto && o.foto.length > BATAS_FOTO_KARAKTER) return 'Foto terlalu besar (maksimal 500 KB).';
  if (o.nik && !/^\d{16}$/.test(o.nik)) return 'NIK harus 16 digit angka.';
  if (o.nisn && !/^\d{10}$/.test(o.nisn)) return 'NISN harus 10 digit angka.';
  return null;
}

function sisipSantri(o) {
  const t = sekarang();
  return tulis(
    `INSERT INTO santri (${FIELD.join(', ')}, dibuat, diubah) VALUES (${FIELD.map(() => '?').join(', ')}, ?, ?)`,
    [...FIELD.map((k) => o[k]), t, t]
  ).id;
}

// d.foto harus ikut dikirim apa adanya (null = tanpa foto), karena kolom ditimpa penuh.
// Nomor induk (nis) yang dikosongkan dibuat otomatis sesuai format di Pengaturan.
// Jika angkatan atau jenis kelamin berubah dan nomor tidak diubah manual, nomor dibuat ulang.
function simpanSantri(d) {
  const o = bersihkan(d);
  const id = Number(d.id) || 0;
  const lama = id ? satu('SELECT nis, angkatan_id, jenis_kelamin FROM santri WHERE id = ?', [id]) : null;
  if (id && !lama) return { ok: false, error: 'Data santri tidak ditemukan (mungkin sudah dihapus).' };

  const bisaDibuat = o.angkatan_id && (o.jenis_kelamin === 'Putra' || o.jenis_kelamin === 'Putri');
  const pindahGrup = !!lama && (lama.angkatan_id !== o.angkatan_id || lama.jenis_kelamin !== o.jenis_kelamin);
  if (bisaDibuat && (!o.nis || (pindahGrup && o.nis === lama.nis))) {
    o.nis = nisBerikutnya(o.angkatan_id, o.jenis_kelamin, id);
  }

  const salah = validasi(o);
  if (salah) return { ok: false, error: salah };

  const kembar = satu('SELECT id FROM santri WHERE nis = ? AND id <> ?', [o.nis, id]);
  if (kembar) return { ok: false, error: `Nomor induk ${o.nis} sudah dipakai santri lain.` };

  if (id) {
    tulis(
      `UPDATE santri SET ${FIELD.map((k) => k + ' = ?').join(', ')}, diubah = ? WHERE id = ?`,
      [...FIELD.map((k) => o[k]), sekarang(), id]
    );
    simpan();
    return { ok: true, id, nis: o.nis, nisBerubah: o.nis !== lama.nis };
  }
  const baru = sisipSantri(o);
  simpan();
  return { ok: true, id: baru, nis: o.nis, nisBerubah: false };
}

function hapusSantri(id) {
  tulis('DELETE FROM santri WHERE id = ?', [Number(id)]);
  simpan();
  return { ok: true };
}

// ---------------------------------------------------------------- angkatan, kelas, asrama

function cekTabel(t) {
  if (!MASTER[t]) throw new Error('Tabel tidak dikenal: ' + t);
}

function daftarMaster(t) {
  cekTabel(t);
  const urut = t === 'angkatan' ? 'm.nama DESC' : 'm.nama COLLATE NOCASE';
  return semua(
    `SELECT m.id, m.nama, (SELECT COUNT(*) FROM santri s WHERE s.${MASTER[t]} = m.id) AS jumlah
     FROM ${t} m ORDER BY ${urut}`
  );
}

function tambahMaster(t, nama) {
  cekTabel(t);
  nama = String(nama || '').trim();
  if (!nama) return { ok: false, error: 'Nama tidak boleh kosong.' };
  if (satu(`SELECT id FROM ${t} WHERE nama = ? COLLATE NOCASE`, [nama])) {
    return { ok: false, error: `"${nama}" sudah ada.` };
  }
  const { id } = tulis(`INSERT INTO ${t} (nama) VALUES (?)`, [nama]);
  simpan();
  return { ok: true, id };
}

function ubahMaster(t, id, nama) {
  cekTabel(t);
  nama = String(nama || '').trim();
  if (!nama) return { ok: false, error: 'Nama tidak boleh kosong.' };
  if (satu(`SELECT id FROM ${t} WHERE nama = ? COLLATE NOCASE AND id <> ?`, [nama, Number(id)])) {
    return { ok: false, error: `"${nama}" sudah ada.` };
  }
  tulis(`UPDATE ${t} SET nama = ? WHERE id = ?`, [nama, Number(id)]);
  simpan();
  return { ok: true };
}

function hapusMaster(t, id) {
  cekTabel(t);
  const n = satu(`SELECT COUNT(*) AS c FROM santri WHERE ${MASTER[t]} = ?`, [Number(id)]).c;
  if (n > 0) {
    return { ok: false, error: `Masih dipakai ${n} santri. Pindahkan santri tersebut terlebih dahulu.` };
  }
  tulis(`DELETE FROM ${t} WHERE id = ?`, [Number(id)]);
  simpan();
  return { ok: true };
}

// Dipakai saat impor Excel; dipanggil di dalam transaksi.
function cariAtauBuat(t, nama) {
  const ada = satu(`SELECT id FROM ${t} WHERE nama = ? COLLATE NOCASE`, [nama]);
  if (ada) return ada.id;
  return tulis(`INSERT INTO ${t} (nama) VALUES (?)`, [nama]).id;
}

function imporSantri(daftar) {
  // Diurutkan dulu (angkatan, Putra lalu Putri, abjad) agar nomor induk otomatis mengikuti abjad.
  const urut = daftar.slice().sort(NIS.bandingSantri);
  return transaksi(() => {
    let masuk = 0;
    let otomatis = 0;
    const lewat = [];
    for (const d of urut) {
      const o = bersihkan({
        ...d,
        angkatan_id: d.angkatan ? cariAtauBuat('angkatan', String(d.angkatan).trim()) : null,
        kelas_id: d.kelas ? cariAtauBuat('kelas', String(d.kelas).trim()) : null,
        asrama_id: d.asrama ? cariAtauBuat('asrama', String(d.asrama).trim()) : null,
        foto: null
      });
      const bisaDibuat = o.angkatan_id && (o.jenis_kelamin === 'Putra' || o.jenis_kelamin === 'Putri');
      const dibuat = !o.nis && bisaDibuat;
      if (dibuat) o.nis = nisBerikutnya(o.angkatan_id, o.jenis_kelamin);

      const salah = validasi(o);
      if (salah) { lewat.push({ nis: dibuat ? null : o.nis, nama: o.nama, error: salah }); continue; }
      if (satu('SELECT id FROM santri WHERE nis = ?', [o.nis])) {
        lewat.push({ nis: o.nis, nama: o.nama, error: 'Nomor induk sudah ada.' });
        continue;
      }
      sisipSantri(o);
      masuk++;
      if (dibuat) otomatis++;
    }
    return { ok: true, masuk, otomatis, lewat };
  });
}

function daftarNis() {
  return semua('SELECT nis FROM santri').map((r) => r.nis);
}

// ---------------------------------------------------------------- nomor induk santri

function formatNis() {
  return ambil('format_nis') || NIS.FORMAT_BAWAAN;
}

function angkatanContoh() {
  const a = satu('SELECT nama FROM angkatan ORDER BY id DESC LIMIT 1');
  return a ? a.nama : String(new Date().getFullYear());
}

function infoFormatNis() {
  const format = formatNis();
  return { format, bawaan: NIS.FORMAT_BAWAAN, perJk: NIS.perJk(format), contoh: NIS.contoh(format, angkatanContoh()) };
}

function periksaFormatNis(format) {
  const cek = NIS.periksa(format);
  if (!cek.ok) return cek;
  return { ok: true, format: cek.format, perJk: NIS.perJk(cek.format), contoh: NIS.contoh(cek.format, angkatanContoh()) };
}

function simpanFormatNis(format) {
  const cek = NIS.periksa(format);
  if (!cek.ok) return cek;
  atur('format_nis', cek.format);
  return { ok: true, format: cek.format };
}

// Nomor berikutnya untuk santri baru di angkatan dan jenis kelamin tertentu.
// Tidak menggeser santri lain. kecualiId = santri yang sedang diedit (nomornya sendiri tidak dihitung).
function nisBerikutnya(angkatanId, jenisKelamin, kecualiId) {
  const a = satu('SELECT nama FROM angkatan WHERE id = ?', [Number(angkatanId)]);
  if (!a || (jenisKelamin !== 'Putra' && jenisKelamin !== 'Putri')) return null;

  const format = formatNis();
  const kecuali = Number(kecualiId) || 0;
  const grup = { angkatan: a.nama, jenisKelamin };
  const pj = NIS.perJk(format);
  const ada = (pj
    ? semua('SELECT nis FROM santri WHERE angkatan_id = ? AND jenis_kelamin = ? AND id <> ?', [Number(angkatanId), jenisKelamin, kecuali])
    : semua('SELECT nis FROM santri WHERE angkatan_id = ? AND id <> ?', [Number(angkatanId), kecuali])
  ).map((r) => r.nis);

  let urut = NIS.urutTertinggi(format, grup, ada) + 1;
  let kandidat = NIS.bentuk(format, { ...grup, urut });
  while (satu('SELECT id FROM santri WHERE nis = ? AND id <> ?', [kandidat, kecuali])) {
    urut++;
    kandidat = NIS.bentuk(format, { ...grup, urut });
  }
  return kandidat;
}

// Pratinjau "Urutkan Ulang": nomor baru untuk semua santri satu angkatan, Putra A-Z lalu Putri A-Z.
function pratinjauUrut(angkatanId) {
  const a = satu('SELECT id, nama FROM angkatan WHERE id = ?', [Number(angkatanId)]);
  if (!a) return { ok: false, error: 'Angkatan tidak ditemukan.' };
  const format = formatNis();
  const baris = semua('SELECT id, nama, nis, jenis_kelamin FROM santri WHERE angkatan_id = ?', [a.id]);
  const lama = new Map(baris.map((r) => [r.id, r]));
  const daftar = NIS.rencanaUrut(format, a.nama, baris).map((r) => ({
    id: r.id,
    nama: lama.get(r.id).nama,
    jenis_kelamin: lama.get(r.id).jenis_kelamin,
    lama: lama.get(r.id).nis,
    baru: r.nis
  }));
  const bentrok = daftar.find((d) => satu('SELECT id FROM santri WHERE nis = ? AND angkatan_id <> ?', [d.baru, a.id]));
  if (bentrok) return { ok: false, error: `Nomor ${bentrok.baru} sudah dipakai santri di angkatan lain. Periksa format nomor induk.` };
  return { ok: true, angkatan: a.nama, format, jumlah: daftar.length, berubah: daftar.filter((d) => d.lama !== d.baru).length, daftar };
}

function urutUlang(angkatanId) {
  const p = pratinjauUrut(angkatanId);
  if (!p.ok) return p;
  if (!p.berubah) return { ok: true, berubah: 0, cadangan: null };
  const cadangan = cadanganAman('Sebelum-Urut-Ulang');
  transaksi(() => {
    // Nomor sementara dulu, karena nomor baru satu santri bisa sama dengan nomor lama santri lain.
    p.daftar.forEach((d) => tulis('UPDATE santri SET nis = ? WHERE id = ?', ['~' + d.id, d.id]));
    p.daftar.forEach((d) => tulis('UPDATE santri SET nis = ?, diubah = ? WHERE id = ?', [d.baru, sekarang(), d.id]));
  });
  return { ok: true, berubah: p.berubah, cadangan };
}

// ---------------------------------------------------------------- dashboard

function statistik() {
  const total = satu('SELECT COUNT(*) AS c FROM santri').c;
  const perStatus = Object.fromEntries(STATUS.map((s) => [s, 0]));
  semua('SELECT status, COUNT(*) AS c FROM santri GROUP BY status').forEach((r) => { perStatus[r.status] = r.c; });
  const perJenis = { Putra: 0, Putri: 0 };
  semua('SELECT jenis_kelamin AS j, COUNT(*) AS c FROM santri GROUP BY jenis_kelamin').forEach((r) => { perJenis[r.j] = r.c; });
  const perAngkatan = semua(
    `SELECT a.id, a.nama, COUNT(s.id) AS jumlah
     FROM angkatan a LEFT JOIN santri s ON s.angkatan_id = a.id
     GROUP BY a.id, a.nama ORDER BY a.nama`
  );
  const terbaru = semua(selectSantri(false) + ' ORDER BY s.id DESC LIMIT 5');
  return { total, perStatus, perJenis, perAngkatan, terbaru, backupTerakhir: ambil('backup_terakhir') };
}

// ---------------------------------------------------------------- password (satu pintu masuk)

function hash(teks) {
  const garam = crypto.randomBytes(16).toString('hex');
  return garam + ':' + crypto.scryptSync(teks, garam, 64).toString('hex');
}

function cocok(teks, tersimpan) {
  if (!tersimpan) return false;
  const [garam, h] = tersimpan.split(':');
  const baru = crypto.scryptSync(teks, garam, 64);
  const lama = Buffer.from(h, 'hex');
  return lama.length === baru.length && crypto.timingSafeEqual(lama, baru);
}

function passwordAda() {
  return !!ambil('password');
}

function masuk(pw) {
  const t = ambil('password');
  return !t || cocok(String(pw || ''), t);
}

function aturPassword(baru, lama) {
  baru = String(baru || '');
  if (baru.length < 4) return { ok: false, error: 'Password minimal 4 karakter.' };
  if (passwordAda() && !cocok(String(lama || ''), ambil('password'))) {
    return { ok: false, error: 'Password lama salah.' };
  }
  const kode = crypto.randomBytes(5).toString('hex').toUpperCase();
  tulis('INSERT OR REPLACE INTO pengaturan (kunci, nilai) VALUES (?, ?)', ['password', hash(baru)]);
  tulis('INSERT OR REPLACE INTO pengaturan (kunci, nilai) VALUES (?, ?)', ['kode_pemulihan', hash(kode)]);
  simpan();
  return { ok: true, kode: kode.slice(0, 5) + '-' + kode.slice(5) };
}

function hapusPassword(lama) {
  if (!passwordAda()) return { ok: true };
  if (!cocok(String(lama || ''), ambil('password'))) return { ok: false, error: 'Password salah.' };
  atur('password', null);
  atur('kode_pemulihan', null);
  return { ok: true };
}

function pulihkanPassword(kode) {
  const norm = String(kode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cocok(norm, ambil('kode_pemulihan'))) return { ok: false, error: 'Kode pemulihan tidak cocok.' };
  atur('password', null);
  atur('kode_pemulihan', null);
  return { ok: true };
}

// ---------------------------------------------------------------- backup

function validasiBuffer(buf) {
  let tes = null;
  try {
    tes = new SQL.Database(new Uint8Array(buf));
    const ada = tes.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'santri'");
    if (!ada.length) return { ok: false, error: 'File ini bukan backup Data Santri.' };
    const jumlah = tes.exec('SELECT COUNT(*) FROM santri')[0].values[0][0];
    return { ok: true, jumlah };
  } catch (e) {
    return { ok: false, error: 'File ini bukan backup Data Santri yang valid.' };
  } finally {
    if (tes) tes.close();
  }
}

// Salinan pengaman di folder data sebelum tindakan yang mengubah banyak data.
// Hanya 5 salinan terbaru per jenis yang disimpan.
function cadanganAman(label) {
  simpan();
  const folder = path.dirname(berkasDb);
  const tujuan = path.join(folder, `${label}-${tanggalFile()}-${Date.now()}.db`);
  fs.copyFileSync(berkasDb, tujuan);
  fs.readdirSync(folder)
    .filter((f) => f.startsWith(label + '-') && f.endsWith('.db'))
    .sort()
    .reverse()
    .slice(5)
    .forEach((f) => { try { fs.unlinkSync(path.join(folder, f)); } catch (_) { /* abaikan */ } });
  return tujuan;
}

function pulihkanDari(pathFile) {
  const buf = fs.readFileSync(pathFile);
  const cek = validasiBuffer(buf);
  if (!cek.ok) return cek;
  const cadangan = cadanganAman('Sebelum-Pulihkan');
  fs.writeFileSync(berkasDb, buf);
  muatUlang();
  return { ok: true, jumlah: cek.jumlah, cadangan };
}

function salinKe(tujuan) {
  simpan();
  fs.copyFileSync(berkasDb, tujuan);
  atur('backup_terakhir', sekarang());
}

// Backup otomatis ke folder pilihan; hanya 10 file terbaru yang disimpan.
function cadangkanKe(folder) {
  if (!folder || !fs.existsSync(folder)) {
    return { ok: false, error: 'Folder backup otomatis tidak ditemukan.' };
  }
  atur('backup_terakhir', sekarang());
  const tujuan = path.join(folder, `Backup-Otomatis-${tanggalFile()}.db`);
  fs.copyFileSync(berkasDb, tujuan);
  fs.readdirSync(folder)
    .filter((f) => /^Backup-Otomatis-\d{4}-\d{2}-\d{2}\.db$/.test(f))
    .sort()
    .reverse()
    .slice(10)
    .forEach((f) => { try { fs.unlinkSync(path.join(folder, f)); } catch (_) { /* abaikan */ } });
  return { ok: true, path: tujuan };
}

module.exports = {
  STATUS, tanggalFile, buka, siap, berkas, semua, satu, ambil, atur,
  daftarSantri, ambilSantri, simpanSantri, hapusSantri,
  daftarMaster, tambahMaster, ubahMaster, hapusMaster, imporSantri, daftarNis,
  infoFormatNis, periksaFormatNis, simpanFormatNis, nisBerikutnya, pratinjauUrut, urutUlang,
  statistik,
  passwordAda, masuk, aturPassword, hapusPassword, pulihkanPassword,
  validasiBuffer, pulihkanDari, salinKe, cadangkanKe
};
