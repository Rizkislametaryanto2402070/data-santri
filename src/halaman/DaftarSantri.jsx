import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, ringkasFilter } from '../api.js';
import { Avatar, HeaderHalaman, Ikon, Konfirmasi, Lencana, Tombol, cx, kelasInput, useToast } from '../ui.jsx';
import ExportDialog from './ExportDialog.jsx';
import UrutUlang from './UrutUlang.jsx';

const UKURAN = 25;
const KOSONG = { q: '', angkatanId: '', kelasId: '', asramaId: '', status: '', jenisKelamin: '' };

// Nomor halaman dengan "…" bila terlalu banyak.
function nomorHalaman(sekarang, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, sekarang, sekarang - 1, sekarang + 1]);
  const urut = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const hasil = [];
  urut.forEach((n, i) => {
    if (i > 0 && n - urut[i - 1] > 1) hasil.push('…' + n);
    hasil.push(n);
  });
  return hasil;
}

function Centang({ aktif, setengah, label, onClick }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={setengah ? 'mixed' : aktif}
      aria-label={label}
      onClick={onClick}
      className={cx(
        'w-[18px] h-[18px] rounded-[5px] border-[1.5px] flex items-center justify-center flex-none transition-colors cursor-pointer',
        aktif || setengah ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-white border-slate-300 text-transparent hover:border-[#0F766E]'
      )}
    >
      {setengah ? <span className="w-2 h-0.5 rounded bg-white" /> : <Ikon nama="centang" ukuran={12} />}
    </button>
  );
}

