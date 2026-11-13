import React, { useState } from 'react';
import { api } from '../api.js';
import { Banner, HeaderHalaman, Kartu, Tombol, cx, useToast } from '../ui.jsx';

const BATAS_TAMPIL = 200;

export default function Impor({ pergi }) {
  const toast = useToast();
  const [baca, setBaca] = useState(null); // hasil membaca file
  const [hasil, setHasil] = useState(null); // hasil impor
  const [sibuk, setSibuk] = useState(false);

  async function unduhTemplate() {
    try {
      const r = await api('import:template');
      if (r.batal) return;
      toast('Template tersimpan. Isi lalu pilih file-nya di langkah 2.');
      api('app:tampilkan', r.path).catch(() => {});
    } catch (e) {
      toast(e.message, 'galat');
    }
  }

  async function pilihFile() {
    setSibuk(true);
    try {
      const r = await api('import:baca');
      if (r.batal) return;
      if (!r.ok) { toast(r.error, 'galat'); return; }
      setHasil(null);
      setBaca(r);
    } catch (e) {
      toast(e.message, 'galat');
    } finally {
      setSibuk(false);
    }
  }

  const siap = baca ? baca.baris.filter((b) => b.error.length === 0) : [];
  const bermasalah = baca ? baca.baris.filter((b) => b.error.length > 0) : [];
  const otomatis = siap.filter((b) => !b.data.nis).length;

  async function jalankan() {
    setSibuk(true);
    try {
      const r = await api('import:masuk', siap.map((b) => b.data));
      setHasil(r);
      setBaca(null);
      toast(`${r.masuk} santri berhasil diimpor.`);
    } catch (e) {
      toast(e.message, 'galat');
    } finally {
      setSibuk(false);
    }
  }

  return (
    <>
      <HeaderHalaman judul="Import Excel" sub="Masukkan data santri dari file Excel sekaligus" />

      <Kartu judul="Langkah 1 · Unduh template">
        <p className="m-0 text-xs text-slate-600 font-medium">
          Isi data santri ke template ini (data dari buku bisa diketik dulu ke sini). Kolom NIS boleh dikosongkan: nomor induk dibuat otomatis, urut abjad per angkatan (Putra dulu, lalu Putri).
        </p>
        <div><Tombol ikon="unduh" onClick={unduhTemplate}>Unduh Template Excel</Tombol></div>
      </Kartu>

      <Kartu judul="Langkah 2 · Pilih file yang sudah diisi">
        <div><Tombol varian="utama" ikon="impor" onClick={pilihFile} disabled={sibuk}>{sibuk ? 'Membaca…' : 'Pilih File Excel'}</Tombol></div>

        {baca && baca.kolomHilang.length > 0 && (
          <Banner jenis="galat">
            <div className="font-bold">Kolom wajib tidak ditemukan di {baca.berkas}:</div>
            <div>{baca.kolomHilang.join(', ')}. Pastikan baris pertama berisi nama kolom seperti di template.</div>
          </Banner>
        )}

        {baca && baca.kolomHilang.length === 0 && (
          <>
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-xs font-extrabold text-slate-800">{baca.berkas}</span>
              <span className="px-3 py-1 rounded-full bg-[#E6F4F1] text-slate-800 text-[11px] font-bold">{siap.length} siap diimpor</span>
              {bermasalah.length > 0 && <span className="px-3 py-1 rounded-full bg-red-100 text-red-900 text-[11px] font-bold">{bermasalah.length} bermasalah (dilewati)</span>}
              {otomatis > 0 && <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">{otomatis} nomor induk akan dibuat otomatis</span>}
            </div>

            {baca.baris.length === 0 ? (
              <p className="m-0 text-xs text-slate-500">Tidak ada baris data di file ini.</p>
            ) : (
              <div className="overflow-auto max-h-[380px] border border-slate-200 rounded-xl">
                <table className="w-full min-w-[760px] border-collapse">
                  <thead className="sticky top-0 bg-slate-50 text-left text-[11px] font-extrabold uppercase text-slate-500">
                    <tr>
                      <th scope="col" className="px-3 py-2 w-[60px]">Baris</th>
                      <th scope="col" className="px-3 py-2">Nama</th>
                      <th scope="col" className="px-3 py-2">Angkatan</th>
                      <th scope="col" className="px-3 py-2">JK</th>
                      <th scope="col" className="px-3 py-2">NIS</th>
                      <th scope="col" className="px-3 py-2">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {baca.baris.slice(0, BATAS_TAMPIL).map((b) => (
                      <tr key={b.no} className={cx('border-t border-slate-100', b.error.length > 0 && 'bg-red-50')}>
                        <td className="px-3 py-2 text-slate-500">{b.no}</td>
                        <td className="px-3 py-2 font-bold text-slate-800">{b.data.nama || '—'}</td>
                        <td className="px-3 py-2">{b.data.angkatan || '—'}</td>
                        <td className="px-3 py-2">{b.data.jenis_kelamin || '—'}</td>
                        <td className="px-3 py-2 tabular-nums">{b.data.nis || <span className="text-slate-400">otomatis</span>}</td>
                        <td className="px-3 py-2">
                          {b.error.length > 0 ? <span className="text-red-800 font-bold">{b.error.join('; ')}</span> : <span className="text-emerald-700 font-bold">Siap</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {baca.baris.length > BATAS_TAMPIL && <p className="m-0 text-[11px] font-medium text-slate-500">Menampilkan {BATAS_TAMPIL} baris pertama dari {baca.baris.length}. Semua baris yang siap tetap diimpor.</p>}

            <div className="flex flex-wrap gap-2.5">
              <Tombol varian="utama" ikon="centang" onClick={jalankan} disabled={sibuk || siap.length === 0}>{sibuk ? 'Mengimpor…' : `Impor ${siap.length} Santri`}</Tombol>
              <Tombol onClick={() => setBaca(null)}>Batal</Tombol>
            </div>
          </>
        )}
      </Kartu>

      {hasil && (
        <Kartu judul="Hasil impor">
          <Banner jenis="info">
            <div className="font-bold">{hasil.masuk} santri berhasil diimpor.</div>
            {hasil.otomatis > 0 && <div>{hasil.otomatis} nomor induk dibuat otomatis, urut abjad per angkatan.</div>}
          </Banner>
          {hasil.lewat.length > 0 && (
            <Banner jenis="awas">
              <div className="font-bold">{hasil.lewat.length} baris dilewati:</div>
              <ul className="m-0 pl-5">
                {hasil.lewat.slice(0, 20).map((l, i) => <li key={i}>{l.nama || l.nis || '(tanpa nama)'}: {l.error}</li>)}
              </ul>
            </Banner>
          )}
          <div><Tombol varian="utama" ikon="santri" onClick={() => pergi('santri')}>Lihat Data Santri</Tombol></div>
        </Kartu>
      )}
    </>
  );
}
