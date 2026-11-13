import React, { useEffect, useState } from 'react';
import { api, hariIni, waktuIndo } from '../api.js';
import { Ikon, JkPill, Lencana, cx, useToast } from '../ui.jsx';

const KARTU = 'bg-white rounded-2xl shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] border border-slate-100/80';

const TEMA_KARTU = {
  total: { badgeBg: 'bg-[#E6F4F1] text-[#0F766E] border-[#B5E2D8]' },
  aktif: { badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  alumni: { badgeBg: 'bg-sky-50 text-sky-600 border-sky-200' },
  boyong: { badgeBg: 'bg-amber-50 text-amber-600 border-amber-200' }
};

// Kartu metrik: judul + keterangan di kiri, kotak ikon di kanan, angka besar di bawah.
function KartuStat({ tema, judul, nilai, ket, ikon, onClick }) {
  const t = TEMA_KARTU[tema];
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      className={cx(KARTU, 'p-5 hover:shadow-md hover:border-[#0F766E]/25 transition-all flex flex-col justify-between', onClick && 'cursor-pointer')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-slate-800 tracking-tight truncate">{judul}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <span className="truncate">{ket}</span>
            <svg viewBox="0 0 16 16" className="w-3 h-3 text-slate-300 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <rect x="5" y="5" width="8" height="8" rx="1.5" />
              <path d="M3 11V4a1 1 0 0 1 1-1h7" />
            </svg>
          </div>
        </div>
        <div className={cx('w-9 h-9 rounded-xl border flex items-center justify-center shrink-0', t.badgeBg)}>
          <Ikon nama={ikon} ukuran={18} />
        </div>
      </div>

      <div className="mt-6 flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-slate-900 tabular-nums tracking-tight">{nilai}</span>
          <span className="text-xs font-semibold text-slate-400">santri</span>
        </div>
        <span className="text-slate-300" aria-hidden="true">
          <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current">
            <circle cx="8" cy="3" r="1.2" />
            <circle cx="8" cy="8" r="1.2" />
            <circle cx="8" cy="13" r="1.2" />
          </svg>
        </span>
      </div>
    </div>
  );
}

// Diagram donat komposisi Putra/Putri; panjang tiap busur dihitung dari jumlah santri sebenarnya (total busur = total santri).
function DonutKomposisi({ segmen, total }) {
  const PUSAT = 75;
  const R = 56;
  const KELILING = 2 * Math.PI * R;
  const aktifSegmen = segmen.filter((s) => s.nilai > 0);
  const totalSegmen = aktifSegmen.reduce((acc, s) => acc + s.nilai, 0);

  if (total === 0 || totalSegmen === 0) {
    return (
      <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 150 150" className="w-full h-full -rotate-90" aria-hidden="true">
          <circle cx={PUSAT} cy={PUSAT} r={R - 11} fill="#E6F4F1" />
          <circle cx={PUSAT} cy={PUSAT} r={R} fill="none" stroke="#E2E8F0" strokeWidth="9" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
          <span className="text-[10px] font-bold text-[#0F766E]">Total Santri</span>
          <span className="text-2xl font-extrabold text-slate-900 tabular-nums mt-0.5">0</span>
        </div>
      </div>
    );
  }

  const celah = aktifSegmen.length > 1 ? 7 : 0;
  let akumulasi = 0;

  return (
    <div className="relative w-40 h-40 flex items-center justify-center shrink-0" role="img" aria-label={`Diagram komposisi santri dengan total ${total} santri`}>
      <svg viewBox="0 0 150 150" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx={PUSAT} cy={PUSAT} r={R - 11} fill="#E6F4F1" />
        <circle cx={PUSAT} cy={PUSAT} r={R} fill="none" stroke="#F1F5F9" strokeWidth="9" />
        {aktifSegmen.map((s) => {
          const porsi = s.nilai / totalSegmen;
          const panjang = Math.max(2, porsi * KELILING - celah);
          const offset = -(akumulasi * KELILING);
          akumulasi += porsi;
          return (
            <circle
              key={s.label}
              cx={PUSAT}
              cy={PUSAT}
              r={R}
              fill="none"
              stroke={s.warna}
              strokeWidth="9"
              strokeDasharray={`${panjang} ${KELILING}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
        <span className="text-[10px] font-bold text-[#0F766E] tracking-wide">Total Santri</span>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{total}</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ pergi }) {
  const toast = useToast();
  const [d, setD] = useState(null);

  useEffect(() => {
    api('dashboard:statistik').then(setD).catch((e) => toast(e.message, 'galat'));
  }, [toast]);

  if (!d) return null;

  const persen = (n) => (d.total ? Math.round((n / d.total) * 100) : 0);
  const putra = d.perJenis.Putra;
  const putri = d.perJenis.Putri;
  const boyongPindah = d.perStatus.Boyong + d.perStatus.Pindah;
  const maks = Math.max(1, ...d.perAngkatan.map((a) => a.jumlah));
  const backup = waktuIndo(d.backupTerakhir);
  const hariBackup = d.backupTerakhir ? Math.floor((Date.now() - new Date(d.backupTerakhir).getTime()) / 86400000) : null;
  const backupLama = backup && hariBackup !== null && hariBackup > 30;
  const batang = [...d.perAngkatan].reverse(); // angkatan terbaru di atas

  const segmenDonut = [
    { label: 'Santri Putra', nilai: putra, teks: `${putra} (${persen(putra)}%)`, warna: '#0F766E' },
    { label: 'Santri Putri', nilai: putri, teks: `${putri} (${persen(putri)}%)`, warna: '#38BDF8' }
  ];

  return (
    <>
      {/* BARIS 1: ringkasan utama (kiri) + kartu hijau cadangan data (kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section aria-label="Ringkasan utama data santri" className={cx(KARTU, 'lg:col-span-7 p-6 sm:p-7 flex flex-col justify-between')}>
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-3">
              <span>Ringkasan Data Santri</span>
              <span>Total Terdaftar</span>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <h1 className="m-0 text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Database Santri PP. An Nur</h1>
                <div className="mt-1.5 flex items-center gap-2 text-xs font-mono font-semibold text-slate-400">
                  <span>Per {hariIni()}</span>
                  <button
                    type="button"
                    onClick={() => pergi('santri')}
                    title="Buka Data Santri"
                    aria-label="Buka Data Santri"
                    className="text-[#0F766E] hover:translate-x-0.5 transition-transform inline-flex items-center cursor-pointer"
                  >
                    <Ikon nama="kanan" ukuran={14} />
                  </button>
                </div>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tabular-nums tracking-tight">{d.total}</span>
                <span className="text-lg font-medium text-slate-400">Santri</span>
              </div>
            </div>

            {d.total === 0 && (
              <div className="mt-4 flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-2 rounded-xl font-semibold">
                <Ikon nama="info" ukuran={15} className="text-amber-600 shrink-0" />
                <span>
                  Belum ada data santri. Mulai di menu <strong>Angkatan &amp; Kelas</strong>, lalu klik <strong>Tambah Santri</strong>, atau pakai <strong>Import Excel</strong>.
                </span>
              </div>
            )}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => pergi('form')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0F766E] hover:bg-[#115E59] text-white transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <Ikon nama="plus" ukuran={14} />
              <span>Tambah Santri</span>
            </button>
            <button
              type="button"
              onClick={() => pergi('santri', { bukaExport: true })}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Ikon nama="file" ukuran={14} />
              <span>Export Excel</span>
            </button>
          </div>
        </section>

        <section
          aria-label="Cadangan Data"
          className="lg:col-span-5 relative overflow-hidden rounded-2xl p-6 sm:p-7 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] bg-gradient-to-br from-[#0D7A68] via-[#0B6B5B] to-[#085549] text-white flex flex-col justify-between"
        >
          <svg viewBox="0 0 400 220" className="absolute inset-0 w-full h-full opacity-12 pointer-events-none" fill="none" aria-hidden="true">
            <circle cx="330" cy="40" r="70" stroke="white" strokeWidth="1.5" />
            <circle cx="330" cy="40" r="105" stroke="white" strokeWidth="1.2" />
            <circle cx="330" cy="40" r="145" stroke="white" strokeWidth="1" />
            <circle cx="330" cy="40" r="185" stroke="white" strokeWidth="1" />
          </svg>

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="max-w-[65%]">
              <h2 className="m-0 text-base font-extrabold tracking-tight text-white">{!backup ? 'Belum Backup Data' : backupLama ? 'Backup Sudah Lama' : 'Cadangan Data Aman'}</h2>
              <p className="m-0 mt-2 text-[11px] text-emerald-50/90 leading-relaxed font-medium">
                {!backup
                  ? 'Buat backup berkala dan simpan di flashdisk. File backup berisi data pribadi santri.'
                  : backupLama
                    ? `Terakhir dicadangkan ${hariBackup} hari lalu (${backup}). Buat backup baru agar data tetap aman bila laptop bermasalah.`
                    : `Terakhir dicadangkan ${backup}. File backup berisi data pribadi santri, simpan di tempat aman.`}
              </p>
            </div>
            <div className="flex items-center gap-1.5 pt-1" aria-hidden="true">
              <span className="w-2 h-2 rounded-[2px] bg-white/35" />
              <span className="w-2.5 h-2.5 rounded-[2px] bg-white" />
              <span className="w-2 h-2 rounded-[2px] bg-white/35" />
            </div>
          </div>

          <div className="relative z-10 mt-5 flex items-end justify-between gap-4">
            <button
              type="button"
              onClick={() => pergi('backup')}
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-white text-slate-900 hover:bg-emerald-50 transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <Ikon nama="unduh" ukuran={14} className="text-[#0D7A68]" />
              <span>Buka Backup &amp; Restore</span>
            </button>

            <div className="w-24 h-20 -mb-1 mr-1 shrink-0 select-none pointer-events-none" aria-hidden="true">
              <svg viewBox="0 0 110 96" className="w-full h-full drop-shadow-md">
                <g transform="rotate(4 55 48)">
                  <rect x="14" y="18" width="80" height="68" rx="10" fill="#F8FAFC" />
                  <path d="M14 28 C14 22.5 18.5 18 24 18 H84 C89.5 18 94 22.5 94 28 V34 H14 V28 Z" fill="#E2E8F0" />
                  <line x1="26" y1="46" x2="82" y2="46" stroke="#E2E8F0" strokeWidth="1.5" />
                  <line x1="26" y1="58" x2="82" y2="58" stroke="#E2E8F0" strokeWidth="1.5" />
                  <line x1="26" y1="70" x2="82" y2="70" stroke="#E2E8F0" strokeWidth="1.5" />
                  <line x1="44" y1="38" x2="44" y2="78" stroke="#E2E8F0" strokeWidth="1.5" />
                  <line x1="64" y1="38" x2="64" y2="78" stroke="#E2E8F0" strokeWidth="1.5" />
                  <path d="M34 12 C34 8 42 8 42 15 V23 C42 26 36 26 36 23 Z" fill="#FF6B5B" />
                  <path d="M66 12 C66 8 74 8 74 15 V23 C74 26 68 26 68 23 Z" fill="#FF6B5B" />
                  <circle cx="38" cy="23" r="3" fill="#085549" />
                  <circle cx="70" cy="23" r="3" fill="#085549" />
                  <path d="M66 56 A 14 14 0 1 1 56 43" fill="none" stroke="#0D7A68" strokeWidth="3" strokeLinecap="round" />
                  <polyline points="61 52 66 57 70 51" fill="none" stroke="#0D7A68" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            </div>
          </div>
        </section>
      </div>

      {/* BARIS 2: empat kartu metrik */}
      <section aria-label="Ringkasan jumlah santri" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KartuStat tema="total" ikon="santri" judul="Total Santri" nilai={d.total} ket="Terdaftar di database" onClick={() => pergi('santri')} />
        <KartuStat tema="aktif" ikon="aktif" judul="Santri Aktif" nilai={d.perStatus.Aktif} ket={`${persen(d.perStatus.Aktif)}% dari total`} onClick={() => pergi('santri')} />
        <KartuStat tema="alumni" ikon="topi" judul="Alumni" nilai={d.perStatus.Alumni} ket={`${persen(d.perStatus.Alumni)}% dari total`} onClick={() => pergi('santri')} />
        <KartuStat tema="boyong" ikon="keluar" judul="Boyong / Pindah" nilai={boyongPindah} ket={`${persen(boyongPindah)}% dari total`} onClick={() => pergi('santri')} />
      </section>

      {/* BARIS 3: santri terakhir ditambahkan (kiri) + komposisi dan angkatan (kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className={cx(KARTU, 'lg:col-span-7 p-6 sm:p-7 flex flex-col justify-between')}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-5">
              <div>
                <h3 className="m-0 text-base font-extrabold text-slate-900 tracking-tight">Santri Terakhir Ditambahkan</h3>
                <p className="m-0 text-[11px] text-slate-400 font-medium mt-0.5">5 santri terbaru yang masuk ke database</p>
              </div>
              <button
                type="button"
                onClick={() => pergi('santri')}
                aria-label="Lihat semua santri"
                className="w-8 h-8 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white flex items-center justify-center transition-colors shadow-sm shrink-0 cursor-pointer"
              >
                <Ikon nama="kanan" ukuran={15} />
              </button>
            </div>

            {d.terbaru.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <p className="m-0 text-xs font-bold text-slate-600">Belum ada santri yang ditambahkan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th scope="col" className="py-2.5 pr-3">No. Induk</th>
                      <th scope="col" className="py-2.5 px-3">Nama Lengkap</th>
                      <th scope="col" className="py-2.5 px-3">Angkatan &amp; Kelas</th>
                      <th scope="col" className="py-2.5 px-3">Kategori</th>
                      <th scope="col" className="py-2.5 pl-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {d.terbaru.map((s) => (
                      <tr key={s.id} onClick={() => pergi('santri')} className="hover:bg-slate-50/90 transition-colors cursor-pointer group">
                        <td className="py-3.5 pr-3 font-mono font-extrabold text-slate-900 tabular-nums whitespace-nowrap">{s.nis}</td>
                        <td className="py-3.5 px-3 font-bold text-slate-700 group-hover:text-[#0F766E]">{s.nama}</td>
                        <td className="py-3.5 px-3 text-slate-400 font-semibold whitespace-nowrap">
                          Angkatan {s.angkatan}{s.kelas ? ' · ' + s.kelas : ''}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap"><JkPill jk={s.jenis_kelamin} /></td>
                        <td className="py-3.5 pl-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <Lencana status={s.status} />
                            <Ikon nama="bawah" ukuran={13} className="text-slate-300 group-hover:text-slate-500" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-center">
            <button
              type="button"
              onClick={() => pergi('santri')}
              className="text-xs font-extrabold text-slate-800 hover:text-[#0F766E] inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Lihat semua</span>
              <Ikon nama="kanan" ukuran={14} className="text-[#0F766E]" />
            </button>
          </div>
        </section>

        <section className={cx(KARTU, 'lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between')}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-5">
              <div>
                <h3 className="m-0 text-base font-extrabold text-slate-900 tracking-tight">Komposisi &amp; Angkatan</h3>
                <p className="m-0 text-[11px] text-slate-400 font-medium mt-0.5">Proporsi putra/putri dan jumlah di tiap angkatan</p>
              </div>
              <button
                type="button"
                onClick={() => pergi('master')}
                aria-label="Kelola Angkatan"
                className="w-8 h-8 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white flex items-center justify-center transition-colors shadow-sm shrink-0 cursor-pointer"
              >
                <Ikon nama="kanan" ukuran={15} />
              </button>
            </div>

            <div className="mt-1 mb-5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <DonutKomposisi segmen={segmenDonut} total={d.total} />
              <div className="space-y-2.5 flex-1 w-full">
                {segmenDonut.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-[2px] shrink-0" style={{ backgroundColor: item.warna }} />
                      <span className="font-bold text-slate-700">{item.label}</span>
                    </div>
                    <span className="font-extrabold text-slate-900 tabular-nums">{item.teks}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 mb-3">
                <span>Santri per Angkatan</span>
                <span className="text-[11px] font-bold text-slate-400 tabular-nums">{d.perAngkatan.length} angkatan</span>
              </div>

              {batang.length > 0 ? (
                <div className="space-y-2.5 max-h-32 overflow-y-auto pr-1" role="img" aria-label={'Jumlah santri per angkatan: ' + batang.map((a) => `${a.nama} ${a.jumlah}`).join(', ')}>
                  {batang.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 group">
                      <span className="w-24 text-xs font-bold text-slate-600 group-hover:text-[#0F766E] truncate shrink-0">Angkatan {a.nama}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-[#0F766E] group-hover:bg-[#115E59] transition-all duration-300" style={{ width: `${Math.max(10, Math.round((a.jumlah / maks) * 100))}%` }} />
                      </div>
                      <span className="w-7 text-right text-xs font-extrabold text-slate-800 tabular-nums">{a.jumlah}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="m-0 text-xs font-bold text-slate-600">Belum ada angkatan.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end text-xs">
            <button
              type="button"
              onClick={() => pergi('master')}
              className="font-extrabold text-slate-800 hover:text-[#0F766E] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Kelola Angkatan</span>
              <Ikon nama="kanan" ukuran={14} className="text-[#0F766E]" />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
