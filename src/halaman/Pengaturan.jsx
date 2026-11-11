import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Banner, HeaderHalaman, Kartu, Medan, Modal, Tombol, kelasInput, useToast } from '../ui.jsx';

const KODE = [
  { kode: '{ANGKATAN}', ket: 'Angkatan, mis. 2024' },
  { kode: '{JK}', ket: '1 = Putra, 2 = Putri' },
  { kode: '{LP}', ket: 'L = Putra, P = Putri' },
  { kode: '{URUT:3}', ket: 'Nomor urut 3 digit' }
];

function FormatNis() {
  const toast = useToast();
  const [info, setInfo] = useState(null);
  const [fmt, setFmt] = useState('');
  const [cek, setCek] = useState(null);

  useEffect(() => {
    api('nis:format').then((r) => { setInfo(r); setFmt(r.format); setCek({ ok: true, ...r }); }).catch((e) => toast(e.message, 'galat'));
  }, [toast]);

  // Contoh nomor ikut berubah saat format diketik.
  useEffect(() => {
    if (!info) return undefined;
    const t = setTimeout(() => { api('nis:periksa', fmt).then(setCek).catch(() => {}); }, 250);
    return () => clearTimeout(t);
  }, [fmt, info]);

  async function simpan() {
    try {
      const r = await api('nis:simpanFormat', fmt);
      if (!r.ok) { toast(r.error, 'galat'); return; }
      setInfo({ ...info, format: r.format });
      setFmt(r.format);
      toast('Format nomor induk disimpan.');
    } catch (e) {
      toast(e.message, 'galat');
    }
  }

  if (!info) return null;
  const berubah = fmt.trim() !== info.format;

  return (
    <Kartu judul="Format Nomor Induk Santri">
      <p className="m-0 -mt-2 text-xs text-slate-600 font-medium">
        Nomor induk dibuat otomatis untuk santri baru dan menggantikan kolom &quot;No&quot; di daftar dan file Excel. Atur polanya dengan kode di bawah.
      </p>

      <Medan label="Format" htmlFor="format-nis">
        <input id="format-nis" className={kelasInput + ' font-mono'} value={fmt} onChange={(e) => setFmt(e.target.value)} spellCheck={false} autoComplete="off" />
      </Medan>

      <div className="flex flex-wrap gap-2">
        {KODE.map((k) => (
          <button
            key={k.kode}
            type="button"
            title={k.ket}
            onClick={() => setFmt((f) => f + k.kode)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-[#F4F9F7] text-left transition-colors"
          >
            <span className="font-mono text-xs font-bold text-[#164A41]">{k.kode}</span>
            <span className="block text-[11px] font-medium text-slate-500">{k.ket}</span>
          </button>
        ))}
      </div>

      {cek && !cek.ok && <Banner jenis="galat">{cek.error}</Banner>}

      {cek && cek.ok && (
        <div className="bg-[#E3F0EC] border border-[#8CCBB5] rounded-2xl px-4 py-3 flex flex-col gap-1.5">
          <div className="text-xs font-extrabold text-[#164A41]">Contoh hasil (memakai angkatan terbaru)</div>
          {cek.contoh.map((c) => (
            <div key={c.label} className="flex flex-wrap justify-between gap-3 text-xs">
              <span className="text-slate-600 font-medium">{c.label}</span>
              <span className="font-mono font-bold text-[#164A41] tabular-nums">{c.nis}</span>
            </div>
          ))}
          <p className="m-0 mt-1 text-[11px] font-medium text-slate-500">
            {cek.perJk
              ? 'Nomor urut dimulai lagi dari 1 untuk Putra dan Putri.'
              : 'Nomor urut berjalan per angkatan: Putra dulu, lalu Putri.'}
          </p>
        </div>
      )}

      <Banner jenis="info">
        Mengubah format <b>tidak mengubah nomor santri yang sudah ada</b>. Untuk menerapkannya ke santri lama, buka Data Santri, pilih satu angkatan, lalu klik <b>Urutkan Ulang Nomor Induk</b>.
      </Banner>

      <div className="flex flex-wrap gap-2.5">
        <Tombol varian="utama" ikon="centang" onClick={simpan} disabled={!berubah || !cek || !cek.ok}>Simpan Format</Tombol>
        <Tombol onClick={() => setFmt(info.bawaan)} disabled={fmt === info.bawaan}>Kembalikan ke Bawaan</Tombol>
      </div>
    </Kartu>
  );
}

function PasswordKartu({ onPasswordBerubah }) {
  const toast = useToast();
  const [ada, setAda] = useState(null);
  const [lama, setLama] = useState('');
  const [baru, setBaru] = useState('');
  const [ulang, setUlang] = useState('');
  const [galat, setGalat] = useState('');
  const [kode, setKode] = useState(null);

  useEffect(() => { api('auth:status').then((r) => setAda(r.ada)).catch((e) => toast(e.message, 'galat')); }, [toast]);

  function bersih() { setLama(''); setBaru(''); setUlang(''); setGalat(''); }

  async function simpan(e) {
    e.preventDefault();
    setGalat('');
    if (baru !== ulang) { setGalat('Password baru dan pengulangannya tidak sama.'); return; }
    try {
      const r = await api('auth:atur', { baru, lama });
      if (!r.ok) { setGalat(r.error); return; }
      setAda(true);
      onPasswordBerubah(true);
      setKode(r.kode);
      bersih();
    } catch (x) {
      setGalat(x.message);
    }
  }

  async function hapus() {
    setGalat('');
    try {
      const r = await api('auth:hapus', lama);
      if (!r.ok) { setGalat(r.error); return; }
      setAda(false);
      onPasswordBerubah(false);
      bersih();
      toast('Password dihapus. Aplikasi bisa dibuka tanpa password.');
    } catch (x) {
      setGalat(x.message);
    }
  }

  if (ada === null) return null;

  return (
    <Kartu judul="Password aplikasi">
      <p className="m-0 -mt-2 text-xs text-slate-600 font-medium">
        {ada ? 'Password aktif. Aplikasi meminta password setiap dibuka.' : 'Belum ada password. Siapa pun yang membuka laptop ini bisa membuka aplikasi.'}
      </p>

      <form onSubmit={simpan} className="flex flex-col gap-4 max-w-[420px]">
        {ada && (
          <Medan label="Password saat ini" htmlFor="pw-lama">
            <input id="pw-lama" type="password" className={kelasInput} value={lama} onChange={(e) => setLama(e.target.value)} autoComplete="current-password" />
          </Medan>
        )}
        <Medan label={ada ? 'Password baru' : 'Buat password'} htmlFor="pw-baru" petunjuk="Minimal 4 karakter.">
          <input id="pw-baru" type="password" className={kelasInput} value={baru} onChange={(e) => setBaru(e.target.value)} autoComplete="new-password" />
        </Medan>
        <Medan label="Ulangi password baru" htmlFor="pw-ulang">
          <input id="pw-ulang" type="password" className={kelasInput} value={ulang} onChange={(e) => setUlang(e.target.value)} autoComplete="new-password" />
        </Medan>
        {galat && <p role="alert" className="m-0 text-xs text-red-800 font-bold">{galat}</p>}
        <div className="flex flex-wrap gap-2.5">
          <Tombol type="submit" varian="utama" disabled={!baru || !ulang || (ada && !lama)}>{ada ? 'Ganti Password' : 'Aktifkan Password'}</Tombol>
          {ada && <Tombol varian="bahaya" onClick={hapus} disabled={!lama}>Hapus Password</Tombol>}
        </div>
      </form>

      <Banner jenis="awas">
        Password hanya mengunci tampilan aplikasi. File data (santri.db) dan file backup <b>tidak dienkripsi</b>, jadi simpan keduanya di tempat yang aman.
      </Banner>

      {kode && (
        <Modal judul="Simpan kode pemulihan" ikon="kunci" lebar="max-w-md" onTutup={() => setKode(null)}>
          <p className="m-0 text-xs text-slate-600 font-medium leading-relaxed">Jika Anda lupa password, kode ini satu-satunya cara membuka aplikasi tanpa kehilangan data. <b>Kode hanya ditampilkan sekali.</b> Catat dan simpan di tempat yang aman.</p>
          <p className="m-0 text-center text-2xl font-mono font-extrabold tracking-widest text-[#164A41] bg-[#E3F0EC] border border-[#8CCBB5] rounded-2xl py-4 select-all">{kode}</p>
          <div className="pt-3 border-t border-slate-100 flex justify-end"><Tombol varian="utama" onClick={() => setKode(null)}>Sudah saya catat</Tombol></div>
        </Modal>
      )}
    </Kartu>
  );
}

export default function Pengaturan({ onPasswordBerubah }) {
  const toast = useToast();
  const [info, setInfo] = useState(null);

  useEffect(() => { api('app:info').then(setInfo).catch((e) => toast(e.message, 'galat')); }, [toast]);

  return (
    <>
      <HeaderHalaman judul="Pengaturan" sub="Nomor induk, keamanan, dan informasi aplikasi" />
      <FormatNis />
      <PasswordKartu onPasswordBerubah={onPasswordBerubah} />
      {info && (
        <Kartu judul="Tentang aplikasi">
          <dl className="m-0 grid grid-cols-[160px_1fr] gap-y-2 text-xs">
            <dt className="text-slate-500 font-medium">Versi</dt><dd className="m-0 font-bold text-[#164A41]">{info.versi}</dd>
            <dt className="text-slate-500 font-medium">Jenis</dt><dd className="m-0 font-bold text-[#164A41]">{info.portable ? 'Portable (data di sebelah file .exe)' : 'Terpasang di Windows'}</dd>
            <dt className="text-slate-500 font-medium">Folder data</dt><dd className="m-0 font-bold text-[#164A41] break-all">{info.folderData}</dd>
          </dl>
          <p className="m-0 text-[11px] font-medium text-slate-500">Aplikasi ini berjalan sepenuhnya offline. Tidak ada data yang dikirim ke internet.</p>
        </Kartu>
      )}
    </>
  );
}
