import React, { useCallback, useEffect, useState } from 'react';
import { api, waktuIndo } from '../api.js';
import { Banner, HeaderHalaman, Kartu, Tombol, useToast } from '../ui.jsx';

export default function Backup() {
  const toast = useToast();
  const [info, setInfo] = useState(null);
  const [pulih, setPulih] = useState(null);
  const [sibuk, setSibuk] = useState(false);

  const muat = useCallback(() => api('backup:info').then(setInfo).catch((e) => toast(e.message, 'galat')), [toast]);
  useEffect(() => { muat(); }, [muat]);

  async function jalankan(fn) {
    setSibuk(true);
    try {
      await fn();
    } catch (e) {
      toast(e.message, 'galat');
    } finally {
      setSibuk(false);
    }
  }

  const buat = () => jalankan(async () => {
    const r = await api('backup:buat');
    if (r.batal) return;
    toast('Backup tersimpan.');
    api('app:tampilkan', r.path).catch(() => {});
    await muat();
  });

  const pulihkan = () => jalankan(async () => {
    const r = await api('backup:pulihkan');
    if (r.batal) return;
    if (!r.ok) { toast(r.error, 'galat'); return; }
    setPulih(r);
    await muat();
  });

  const pilihFolder = () => jalankan(async () => {
    const r = await api('backup:pilihFolder');
    if (r.batal) return;
    toast('Backup otomatis diaktifkan.');
    await muat();
  });

  const matikan = () => jalankan(async () => {
    await api('backup:matikanOtomatis');
    toast('Backup otomatis dimatikan.');
    await muat();
  });

  if (!info) return null;
  const terakhir = waktuIndo(info.terakhir);
  const hari = info.terakhir ? Math.floor((Date.now() - new Date(info.terakhir).getTime()) / 86400000) : null;
  const perluBackup = !terakhir || (hari !== null && hari > 30);

  return (
    <>
      <HeaderHalaman judul="Backup & Restore" sub="Amankan data, atau pindahkan ke laptop pengganti" />

      <Banner jenis="awas">
        File backup berisi data pribadi santri (NIK, alamat, data wali). Simpan di tempat yang aman dan jangan dibagikan sembarangan. Password aplikasi tidak mengenkripsi file backup.
      </Banner>

      {perluBackup && (
        <Banner jenis="awas">
          {terakhir
            ? `Backup terakhir sudah ${hari} hari lalu. Buat backup baru, atau aktifkan backup otomatis di bawah.`
            : 'Data belum pernah dibackup. Jika laptop rusak atau hilang, data tidak bisa dikembalikan. Buat backup sekarang, atau aktifkan backup otomatis di bawah.'}
        </Banner>
      )}

      {pulih && (
        <Banner jenis="info">
          <div className="font-bold">Data berhasil dipulihkan: {pulih.jumlah} santri.</div>
          <div>Data sebelumnya disimpan otomatis di: <span className="break-all">{pulih.cadangan}</span></div>
        </Banner>
      )}

      <div className="flex flex-wrap gap-5 items-start">
        <Kartu judul="Buat backup" className="flex-[1_1_320px] min-w-0">
          <p className="m-0 text-xs text-slate-600 font-medium">Simpan seluruh data (termasuk foto) ke satu file <b>.db</b>. Kirim lewat flashdisk atau WhatsApp ke pengganti Anda.</p>
          <p className="m-0 text-xs text-slate-600"><b className="text-slate-800">Backup terakhir:</b> {terakhir || 'belum pernah'}</p>
          <div><Tombol varian="utama" ikon="backup" onClick={buat} disabled={sibuk}>Backup Sekarang</Tombol></div>
        </Kartu>

        <Kartu judul="Pulihkan dari backup" className="flex-[1_1_320px] min-w-0">
          <p className="m-0 text-xs text-slate-600 font-medium">Pilih file backup <b>.db</b>. Data di laptop ini akan diganti isi backup. Data yang sekarang disimpan dulu sebagai salinan otomatis.</p>
          <div><Tombol ikon="impor" onClick={pulihkan} disabled={sibuk}>Pulihkan dari File Backup</Tombol></div>
        </Kartu>

        <Kartu judul="Backup otomatis" className="flex-[1_1_320px] min-w-0">
          <p className="m-0 text-xs text-slate-600 font-medium">Setiap aplikasi ditutup, salinan data disimpan ke folder pilihan Anda. Disimpan 10 salinan terbaru.</p>
          {info.folderOtomatis ? (
            <>
              <p className="m-0 bg-[#E6F4F1] text-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold break-all">{info.folderOtomatis}</p>
              <div className="flex flex-wrap gap-2.5">
                <Tombol ikon="folder" onClick={pilihFolder} disabled={sibuk}>Ganti Folder</Tombol>
                <Tombol onClick={matikan} disabled={sibuk}>Matikan</Tombol>
              </div>
            </>
          ) : (
            <div><Tombol ikon="folder" onClick={pilihFolder} disabled={sibuk}>Pilih Folder Backup Otomatis</Tombol></div>
          )}
        </Kartu>
      </div>

      <Kartu judul="Lokasi data di laptop ini">
        <p className="m-0 bg-[#E6F4F1] text-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold break-all">{info.lokasiData}</p>
        <div><Tombol ikon="folder" onClick={() => api('app:bukaFolderData').catch((e) => toast(e.message, 'galat'))}>Buka Folder Data</Tombol></div>
      </Kartu>
    </>
  );
}
