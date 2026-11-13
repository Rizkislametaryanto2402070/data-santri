import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Ikon, Modal, Tombol, cx, useToast } from '../ui.jsx';

function Pilihan({ aktif, judul, ket, onClick, mati }) {
  return (
    <button
      type="button"
      aria-pressed={aktif}
      disabled={mati}
      onClick={onClick}
      className={cx(
        'flex items-center gap-3.5 w-full px-4 py-3 text-left rounded-2xl border-2 disabled:opacity-50 transition-colors',
        aktif ? 'border-[#0F766E] bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50'
      )}
    >
      <span className={cx('w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center flex-none', aktif ? 'border-[#0F766E]' : 'border-slate-300')}>
        <span className={cx('w-2.5 h-2.5 rounded-full', aktif ? 'bg-[#0F766E]' : 'bg-white')} />
      </span>
      <span className="flex flex-col">
        <span className="text-xs font-extrabold text-slate-800">{judul}</span>
        <span className="text-[11px] font-medium text-slate-500">{ket}</span>
      </span>
    </button>
  );
}

function Kotak({ aktif, label, onClick, kecil }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={aktif}
      onClick={onClick}
      className={cx(
        'inline-flex items-center gap-2 rounded-xl border text-xs font-bold text-left transition-colors',
        kecil ? 'px-3 py-2' : 'w-full px-4 py-2.5',
        aktif ? 'border-[#0F766E] bg-[#E6F4F1] text-slate-800' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
      )}
    >
      <span className={cx('w-[18px] h-[18px] rounded-[5px] border-[1.5px] flex items-center justify-center flex-none', aktif ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-white border-slate-300 text-transparent')}>
        <Ikon nama="centang" ukuran={12} />
      </span>
      {label}
    </button>
  );
}

export default function ExportDialog({ filter, adaFilter, jumlahFilter, labelFilter, angkatan, total, idsPilihan = [], modeAwal = null, onTutup }) {
  const toast = useToast();
  const [semuaKolom, setSemuaKolom] = useState([]);
  const [kolomMati, setKolomMati] = useState(['nik']); // NIK tidak ikut secara bawaan karena sensitif
  const jumlahPilihan = idsPilihan.length;
  const [mode, setMode] = useState(modeAwal === 'pilihan' && jumlahPilihan > 0 ? 'pilihan' : adaFilter ? 'filter' : 'semua');
  const [angkatanId, setAngkatanId] = useState(filter.angkatanId ? String(filter.angkatanId) : angkatan[0] ? String(angkatan[0].id) : '');
  const [sheets, setSheets] = useState(false);
  const [blokJk, setBlokJk] = useState(true);
  const [sibuk, setSibuk] = useState(false);
  const [hasil, setHasil] = useState(null);

  useEffect(() => {
    api('export:kolom').then(setSemuaKolom).catch((e) => toast(e.message, 'galat'));
  }, [toast]);

  const dipilih = semuaKolom.filter((k) => !kolomMati.includes(k.id)).map((k) => k.id);
  const a = angkatan.find((x) => String(x.id) === String(angkatanId));

  let jumlah = total;
  let namaFile = 'Data_Santri_Semua.xlsx';
  if (mode === 'angkatan') {
    jumlah = a ? a.jumlah : 0;
    namaFile = `Data_Santri_Angkatan_${a ? a.nama : ''}.xlsx`;
  } else if (mode === 'filter') {
    jumlah = jumlahFilter;
    namaFile = 'Data_Santri_Hasil_Filter.xlsx';
  } else if (mode === 'pilihan') {
    jumlah = jumlahPilihan;
    namaFile = 'Data_Santri_Terpilih.xlsx';
  }

  const toggleKolom = (id) => setKolomMati((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));

  async function ekspor() {
    setSibuk(true);
    try {
      const r = await api('export:excel', {
        mode,
        angkatanId: Number(angkatanId) || null,
        filter,
        ids: mode === 'pilihan' ? idsPilihan : undefined,
        kolom: dipilih,
        sheetPerAngkatan: sheets,
        blokJk
      });
      if (r.batal) return;
      if (!r.ok) { toast(r.error, 'galat'); return; }
      setHasil(r);
    } catch (e) {
      toast(e.message, 'galat');
    } finally {
      setSibuk(false);
    }
  }

  if (hasil) {
    return (
      <Modal judul="File Excel tersimpan" ikon="centang" onTutup={onTutup} lebar="max-w-lg">
        <p className="m-0 text-xs text-slate-600 font-medium">{hasil.jumlah} santri berhasil diekspor ke:</p>
        <p className="m-0 text-xs font-bold text-slate-800 break-all bg-[#E6F4F1] rounded-xl px-4 py-3">{hasil.path}</p>
        <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-end gap-2">
          <Tombol ikon="folder" onClick={() => api('app:tampilkan', hasil.path).catch(() => {})}>Tampilkan di Folder</Tombol>
          <Tombol varian="utama" onClick={onTutup}>Selesai</Tombol>
        </div>
      </Modal>
    );
  }

  return (
    <Modal judul="Export ke Excel" ikon="file" onTutup={onTutup} lebar="max-w-xl">
      <p className="m-0 -mt-1 text-xs text-slate-500 font-medium">Pilih data dan kolom yang ingin dimasukkan ke file .xlsx</p>

      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-bold text-slate-800">Data yang diekspor</span>
        <Pilihan aktif={mode === 'semua'} judul="Semua santri" ket={`Seluruh data di database (${total} santri)`} onClick={() => setMode('semua')} />
        <Pilihan aktif={mode === 'angkatan'} judul="Per angkatan" ket="Pilih satu angkatan saja" onClick={() => setMode('angkatan')} mati={angkatan.length === 0} />
        <Pilihan
          aktif={mode === 'filter'}
          judul="Sesuai hasil filter"
          ket={adaFilter ? `Yang sedang tampil di daftar: ${labelFilter} (${jumlahFilter} santri)` : 'Belum ada filter aktif di daftar, sama dengan semua santri'}
          onClick={() => setMode('filter')}
        />
        <Pilihan
          aktif={mode === 'pilihan'}
          judul="Santri yang dipilih"
          ket={jumlahPilihan ? `${jumlahPilihan} santri yang Anda centang di daftar` : 'Belum ada santri yang dicentang di daftar'}
          onClick={() => setMode('pilihan')}
          mati={jumlahPilihan === 0}
        />
      </div>

      {mode === 'angkatan' && (
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold text-slate-800">Pilih angkatan</span>
          <div className="flex flex-wrap gap-2">
            {angkatan.map((x) => {
              const on = String(x.id) === String(angkatanId);
              return (
                <button
                  key={x.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setAngkatanId(String(x.id))}
                  className={cx('inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-colors', on ? 'bg-[#0F766E] border-[#0F766E] text-white shadow-sm' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50')}
                >
                  {x.nama}
                  <span className={cx('text-[11px]', on ? 'text-[#FACC15]' : 'text-slate-500')}>{x.jumlah}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {mode === 'semua' && <Kotak aktif={sheets} onClick={() => setSheets(!sheets)} label="Pisahkan per angkatan (satu sheet untuk tiap angkatan)" />}
        <Kotak aktif={blokJk} onClick={() => setBlokJk(!blokJk)} label="Pisahkan blok Putra dan Putri di tiap angkatan (cocok untuk dicetak)" />
        {!blokJk && <p className="m-0 text-[11px] font-medium text-slate-500">Tanpa blok, data berupa satu daftar rata dengan filter Excel, tetap berurutan Putra lalu Putri dan A–Z.</p>}
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap justify-between gap-2">
          <span className="text-xs font-bold text-slate-800">Kolom yang disertakan</span>
          <span className="text-[11px] font-medium text-slate-500">{dipilih.length} dari {semuaKolom.length} kolom dipilih</span>
        </div>
        <p className="m-0 text-[11px] font-medium text-slate-500">Kolom pertama selalu No. Induk Santri.</p>
        <div className="flex flex-wrap gap-2">
          {semuaKolom.map((k) => (
            <Kotak key={k.id} kecil aktif={!kolomMati.includes(k.id)} label={k.judul} onClick={() => toggleKolom(k.id)} />
          ))}
        </div>
      </div>

      <div className="bg-[#E6F4F1] border border-[#B5E2D8] rounded-2xl px-4 py-3 flex items-start gap-3">
        <Ikon nama="file" className="text-slate-800 flex-none mt-0.5" />
        <div className="min-w-0">
          <div className="text-xs font-extrabold text-slate-800">{jumlah} santri akan diekspor</div>
          <div className="text-xs font-semibold text-slate-600 break-all">{namaFile}</div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
        <span className="mr-auto text-[11px] font-medium text-slate-500">Anda akan diminta memilih lokasi penyimpanan file.</span>
        <Tombol onClick={onTutup}>Batal</Tombol>
        <Tombol varian="utama" ikon="unduh" onClick={ekspor} disabled={sibuk || jumlah === 0 || dipilih.length === 0 || (mode === 'angkatan' && !a)}>
          {sibuk ? 'Membuat file…' : 'Export ke Excel'}
        </Tombol>
      </div>
    </Modal>
  );
}
