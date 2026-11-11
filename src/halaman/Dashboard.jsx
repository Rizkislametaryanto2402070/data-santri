import React, { useEffect, useState } from 'react';
import { api, hariIni, waktuIndo } from '../api.js';
import { HeaderHalaman, Ikon, JkPill, Lencana, Tombol, cx, useToast } from '../ui.jsx';

const TEMA = {
  total: { kartu: 'border-[#A7D7C5] bg-[#F9FCFB]', ikon: 'bg-[#D5EFE6] border-[#8CCBB5] text-[#164A41]', ket: 'text-slate-500' },
  aktif: { kartu: 'border-[#A7D7C5] bg-[#F9FCFB]', ikon: 'bg-[#D5EFE6] border-[#8CCBB5] text-[#047857]', ket: 'text-emerald-700' },
  alumni: { kartu: 'border-[#BAE6FD] bg-[#F8FDFF]', ikon: 'bg-[#E0F2FE] border-[#7DD3FC] text-[#0369A1]', ket: 'text-sky-700' },
  boyong: { kartu: 'border-[#FCD34D] bg-[#FFFDF7]', ikon: 'bg-[#FEF3C7] border-[#FBBF24] text-[#B45309]', ket: 'text-amber-700' }
};

function SubKartu({ tema, judul, nilai, ket, ikon }) {
  const t = TEMA[tema];
  return (
    <div className={cx('rounded-2xl border-2 px-4 py-4 flex items-center gap-4 hover:shadow-md transition-all', t.kartu)}>
      <div className={cx('w-12 h-12 rounded-xl border flex items-center justify-center shrink-0', t.ikon)}>
        <Ikon nama={ikon} ukuran={24} />
      </div>
      <div>
        <div className="text-2xl font-extrabold text-[#164A41] tabular-nums leading-tight">{nilai}</div>
        <div className="text-xs font-bold text-slate-600">{judul}</div>
        <div className={cx('text-[10px] font-semibold', t.ket)}>{ket}</div>
      </div>
    </div>
  );
}

