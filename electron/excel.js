'use strict';

// Semua urusan file Excel: export, template impor, dan membaca file impor.

const ExcelJS = require('exceljs');
const NIS = require('./nis');

const HIJAU = 'FF0E6B57';
const HIJAU_MUDA = 'FFE3F1EC';
const HIJAU_TUA = 'FF0A4F40';
const GARIS = { style: 'thin', color: { argb: 'FFD9D6CB' } };

// ---------------------------------------------------------------- bantuan

const p2 = (n) => String(n).padStart(2, '0');

function tglIndo(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

function namaSheet(nama, dipakai) {
  const bersih = String(nama).replace(/[\\/?*[\]:]/g, '-');
  let n = bersih.slice(0, 31) || 'Sheet';
  let urut = 2;
  while (dipakai.has(n.toLowerCase())) {
    n = (bersih.slice(0, 27) || 'Sheet') + ' ' + urut++;
  }
  dipakai.add(n.toLowerCase());
  return n;
}

function gayaHeader(ws) {
  const h = ws.getRow(1);
  h.height = 26;
  h.eachCell((c) => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HIJAU } };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = { top: GARIS, left: GARIS, bottom: GARIS, right: GARIS };
  });
}

// ---------------------------------------------------------------- export

// Kolom pertama selalu "No. Induk Santri" (menggantikan kolom "No"), jadi tidak ada di daftar pilihan ini.
const KOLOM_NOMOR = { id: 'nis', judul: 'No. Induk Santri', lebar: 20, nilai: (r) => r.nis };

const KOLOM_EXPORT = [
  { id: 'nama', judul: 'Nama', lebar: 30, nilai: (r) => r.nama },
  { id: 'nisn', judul: 'NISN', lebar: 14, nilai: (r) => r.nisn },
  { id: 'nik', judul: 'NIK', lebar: 20, nilai: (r) => r.nik },
  { id: 'jenis_kelamin', judul: 'Jenis Kelamin', lebar: 14, nilai: (r) => r.jenis_kelamin },
  {
    id: 'ttl', judul: 'Tempat, Tanggal Lahir', lebar: 28,
    nilai: (r) => [r.tempat_lahir, tglIndo(r.tanggal_lahir)].filter(Boolean).join(', ')
  },
  { id: 'alamat', judul: 'Alamat', lebar: 42, nilai: (r) => r.alamat },
  { id: 'angkatan', judul: 'Angkatan', lebar: 11, nilai: (r) => r.angkatan },
  { id: 'kelas', judul: 'Kelas', lebar: 12, nilai: (r) => r.kelas },
  {
    id: 'asrama', judul: 'Asrama', lebar: 18,
    nilai: (r) => [r.asrama, r.kamar].filter(Boolean).join(' / ')
  },
  { id: 'status', judul: 'Status', lebar: 11, nilai: (r) => r.status },
  {
    id: 'wali', judul: 'Nama Wali', lebar: 26,
    nilai: (r) => r.nama_wali || r.nama_ayah || r.nama_ibu
  },
  { id: 'hp_wali', judul: 'No. HP Wali', lebar: 18, nilai: (r) => r.hp_wali }
];

function daftarKolom() {
  return KOLOM_EXPORT.map((k) => ({ id: k.id, judul: k.judul }));
}