export default function DaftarSantri({ pergi, param }) {
  const toast = useToast();
  const [master, setMaster] = useState({ angkatan: [], kelas: [], asrama: [] });
  const [filter, setFilter] = useState(KOSONG);
  const [teksCari, setTeksCari] = useState('');
  const [daftar, setDaftar] = useState(null);
  const [halaman, setHalaman] = useState(1);
  const [hapus, setHapus] = useState(null);
  const [sibukHapus, setSibukHapus] = useState(false);
  const [dialogExport, setDialogExport] = useState(!!(param && param.bukaExport));
  const [modeAwal, setModeAwal] = useState(null);
  const [dialogUrut, setDialogUrut] = useState(false);
  // ID santri yang dicentang. Tetap tersimpan saat pindah halaman, mengganti filter, atau mencari nama lain.
  const [terpilih, setTerpilih] = useState(() => new Set());
  const permintaan = useRef(0);

  const muatMaster = useCallback(async () => {
    const [angkatan, kelas, asrama] = await Promise.all([
      api('master:daftar', 'angkatan'),
      api('master:daftar', 'kelas'),
      api('master:daftar', 'asrama')
    ]);
    setMaster({ angkatan, kelas, asrama });
  }, []);

  const muatDaftar = useCallback(async () => {
    const no = ++permintaan.current;
    try {
      const d = await api('santri:daftar', filter);
      if (no === permintaan.current) setDaftar(d);
    } catch (e) {
      toast(e.message, 'galat');
    }
  }, [filter, toast]);

  useEffect(() => { muatMaster().catch((e) => toast(e.message, 'galat')); }, [muatMaster, toast]);
  useEffect(() => { muatDaftar(); }, [muatDaftar]);

  // Pencarian menunggu sebentar setelah mengetik.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilter((f) => (f.q === teksCari ? f : { ...f, q: teksCari }));
      setHalaman(1);
    }, 200);
    return () => clearTimeout(t);
  }, [teksCari]);

  const ubahFilter = (patch) => { setFilter((f) => ({ ...f, ...patch })); setHalaman(1); };
  const adaFilter = Object.values(filter).some(Boolean);
  const reset = () => { setFilter(KOSONG); setTeksCari(''); setHalaman(1); };

  const totalSemua = master.angkatan.reduce((n, a) => n + a.jumlah, 0);
  const labelFilter = ringkasFilter(filter, master);
  const angkatanDipilih = master.angkatan.find((a) => String(a.id) === String(filter.angkatanId));

  const jumlahGrup = useMemo(() => {
    const m = new Map();
    (daftar || []).forEach((s) => {
      const k = s.angkatan + '|' + s.jenis_kelamin;
      m.set(k, (m.get(k) || 0) + 1);
    });
    return m;
  }, [daftar]);

  const jumlahHalaman = Math.max(1, Math.ceil((daftar ? daftar.length : 0) / UKURAN));
  const halamanAman = Math.min(halaman, jumlahHalaman);
  const tampil = (daftar || []).slice((halamanAman - 1) * UKURAN, halamanAman * UKURAN);

  const idTampil = tampil.map((x) => x.id);
  const semuaTampilDipilih = idTampil.length > 0 && idTampil.every((id) => terpilih.has(id));
  const sebagianTampilDipilih = !semuaTampilDipilih && idTampil.some((id) => terpilih.has(id));
  const dipilihDiDaftar = (daftar || []).filter((x) => terpilih.has(x.id)).length;

  const ubahPilihan = (fn) => setTerpilih((lama) => { const baru = new Set(lama); fn(baru); return baru; });
  const gantiSatu = (id) => ubahPilihan((b) => (b.has(id) ? b.delete(id) : b.add(id)));
  const gantiHalaman = () => ubahPilihan((b) => (semuaTampilDipilih ? idTampil.forEach((id) => b.delete(id)) : idTampil.forEach((id) => b.add(id))));
  const pilihSemuaHasil = () => ubahPilihan((b) => (daftar || []).forEach((x) => b.add(x.id)));
  const kosongkanPilihan = () => setTerpilih(new Set());
  const bukaExport = (mode) => { setModeAwal(mode); setDialogExport(true); };

  // Sisipkan judul blok "Angkatan · Putra/Putri" setiap kelompok berganti.
  const baris = [];
  let kunciLalu = null;
  tampil.forEach((s) => {
    const k = s.angkatan + '|' + s.jenis_kelamin;
    if (k !== kunciLalu) {
      kunciLalu = k;
      baris.push({ tipe: 'blok', kunci: 'b' + s.id, angkatan: s.angkatan, jk: s.jenis_kelamin, jumlah: jumlahGrup.get(k) });
    }
    baris.push({ tipe: 'santri', kunci: 's' + s.id, s });
  });

  async function konfirmasiHapus() {
    setSibukHapus(true);
    try {
      await api('santri:hapus', hapus.id);
      toast(`${hapus.nama} dihapus.`);
      ubahPilihan((b) => b.delete(hapus.id));
      setHapus(null);
      await Promise.all([muatDaftar(), muatMaster()]);
    } catch (e) {
      toast(e.message, 'galat');
    } finally {
      setSibukHapus(false);
    }
  }

  const jumlah = daftar ? daftar.length : 0;

  return (
    <>
      <HeaderHalaman judul="Data Santri" sub={`${totalSemua} santri terdaftar`}>
        {filter.angkatanId && (
          <Tombol ikon="urut" onClick={() => setDialogUrut(true)}>Urutkan Ulang Nomor Induk</Tombol>
        )}
        <Tombol ikon="file" onClick={() => bukaExport(null)}>Export Excel</Tombol>
        <Tombol varian="utama" ikon="plus" onClick={() => pergi('form')}>Tambah Santri</Tombol>
      </HeaderHalaman>

      <section aria-label="Pencarian dan filter" className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] border border-slate-100/80 flex flex-col gap-4">
        <div role="group" aria-label="Filter angkatan" className="flex gap-2 overflow-x-auto pb-1">
          <TabAngkatan aktif={!filter.angkatanId} label="Semua" jumlah={totalSemua} onClick={() => ubahFilter({ angkatanId: '' })} />
          {master.angkatan.map((a) => (
            <TabAngkatan key={a.id} aktif={String(filter.angkatanId) === String(a.id)} label={a.nama} jumlah={a.jumlah} onClick={() => ubahFilter({ angkatanId: String(a.id) })} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex-[2_1_280px] min-w-0 flex items-center gap-2.5 px-3.5 py-2 bg-white border border-slate-300 rounded-full text-slate-400 focus-within:border-[#0F766E] focus-within:ring-2 focus-within:ring-[#0F766E]/15">
            <Ikon nama="cari" ukuran={16} />
            <input
              type="search"
              aria-label="Cari santri"
              placeholder="Cari nama, nomor induk, atau nama wali…"
              value={teksCari}
              onChange={(e) => setTeksCari(e.target.value)}
              className="flex-1 min-w-0 border-0 outline-none bg-transparent text-xs font-semibold text-[#12352E] placeholder:font-medium placeholder:text-slate-400"
            />
          </label>
          <select aria-label="Filter status" className={cx(kelasInput, 'flex-[1_1_140px] w-auto !rounded-full')} value={filter.status} onChange={(e) => ubahFilter({ status: e.target.value })}>
            <option value="">Semua Status</option>
            <option>Aktif</option><option>Alumni</option><option>Boyong</option><option>Pindah</option>
          </select>
          <select aria-label="Filter kelas" className={cx(kelasInput, 'flex-[1_1_140px] w-auto !rounded-full')} value={filter.kelasId} onChange={(e) => ubahFilter({ kelasId: e.target.value })}>
            <option value="">Semua Kelas</option>
            {master.kelas.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>
          <select aria-label="Filter asrama" className={cx(kelasInput, 'flex-[1_1_140px] w-auto !rounded-full')} value={filter.asramaId} onChange={(e) => ubahFilter({ asramaId: e.target.value })}>
            <option value="">Semua Asrama</option>
            {master.asrama.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
          </select>
          <select aria-label="Filter jenis kelamin" className={cx(kelasInput, 'flex-[1_1_140px] w-auto !rounded-full')} value={filter.jenisKelamin} onChange={(e) => ubahFilter({ jenisKelamin: e.target.value })}>
            <option value="">Putra &amp; Putri</option>
            <option>Putra</option><option>Putri</option>
          </select>
        </div>
      </section>

      {terpilih.size > 0 && (
        <section aria-label="Santri yang dipilih" className="bg-[#E6F4F1] border border-[#B5E2D8] rounded-2xl px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="mr-auto min-w-0">
            <div className="text-xs font-extrabold text-slate-800">{terpilih.size} santri dipilih</div>
            {dipilihDiDaftar !== terpilih.size && (
              <div className="text-[11px] font-medium text-slate-600">{dipilihDiDaftar} tampil di daftar ini, sisanya dari pencarian atau filter sebelumnya</div>
            )}
          </div>
          {jumlah > 0 && dipilihDiDaftar < jumlah && (
            <Tombol varian="teks" onClick={pilihSemuaHasil}>Pilih semua hasil ({jumlah})</Tombol>
          )}
          <Tombol varian="teks" onClick={kosongkanPilihan}>Kosongkan</Tombol>
          <Tombol varian="utama" ikon="unduh" onClick={() => bukaExport('pilihan')}>Export yang dipilih</Tombol>
        </section>
      )}

      <section aria-label="Tabel santri" className="bg-white rounded-2xl shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] border border-slate-100/80 overflow-hidden flex flex-col">
        <div className="flex flex-wrap justify-between items-center gap-2 pl-5 pr-4 py-2.5 border-b border-slate-200">
          <span className="text-xs font-extrabold text-slate-800">
            {jumlah} santri{labelFilter ? ' · ' + labelFilter : ''}
          </span>
          {adaFilter && <Tombol varian="teks" onClick={reset}>Reset filter</Tombol>}
        </div>

        {daftar === null ? (
          <p className="m-0 p-8 text-center text-xs text-slate-500">Memuat…</p>
        ) : jumlah === 0 ? (
          <div className="p-10 text-center flex flex-col items-center gap-3">
            <p className="m-0 text-xs text-slate-500">{adaFilter ? 'Tidak ada santri yang cocok dengan pencarian atau filter ini.' : 'Belum ada data santri.'}</p>
            {!adaFilter && (
              <div className="flex flex-wrap gap-3 justify-center">
                <Tombol varian="utama" ikon="plus" onClick={() => pergi('form')}>Tambah Santri</Tombol>
                <Tombol ikon="impor" onClick={() => pergi('impor')}>Import Excel</Tombol>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[11px] font-extrabold uppercase text-slate-500">
                  <th scope="col" className="pl-5 pr-1 py-2.5 w-[44px]">
                    <Centang aktif={semuaTampilDipilih} setengah={sebagianTampilDipilih} label="Pilih semua santri di halaman ini" onClick={gantiHalaman} />
                  </th>
                  <th scope="col" className="px-4 py-2.5 w-[150px]">No. Induk</th>
                  <th scope="col" className="px-4 py-2.5">Santri</th>
                  <th scope="col" className="px-4 py-2.5 w-[80px]">Kelas</th>
                  <th scope="col" className="px-4 py-2.5 w-[140px]">Asrama</th>
                  <th scope="col" className="px-4 py-2.5">Wali</th>
                  <th scope="col" className="px-4 py-2.5 w-[96px]">Status</th>
                  <th scope="col" className="px-4 py-2.5 w-[110px]"><span className="sr-only">Aksi</span></th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {baris.map((b) =>
                  b.tipe === 'blok' ? (
                    <tr key={b.kunci} className="bg-[#E6F4F1]">
                      <th colSpan={8} scope="colgroup" className="px-4 py-2 text-left text-xs font-extrabold text-slate-800">
                        {filter.angkatanId ? '' : `Angkatan ${b.angkatan} · `}
                        {b.jk} · {b.jumlah} santri
                      </th>
                    </tr>
                  ) : (
                    <tr key={b.kunci} className={cx('border-t border-slate-100', terpilih.has(b.s.id) ? 'bg-[#F1F9F7]' : 'hover:bg-slate-50')}>
                      <td className="pl-5 pr-1 py-2.5">
                        <Centang aktif={terpilih.has(b.s.id)} label={`Pilih ${b.s.nama}`} onClick={() => gantiSatu(b.s.id)} />
                      </td>
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-600 tabular-nums whitespace-nowrap">{b.s.nis}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar nama={b.s.nama} ukuran={32} />
                          <span className="font-bold text-slate-800">{b.s.nama}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 font-medium">{b.s.kelas || '—'}</td>
                      <td className="px-4 py-2.5 text-slate-600 font-medium">{[b.s.asrama, b.s.kamar].filter(Boolean).join(' · ') || '—'}</td>
                      <td className="px-4 py-2.5">
                        <div className="font-bold text-slate-700">{b.s.nama_wali || b.s.nama_ayah || b.s.nama_ibu || '—'}</div>
                        {b.s.hp_wali && <div className="text-[11px] font-medium text-slate-500">{b.s.hp_wali}</div>}
                      </td>
                      <td className="px-4 py-2.5"><Lencana status={b.s.status} /></td>
                      <td className="px-4 py-1.5">
                        <div className="flex gap-1">
                          <button type="button" aria-label={`Ubah ${b.s.nama}`} onClick={() => pergi('form', { id: b.s.id })} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-[#E6F4F1] hover:text-slate-800">
                            <Ikon nama="ubah" ukuran={16} />
                          </button>
                          <button type="button" aria-label={`Hapus ${b.s.nama}`} onClick={() => setHapus(b.s)} className="w-9 h-9 rounded-full flex items-center justify-center text-red-600 hover:bg-red-50">
                            <Ikon nama="hapus" ukuran={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {jumlah > UKURAN && (
          <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-3 border-t border-slate-200">
            <span className="text-xs font-medium text-slate-500">
              Menampilkan {(halamanAman - 1) * UKURAN + 1}–{Math.min(halamanAman * UKURAN, jumlah)} dari {jumlah} santri
            </span>
            <nav aria-label="Halaman" className="flex gap-1.5">
              <button type="button" aria-label="Halaman sebelumnya" disabled={halamanAman === 1} onClick={() => setHalaman(halamanAman - 1)} className="w-9 h-9 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-500 disabled:opacity-40">
                <Ikon nama="kiri" ukuran={16} />
              </button>
              {nomorHalaman(halamanAman, jumlahHalaman).map((n) =>
                typeof n === 'string' ? (
                  <span key={n} className="w-6 h-9 flex items-center justify-center text-slate-400">…</span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    aria-current={n === halamanAman ? 'page' : undefined}
                    onClick={() => setHalaman(n)}
                    className={cx('w-9 h-9 rounded-full border text-xs font-bold', n === halamanAman ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50')}
                  >
                    {n}
                  </button>
                )
              )}
              <button type="button" aria-label="Halaman berikutnya" disabled={halamanAman === jumlahHalaman} onClick={() => setHalaman(halamanAman + 1)} className="w-9 h-9 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-500 disabled:opacity-40">
                <Ikon nama="kanan" ukuran={16} />
              </button>
            </nav>
          </div>
        )}
      </section>

      {hapus && (
        <Konfirmasi
          judul="Hapus data santri?"
          pesan={`Data ${hapus.nama} (${hapus.nis}) beserta fotonya akan dihapus permanen. Data hanya bisa dikembalikan dari file backup.`}
          labelYa="Ya, hapus"
          bahaya
          sibuk={sibukHapus}
          onYa={konfirmasiHapus}
          onBatal={() => setHapus(null)}
        />
      )}

      {dialogExport && (
        <ExportDialog
          filter={filter}
          adaFilter={adaFilter}
          jumlahFilter={jumlah}
          labelFilter={labelFilter}
          angkatan={master.angkatan}
          total={totalSemua}
          idsPilihan={[...terpilih]}
          modeAwal={modeAwal}
          onTutup={() => { setDialogExport(false); setModeAwal(null); }}
        />
      )}

      {dialogUrut && angkatanDipilih && (
        <UrutUlang
          angkatan={angkatanDipilih}
          onTutup={() => setDialogUrut(false)}
          onSelesai={(r) => {
            setDialogUrut(false);
            toast(`${r.berubah} nomor induk diperbarui. Salinan data sebelumnya tersimpan otomatis.`);
            muatDaftar();
          }}
        />
      )}
    </>
  );
}

function TabAngkatan({ aktif, label, jumlah, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={aktif}
      onClick={onClick}
      className={cx(
        'flex-none inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-colors',
        aktif ? 'bg-[#0F766E] border-[#0F766E] text-white shadow-sm' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
      )}
    >
      {label}
      <span className={cx('text-[11px] font-bold', aktif ? 'text-[#FACC15]' : 'text-slate-500')}>{jumlah}</span>
    </button>
  );
}