// Diagram lingkaran Putra/Putri: sudut irisan dihitung dari jumlah santri sebenarnya.
function PieJk({ putra, putri, pctPutra, pctPutri }) {
  const jumlah = putra + putri;
  if (jumlah === 0) {
    return (
      <div className="w-32 h-32 rounded-full border-[14px] border-slate-200 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-slate-700">0</span>
        <span className="text-[10px] font-semibold text-slate-400">santri</span>
      </div>
    );
  }

  const PUSAT = 60;
  const R = 50;
  const titik = (derajat, jari = R) => {
    const rad = ((derajat - 90) * Math.PI) / 180;
    return [PUSAT + jari * Math.cos(rad), PUSAT + jari * Math.sin(rad)];
  };
  const irisan = (awal, akhir) => {
    const [x0, y0] = titik(awal);
    const [x1, y1] = titik(akhir);
    return `M ${PUSAT} ${PUSAT} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 ${akhir - awal > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
  };

  const sudutPutra = (putra / jumlah) * 360;
  const tengahPutra = sudutPutra / 2;
  const tengahPutri = (sudutPutra + 360) / 2;
  const geser = (derajat, jarak) => {
    const rad = (derajat * Math.PI) / 180;
    return `translate(${(Math.sin(rad) * jarak).toFixed(2)} ${(-Math.cos(rad) * jarak).toFixed(2)})`;
  };
  const [xPutra, yPutra] = titik(tengahPutra, R * 0.62);
  const [xPutri, yPutri] = titik(tengahPutri, R * 0.62);

  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" role="img" aria-label={`Diagram lingkaran: ${putra} santri putra (${pctPutra}%) dan ${putri} santri putri (${pctPutri}%)`}>
      {putri === 0 ? (
        <circle cx={PUSAT} cy={PUSAT} r={R} fill="#255F53" />
      ) : putra === 0 ? (
        <circle cx={PUSAT} cy={PUSAT} r={R} fill="#9EC5B8" />
      ) : (
        <>
          <path d={irisan(0, sudutPutra)} fill="#255F53" />
          <path d={irisan(sudutPutra, 360)} fill="#9EC5B8" transform={geser(tengahPutri, 4)} />
        </>
      )}
      {putra > 0 && (
        <text x={xPutra} y={yPutra + 4} fill="#FFFFFF" fontSize="13" fontWeight="800" textAnchor="middle">{pctPutra}%</text>
      )}
      {putri > 0 && (
        <text x={xPutri} y={yPutri + 4} fill="#164A41" fontSize="12" fontWeight="800" textAnchor="middle" transform={putra > 0 ? geser(tengahPutri, 4) : undefined}>{pctPutri}%</text>
      )}
    </svg>
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
  const maks = Math.max(1, ...d.perAngkatan.map((a) => a.jumlah));
  const backup = waktuIndo(d.backupTerakhir);
  const batang = [...d.perAngkatan].reverse(); // angkatan terbaru di atas

  return (
    <>
      <HeaderHalaman judul="Dashboard" sub={`Ringkasan data santri per ${hariIni()}`}>
        <Tombol ikon="file" onClick={() => pergi('santri', { bukaExport: true })}>Export Excel</Tombol>
        <Tombol varian="utama" ikon="plus" onClick={() => pergi('form')}>Tambah Santri</Tombol>
      </HeaderHalaman>

      {/* BARIS 1: kartu putih lebar berisi 4 sub-kartu */}
      <section aria-label="Ringkasan jumlah santri" className="bg-white rounded-2xl p-5 shadow-sm border border-[#164A41]/10">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="m-0 text-base font-extrabold text-[#164A41]">Ringkasan Data Santri</h2>
          {d.total === 0 && (
            <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1 rounded-full font-semibold">
              <Ikon nama="info" ukuran={14} className="text-amber-600" />
              <span>
                Belum ada data santri. Mulai di menu <strong>Angkatan &amp; Kelas</strong>, lalu klik <strong>Tambah Santri</strong>, atau pakai <strong>Import Excel</strong>.
              </span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <SubKartu tema="total" ikon="santri" judul="Total Santri" nilai={d.total} ket="Terdaftar di database" />
          <SubKartu tema="aktif" ikon="aktif" judul="Santri Aktif" nilai={d.perStatus.Aktif} ket={`${persen(d.perStatus.Aktif)}% dari total`} />
          <SubKartu tema="alumni" ikon="topi" judul="Alumni" nilai={d.perStatus.Alumni} ket={`${persen(d.perStatus.Alumni)}% dari total`} />
          <SubKartu tema="boyong" ikon="keluar" judul="Boyong / Pindah" nilai={d.perStatus.Boyong + d.perStatus.Pindah} ket={`${persen(d.perStatus.Boyong + d.perStatus.Pindah)}% dari total`} />
        </div>
      </section>

      {/* BARIS 2 & 3: grid asimetris 12 kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Kartu sempit: Cadangan Data */}
            <section className="md:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-[#164A41]/10 flex flex-col justify-between">
              <h3 className="m-0 text-sm font-extrabold text-[#164A41]">Cadangan Data</h3>

              <div className="my-4">
                <div
                  className={cx(
                    'w-14 h-12 rounded-xl flex items-center justify-center border mb-3',
                    backup ? 'bg-[#D5EFE6] border-[#164A41]/30 text-[#164A41]' : 'bg-[#FEF3C7] border-amber-400 text-amber-800'
                  )}
                >
                  <Ikon nama={backup ? 'disk' : 'peringatan'} ukuran={24} />
                </div>
                <div className="text-xl font-extrabold text-[#164A41] tracking-tight">{backup ? 'Backup Aman' : 'Belum Backup'}</div>
                <p className="m-0 text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                  {backup || 'Buat backup berkala dan simpan di flashdisk.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => pergi('backup')}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-[#164A41] hover:bg-[#0F362F] text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Ikon nama="unduh" ukuran={14} className="text-[#FACC15]" />
                <span>Buka Backup &amp; Restore</span>
              </button>
              <p className="m-0 mt-3 text-[10px] text-slate-500 font-medium leading-snug">
                File backup berisi data pribadi santri. Simpan di tempat yang aman.
              </p>
            </section>

            {/* Kartu pie: Komposisi Putra & Putri */}
            <section className="md:col-span-8 bg-white rounded-2xl p-5 shadow-sm border border-[#164A41]/10 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="m-0 text-sm font-extrabold text-[#164A41]">Komposisi Putra &amp; Putri</h3>
                <span className="text-[11px] font-bold text-slate-500">Total: {d.total} Santri</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-auto py-1">
                <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                  <PieJk putra={putra} putri={putri} pctPutra={persen(putra)} pctPutri={persen(putri)} />
                </div>
                <div className="space-y-3 w-full sm:w-auto">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-[#255F53] border border-[#164A41]/20 shrink-0" />
                    <div>
                      <div className="text-xs font-extrabold text-[#164A41]">Santri Putra ({putra})</div>
                      <div className="text-[11px] font-medium text-slate-500">{persen(putra)}% dari total</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-[#9EC5B8] border border-[#164A41]/20 shrink-0" />
                    <div>
                      <div className="text-xs font-extrabold text-[#164A41]">Santri Putri ({putri})</div>
                      <div className="text-[11px] font-medium text-slate-500">{persen(putri)}% dari total</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Kartu lebar: Terakhir Ditambahkan */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#164A41]/10 flex-1 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="m-0 text-sm font-extrabold text-[#164A41]">Santri Terakhir Ditambahkan</h3>
                <p className="m-0 text-[11px] text-slate-500 font-medium">5 santri terbaru yang masuk ke database</p>
              </div>
              <Tombol varian="teks" className="!px-3 !py-1" onClick={() => pergi('santri')}>Lihat semua</Tombol>
            </div>

            {d.terbaru.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">Belum ada santri yang ditambahkan.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500">
                      <th scope="col" className="py-2 px-3">No. Induk</th>
                      <th scope="col" className="py-2 px-3">Nama Lengkap</th>
                      <th scope="col" className="py-2 px-3">Kategori</th>
                      <th scope="col" className="py-2 px-3">Angkatan &amp; Kelas</th>
                      <th scope="col" className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {d.terbaru.map((s) => (
                      <tr key={s.id} className="hover:bg-[#F4F9F7]">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-600 tabular-nums">{s.nis}</td>
                        <td className="py-2.5 px-3 font-bold text-[#164A41]">{s.nama}</td>
                        <td className="py-2.5 px-3"><JkPill jk={s.jenis_kelamin} /></td>
                        <td className="py-2.5 px-3 text-slate-600 font-medium">
                          Angkatan {s.angkatan}{s.kelas ? ' · ' + s.kelas : ''}
                        </td>
                        <td className="py-2.5 px-3 text-right"><Lencana status={s.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Kolom kanan tinggi: Santri per Angkatan */}
        <section className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-[#164A41]/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="m-0 text-sm font-extrabold text-[#164A41]">Santri per Angkatan</h3>
              <span className="text-[11px] font-bold text-slate-500 tabular-nums">{d.perAngkatan.length} angkatan</span>
            </div>
            <p className="m-0 text-[11px] text-slate-500 font-medium mb-4">Jumlah santri di tiap angkatan (semua status)</p>

            {batang.length > 0 ? (
              <div className="space-y-3.5 py-1" role="img" aria-label={'Jumlah santri per angkatan: ' + batang.map((a) => `${a.nama} ${a.jumlah}`).join(', ')}>
                {batang.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 group">
                    <span className="w-24 text-xs font-bold text-slate-600 group-hover:text-[#164A41] truncate shrink-0">Angkatan {a.nama}</span>
                    <div className="flex-1 flex items-center gap-2.5">
                      <div className="h-3.5 rounded-full bg-[#3B7167] group-hover:bg-[#164A41] transition-all duration-300" style={{ width: `${Math.max(12, Math.round((a.jumlah / maks) * 100))}%` }} />
                      <span className="text-xs font-extrabold text-[#164A41] tabular-nums">{a.jumlah}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                <Ikon nama="angkatan" ukuran={32} className="text-slate-400 mx-auto mb-2" />
                <p className="m-0 text-xs font-bold text-slate-700">Belum ada angkatan.</p>
                <p className="m-0 text-[11px] text-slate-500 mt-0.5 px-4">Tambahkan angkatan di menu Angkatan &amp; Kelas untuk melihat grafik.</p>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end text-xs">
            <button type="button" onClick={() => pergi('master')} className="font-extrabold text-[#164A41] hover:underline inline-flex items-center gap-1">
              <span>Kelola Angkatan</span>
              <Ikon nama="kanan" ukuran={14} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