// blokJk = true: tiap angkatan dibagi blok "PUTRA" lalu "PUTRI" dengan baris judul (enak dicetak).
// blokJk = false: satu daftar rata dengan filter Excel (enak diolah).
function isiSheet(ws, rows, kolom, blokJk) {
  const semuaKolom = [KOLOM_NOMOR, ...kolom];
  ws.columns = semuaKolom.map((k) => ({ header: k.judul, key: k.id, width: k.lebar }));
  gayaHeader(ws);

  const jumlah = new Map();
  const kunci = (r) => (r.angkatan || '') + '|' + r.jenis_kelamin;
  rows.forEach((r) => jumlah.set(kunci(r), (jumlah.get(kunci(r)) || 0) + 1));

  let grupLalu = null;
  rows.forEach((r) => {
    if (blokJk && kunci(r) !== grupLalu) {
      grupLalu = kunci(r);
      const teksBlok =
        (r.angkatan ? `Angkatan ${r.angkatan} · ` : '') + `${String(r.jenis_kelamin).toUpperCase()} · ${jumlah.get(grupLalu)} santri`;
      const band = ws.addRow([teksBlok]);
      ws.mergeCells(band.number, 1, band.number, semuaKolom.length);
      band.height = 22;
      const c = band.getCell(1);
      c.font = { bold: true, color: { argb: HIJAU_TUA } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HIJAU_MUDA } };
      c.alignment = { vertical: 'middle' };
    }

    const baris = {};
    semuaKolom.forEach((k) => { baris[k.id] = k.nilai(r) || ''; });
    const row = ws.addRow(baris);
    row.alignment = { vertical: 'top', wrapText: true };
    row.getCell(1).numFmt = '@';
    row.eachCell({ includeEmpty: true }, (c) => {
      c.border = { top: GARIS, left: GARIS, bottom: GARIS, right: GARIS };
    });
  });

  ws.views = [{ state: 'frozen', ySplit: 1 }];
  if (!blokJk) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: semuaKolom.length } };
}

async function tulisExport(rows, idKolom, opsi, pathFile) {
  const kolom = KOLOM_EXPORT.filter((k) => !idKolom || idKolom.includes(k.id));
  const blokJk = !opsi || opsi.blokJk !== false;
  const urut = rows.slice().sort(NIS.bandingSantri);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Aplikasi Data Santri';
  wb.created = new Date();

  if (opsi && opsi.sheetPerAngkatan) {
    const grup = new Map();
    urut.forEach((r) => {
      const k = r.angkatan || 'Tanpa Angkatan';
      if (!grup.has(k)) grup.set(k, []);
      grup.get(k).push(r);
    });
    const dipakai = new Set();
    for (const [angkatan, isi] of grup) {
      const label = angkatan === 'Tanpa Angkatan' ? angkatan : 'Angkatan ' + angkatan;
      isiSheet(wb.addWorksheet(namaSheet(label, dipakai)), isi, kolom, blokJk);
    }
  } else {
    isiSheet(wb.addWorksheet('Data Santri'), urut, kolom, blokJk);
  }
  await wb.xlsx.writeFile(pathFile);
}

// ---------------------------------------------------------------- impor

const KOLOM_IMPOR = [
  { id: 'nis', judul: 'NIS', lebar: 14, teks: true },
  { id: 'nisn', judul: 'NISN', lebar: 14, teks: true },
  { id: 'nik', judul: 'NIK', lebar: 20, teks: true },
  { id: 'nama', judul: 'Nama Lengkap *', lebar: 30 },
  { id: 'jenis_kelamin', judul: 'Jenis Kelamin *', lebar: 16 },
  { id: 'tempat_lahir', judul: 'Tempat Lahir', lebar: 18 },
  { id: 'tanggal_lahir', judul: 'Tanggal Lahir', lebar: 16 },
  { id: 'alamat', judul: 'Alamat', lebar: 40 },
  { id: 'angkatan', judul: 'Angkatan *', lebar: 12, teks: true },
  { id: 'kelas', judul: 'Kelas', lebar: 12 },
  { id: 'asrama', judul: 'Asrama', lebar: 16 },
  { id: 'kamar', judul: 'Kamar', lebar: 10, teks: true },
  { id: 'status', judul: 'Status', lebar: 12 },
  { id: 'tanggal_masuk', judul: 'Tanggal Masuk', lebar: 16 },
  { id: 'nama_ayah', judul: 'Nama Ayah', lebar: 24 },
  { id: 'nama_ibu', judul: 'Nama Ibu', lebar: 24 },
  { id: 'nama_wali', judul: 'Nama Wali', lebar: 24 },
  { id: 'hp_wali', judul: 'No HP Wali', lebar: 18, teks: true },
  { id: 'catatan', judul: 'Catatan', lebar: 30 }
];

