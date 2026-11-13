import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { Banner, HeaderHalaman, Ikon, Kartu, Konfirmasi, Tombol, kelasInput, useToast } from '../ui.jsx';

function KartuMaster({ tabel, judul, contoh, petunjuk }) {
  const toast = useToast();
  const [daftar, setDaftar] = useState(null);
  const [baru, setBaru] = useState('');
  const [edit, setEdit] = useState(null); // { id, nama }
  const [hapus, setHapus] = useState(null);

  const muat = useCallback(
    () => api('master:daftar', tabel).then(setDaftar).catch((e) => toast(e.message, 'galat')),
    [tabel, toast]
  );
  useEffect(() => { muat(); }, [muat]);

  async function jalankan(fn, pesanOk) {
    try {
      const r = await fn();
      if (!r.ok) { toast(r.error, 'galat'); return false; }
      if (pesanOk) toast(pesanOk);
      await muat();
      return true;
    } catch (e) {
      toast(e.message, 'galat');
      return false;
    }
  }

  async function tambah(e) {
    e.preventDefault();
    if (await jalankan(() => api('master:tambah', tabel, baru), `${judul} "${baru.trim()}" ditambahkan.`)) setBaru('');
  }

  async function simpanEdit(e) {
    e.preventDefault();
    if (await jalankan(() => api('master:ubah', tabel, edit.id, edit.nama), 'Nama diperbarui.')) setEdit(null);
  }

  return (
    <Kartu judul={judul} className="flex-[1_1_300px] min-w-0">
      {petunjuk && <p className="m-0 -mt-2 text-[11px] font-medium text-slate-500">{petunjuk}</p>}

      <form onSubmit={tambah} className="flex gap-2">
        <input aria-label={`Nama ${judul} baru`} className={kelasInput} value={baru} onChange={(e) => setBaru(e.target.value)} placeholder={contoh} />
        <Tombol type="submit" varian="utama" ikon="plus" disabled={!baru.trim()} aria-label={`Tambah ${judul}`} />
      </form>

      {daftar === null ? null : daftar.length === 0 ? (
        <p className="m-0 text-xs text-slate-500">Belum ada data.</p>
      ) : (
        <ul className="m-0 p-0 list-none flex flex-col">
          {daftar.map((m) => (
            <li key={m.id} className="flex items-center gap-2 py-2 border-t border-slate-100">
              {edit && edit.id === m.id ? (
                <form onSubmit={simpanEdit} className="flex flex-1 gap-1.5 min-w-0">
                  <input aria-label="Nama baru" autoFocus className={kelasInput} value={edit.nama} onChange={(e) => setEdit({ ...edit, nama: e.target.value })} />
                  <Tombol type="submit" varian="utama" className="!px-3" aria-label="Simpan nama"><Ikon nama="centang" ukuran={16} /></Tombol>
                  <Tombol className="!px-3" onClick={() => setEdit(null)} aria-label="Batal ubah"><Ikon nama="tutup" ukuran={16} /></Tombol>
                </form>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{m.nama}</div>
                    <div className="text-[11px] font-medium text-slate-500">{m.jumlah} santri</div>
                  </div>
                  <button type="button" aria-label={`Ubah ${m.nama}`} onClick={() => setEdit({ id: m.id, nama: m.nama })} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-[#E6F4F1] hover:text-slate-800">
                    <Ikon nama="ubah" ukuran={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Hapus ${m.nama}`}
                    title={m.jumlah > 0 ? 'Masih dipakai santri, tidak bisa dihapus' : 'Hapus'}
                    disabled={m.jumlah > 0}
                    onClick={() => setHapus(m)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Ikon nama="hapus" ukuran={16} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {hapus && (
        <Konfirmasi
          judul={`Hapus ${judul.toLowerCase()}?`}
          pesan={`"${hapus.nama}" akan dihapus dari daftar.`}
          labelYa="Ya, hapus"
          bahaya
          onYa={async () => { await jalankan(() => api('master:hapus', tabel, hapus.id), 'Dihapus.'); setHapus(null); }}
          onBatal={() => setHapus(null)}
        />
      )}
    </Kartu>
  );
}

export default function Master() {
  return (
    <>
      <HeaderHalaman judul="Angkatan & Kelas" sub="Kelola daftar angkatan, kelas, dan asrama yang dipakai di data santri" />
      <Banner jenis="info">
        Nama angkatan dipakai di <b>Nomor Induk Santri</b>, jadi tulis sebagai tahun, misalnya 2024. Mengubah nama angkatan tidak mengubah nomor induk yang sudah ada;
        untuk memperbaruinya buka Data Santri, pilih angkatan, lalu klik Urutkan Ulang Nomor Induk.
      </Banner>
      <div className="flex flex-wrap gap-5 items-start">
        <KartuMaster tabel="angkatan" judul="Angkatan" contoh="Contoh: 2024" />
        <KartuMaster tabel="kelas" judul="Kelas" contoh="Contoh: Kelas 1" />
        <KartuMaster tabel="asrama" judul="Asrama" contoh="Contoh: Putra A" />
      </div>
    </>
  );
}
