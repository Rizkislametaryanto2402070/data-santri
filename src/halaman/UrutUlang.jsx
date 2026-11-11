import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Banner, Modal, Tombol } from '../ui.jsx';

// Menyusun ulang Nomor Induk Santri satu angkatan: Putra A-Z, lalu Putri A-Z.
export default function UrutUlang({ angkatan, onTutup, onSelesai }) {
  const [p, setP] = useState(null);
  const [galat, setGalat] = useState('');
  const [sibuk, setSibuk] = useState(false);

  useEffect(() => {
    api('nis:pratinjauUrut', angkatan.id)
      .then((r) => (r.ok ? setP(r) : setGalat(r.error)))
      .catch((e) => setGalat(e.message));
  }, [angkatan.id]);

  const berubah = p ? p.daftar.filter((d) => d.lama !== d.baru) : [];

  async function jalankan() {
    setSibuk(true);
    setGalat('');
    try {
      const r = await api('nis:urutUlang', angkatan.id);
      if (!r.ok) setGalat(r.error);
      else onSelesai(r);
    } catch (e) {
      setGalat(e.message);
    } finally {
      setSibuk(false);
    }
  }

  return (
    <Modal judul={`Urutkan Ulang Nomor Induk · Angkatan ${angkatan.nama}`} ikon="urut" onTutup={onTutup}>
      {galat && <Banner jenis="galat">{galat}</Banner>}

      {!p && !galat && <p className="m-0 text-xs text-slate-500">Memuat pratinjau…</p>}

      {p && p.jumlah === 0 && <p className="m-0 text-xs text-slate-500">Angkatan ini belum punya santri.</p>}

      {p && p.jumlah > 0 && berubah.length === 0 && (
        <Banner jenis="info">Nomor induk {p.jumlah} santri di angkatan ini sudah urut sesuai abjad. Tidak ada yang perlu diubah.</Banner>
      )}

      {p && berubah.length > 0 && (
        <>
          <Banner jenis="awas">
            <div className="font-bold">Nomor induk yang berubah akan berbeda dari yang mungkin sudah tercetak.</div>
            <div>Lakukan hanya jika nomor belum dipakai di kartu, ijazah, atau dokumen resmi. Salinan seluruh data dibuat otomatis sebelum nomor diubah.</div>
          </Banner>

          <p className="m-0 text-xs text-slate-600 font-medium">
            Format: <code className="font-bold text-[#164A41]">{p.format}</code>. <b>{berubah.length}</b> dari {p.jumlah} santri akan berganti nomor, disusun Putra A–Z lalu Putri A–Z.
          </p>

          <div className="max-h-[280px] overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-slate-50 text-left text-[11px] font-extrabold uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-3 py-2">Nama</th>
                  <th scope="col" className="px-3 py-2">Nomor lama</th>
                  <th scope="col" className="px-3 py-2">Nomor baru</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {berubah.map((d) => (
                  <tr key={d.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <div className="font-bold text-[#164A41]">{d.nama}</div>
                      <div className="text-[11px] font-medium text-slate-500">{d.jenis_kelamin}</div>
                    </td>
                    <td className="px-3 py-2 tabular-nums font-mono text-slate-500">{d.lama}</td>
                    <td className="px-3 py-2 tabular-nums font-mono font-bold text-[#164A41]">{d.baru}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-end gap-2">
        <Tombol onClick={onTutup}>{berubah.length > 0 ? 'Batal' : 'Tutup'}</Tombol>
        {berubah.length > 0 && (
          <Tombol varian="utama" ikon="urut" onClick={jalankan} disabled={sibuk}>
            {sibuk ? 'Mengurutkan…' : `Urutkan Ulang ${berubah.length} Nomor`}
          </Tombol>
        )}
      </div>
    </Modal>
  );
}