const SINONIM = {
  nis: 'nis', noinduk: 'nis', nomorinduk: 'nis', noinduksantri: 'nis', nomorinduksantri: 'nis',
  nisn: 'nisn', nik: 'nik',
  nama: 'nama', namalengkap: 'nama', namasantri: 'nama',
  jeniskelamin: 'jenis_kelamin', jk: 'jenis_kelamin', gender: 'jenis_kelamin',
  tempatlahir: 'tempat_lahir', tanggallahir: 'tanggal_lahir', tgllahir: 'tanggal_lahir',
  alamat: 'alamat', angkatan: 'angkatan', kelas: 'kelas', asrama: 'asrama', kamar: 'kamar',
  status: 'status', tanggalmasuk: 'tanggal_masuk', tglmasuk: 'tanggal_masuk',
  namaayah: 'nama_ayah', ayah: 'nama_ayah', namaibu: 'nama_ibu', ibu: 'nama_ibu',
  namawali: 'nama_wali', wali: 'nama_wali',
  nohpwali: 'hp_wali', hpwali: 'hp_wali', nohp: 'hp_wali', hp: 'hp_wali', telepon: 'hp_wali',
  catatan: 'catatan', keterangan: 'catatan'
};

const JUDUL_IMPOR = Object.fromEntries(KOLOM_IMPOR.map((k) => [k.id, k.judul.replace(' *', '')]));

async function tulisTemplate(pathFile) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Aplikasi Data Santri';

  const ws = wb.addWorksheet('Data Santri');
  ws.columns = KOLOM_IMPOR.map((k) => ({ header: k.judul, key: k.id, width: k.lebar }));
  KOLOM_IMPOR.forEach((k, i) => { if (k.teks) ws.getColumn(i + 1).numFmt = '@'; });
  gayaHeader(ws);
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  const kolomJk = KOLOM_IMPOR.findIndex((k) => k.id === 'jenis_kelamin') + 1;
  const kolomStatus = KOLOM_IMPOR.findIndex((k) => k.id === 'status') + 1;
  for (let r = 2; r <= 501; r++) {
    ws.getCell(r, kolomJk).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Putra,Putri"'] };
    ws.getCell(r, kolomStatus).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Aktif,Alumni,Boyong,Pindah"'] };
  }

  const pt = wb.addWorksheet('Petunjuk');
  pt.getColumn(1).width = 110;
  [
    'PETUNJUK PENGISIAN',
    '',
    '1. Isi data santri di sheet "Data Santri", satu santri per baris, mulai dari baris ke-2.',
    '2. Kolom bertanda * wajib diisi: Nama Lengkap, Jenis Kelamin, Angkatan.',
    '3. NIS (Nomor Induk Santri): KOSONGKAN agar dibuat otomatis oleh aplikasi sesuai format di menu Pengaturan, urut abjad per angkatan (Putra dulu, lalu Putri).',
    '   Isi hanya jika santri sudah punya nomor induk resmi yang harus dipertahankan.',
    '4. Jenis Kelamin diisi Putra atau Putri.',
    '5. Status diisi Aktif, Alumni, Boyong, atau Pindah. Jika dikosongkan dianggap Aktif.',
    '6. Tanggal ditulis dengan format 31-12-2010 (hari-bulan-tahun) atau 2010-12-31.',
    '7. NIK harus 16 digit dan NISN 10 digit. Kolom NIS, NISN, NIK sudah berformat teks, jadi angka nol di depan tidak hilang.',
    '8. Angkatan sebaiknya ditulis sebagai tahun (misalnya 2024), karena dipakai di nomor induk. Angkatan, Kelas, dan Asrama yang belum ada akan dibuat otomatis saat impor.',
    '9. NIS yang sudah ada di aplikasi tidak akan ditimpa; barisnya dilewati dan ditandai di pratinjau.',
    '10. Jangan mengubah nama kolom di baris pertama.',
    '',
    'Contoh baris:  (kosong) | 1234567890 | 3314010101100001 | Ahmad Fauzan | Putra | Sragen | 01-01-2010 | ... | 2026 | Kelas 1 | Putra A | 04 | Aktif'
  ].forEach((t, i) => {
    const c = pt.getCell(i + 1, 1);
    c.value = t;
    c.alignment = { wrapText: true, vertical: 'top' };
    if (i === 0) c.font = { bold: true, size: 14, color: { argb: HIJAU } };
  });

  await wb.xlsx.writeFile(pathFile);
}

function norm(t) {
  return String(t || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function teks(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return `${v.getUTCFullYear()}-${p2(v.getUTCMonth() + 1)}-${p2(v.getUTCDate())}`;
  if (typeof v === 'object') {
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join('').trim();
    if (v.result !== undefined) return teks(v.result);
    if (v.text !== undefined) return String(v.text).trim();
    return '';
  }
  return String(v).trim();
}

// '' = kosong, undefined = tidak dikenali, selain itu format YYYY-MM-DD
function tanggal(v) {
  const t = teks(v);
  if (!t) return '';
  let y; let m; let d;
  let cocok = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(t);
  if (cocok) { y = +cocok[1]; m = +cocok[2]; d = +cocok[3]; }
  else {
    cocok = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(t);
    if (!cocok) return undefined;
    d = +cocok[1]; m = +cocok[2]; y = +cocok[3];
  }
  const uji = new Date(Date.UTC(y, m - 1, d));
  if (uji.getUTCFullYear() !== y || uji.getUTCMonth() !== m - 1 || uji.getUTCDate() !== d) return undefined;
  return `${y}-${p2(m)}-${p2(d)}`;
}

function jenisKelamin(t) {
  const n = norm(t);
  if (['putra', 'l', 'lakilaki', 'laki', 'pria'].includes(n)) return 'Putra';
  if (['putri', 'p', 'perempuan', 'wanita'].includes(n)) return 'Putri';
  return null;
}

async function bacaImpor(pathFile, nisSudahAda) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(pathFile);
  const ws = wb.getWorksheet('Data Santri') || wb.worksheets[0];
  if (!ws) throw new Error('File Excel ini kosong.');

  const peta = {};
  ws.getRow(1).eachCell((c, i) => {
    const id = SINONIM[norm(teks(c.value))];
    if (id && !Object.values(peta).includes(id)) peta[i] = id;
  });

  const ada = new Set(Object.values(peta));
  const hilang = ['nama', 'jenis_kelamin', 'angkatan'].filter((k) => !ada.has(k));
  if (hilang.length) {
    return { kolomHilang: hilang.map((k) => JUDUL_IMPOR[k]), baris: [] };
  }

  const baris = [];
  const terlihat = new Set(nisSudahAda);

  ws.eachRow({ includeEmpty: false }, (row, no) => {
    if (no === 1) return;
    const data = { nis: '' };
    const salah = [];

    for (const [i, id] of Object.entries(peta)) {
      const v = row.getCell(Number(i)).value;
      if (id === 'tanggal_lahir' || id === 'tanggal_masuk') {
        const t = tanggal(v);
        if (t === undefined) salah.push(`${JUDUL_IMPOR[id]} tidak dikenali (pakai 31-12-2010)`);
        data[id] = t || '';
      } else {
        data[id] = teks(v);
      }
    }
    if (Object.values(data).every((x) => !x)) return;

    if (!data.nama) salah.push('Nama kosong');
    if (!data.angkatan) salah.push('Angkatan kosong');

    const jk = jenisKelamin(data.jenis_kelamin);
    if (!jk) salah.push('Jenis kelamin harus Putra atau Putri');
    else data.jenis_kelamin = jk;

    if (!data.status) data.status = 'Aktif';
    else {
      const st = ['Aktif', 'Alumni', 'Boyong', 'Pindah'].find((s) => s.toLowerCase() === data.status.toLowerCase());
      if (!st) salah.push('Status harus Aktif, Alumni, Boyong, atau Pindah');
      else data.status = st;
    }

    if (data.nik && !/^\d{16}$/.test(data.nik)) salah.push('NIK harus 16 digit angka');
    if (data.nisn && !/^\d{10}$/.test(data.nisn)) salah.push('NISN harus 10 digit angka');

    // NIS kosong = akan dibuat otomatis saat impor, jadi tidak dicek kembar.
    if (data.nis) {
      if (terlihat.has(data.nis)) salah.push('Nomor induk sudah ada (di aplikasi atau baris lain)');
      else terlihat.add(data.nis);
    }

    baris.push({ no, data, error: salah });
  });

  return { kolomHilang: [], baris };
}

module.exports = { daftarKolom, tulisExport, tulisTemplate, bacaImpor };
