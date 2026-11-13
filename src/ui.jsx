import React, { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';

export const cx = (...kelas) => kelas.filter(Boolean).join(' ');

// ---------------------------------------------------------------- logo pondok

// Logo vektor resmi Pondok Pesantren An Nur Slawi (dari desain acuan).
export function LogoAnNur({ className = 'w-14 h-14' }) {
  // id dibuat unik supaya logo yang tampil di beberapa tempat sekaligus tidak saling bentrok.
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  const hijau = `hijau${u}`;
  const bumi = `bumi${u}`;
  const lengkungAtas = `atas${u}`;
  const lengkungPita = `pita${u}`;
  return (
  <svg className={className} viewBox="0 0 200 192" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Logo Pondok Pesantren An Nur Slawi">
    <defs>
      <linearGradient id={hijau} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00C838" />
        <stop offset="60%" stopColor="#00B140" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <radialGradient id={bumi} cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#E0F2FE" />
        <stop offset="45%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </radialGradient>
    </defs>
    <polygon points="100,6 192,73 157,184 43,184 8,73" fill="#FFFFFF" stroke="#0F172A" strokeWidth="4" strokeLinejoin="round" />
    <polygon points="100,11 187,75 154,179 46,179 13,75" fill="#047857" stroke="#0F172A" strokeWidth="2" strokeLinejoin="round" />
    <polygon points="100,11 187,75 178,78 100,20 22,78 13,75" fill="#34D399" opacity="0.65" />
    <polygon points="46,179 154,179 148,171 52,171" fill="#064E3B" opacity="0.8" />
    <polygon points="100,19 179,77 149,171 51,171 21,77" fill={`url(#${hijau})`} stroke="#059669" strokeWidth="1" />
    {/* Teks melengkung mengikuti bola dunia dan seluruhnya berada di dalam bidang hijau */}
    <path id={lengkungAtas} d="M 47,97 A 53,53 0 0 1 153,97" fill="none" />
    <text fill="#0F172A" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="9.5" letterSpacing="0.8">
      <textPath href={`#${lengkungAtas}`} startOffset="50%" textAnchor="middle">PONDOK PESANTREN</textPath>
    </text>
    <circle cx="100" cy="97" r="46" fill={`url(#${bumi})`} stroke="#0F172A" strokeWidth="3.5" />
    <g stroke="#0F172A" strokeWidth="2" fill="none" opacity="0.85">
      <ellipse cx="100" cy="97" rx="23" ry="45" />
      <line x1="100" y1="51" x2="100" y2="143" />
      <path d="M 56,82 Q 100,92 144,82" />
      <path d="M 55,99 Q 100,107 145,99" />
      <path d="M 61,118 Q 100,126 139,118" />
    </g>
    <g>
      <polygon points="102,73 123,68 142,74 142,115 123,121 102,114" fill="#0F172A" stroke="#000000" strokeWidth="1.5" />
      <polygon points="102,73 121,67 142,74 123,78" fill="#334155" />
      <polygon points="102,81 123,78 142,83 142,89 123,85 102,87" fill="#FACC15" />
      <polygon points="104,92 110,91 110,96 104,97" fill="#FACC15" />
      <polygon points="114,91 121,90 121,95 114,96" fill="#FACC15" />
      <polygon points="126,91 132,92 132,97 126,96" fill="#FACC15" />
      <polygon points="135,93 140,94 140,99 135,98" fill="#FACC15" />
    </g>
    <g>
      <path d="M 62,102 L 94,94 L 122,111 L 91,121 L 68,128 Z" fill="#FACC15" stroke="#0F172A" strokeWidth="2.2" strokeLinejoin="round" />
      <line x1="94" y1="94" x2="91" y2="121" stroke="#0F172A" strokeWidth="2.2" />
    </g>
    <g stroke="#0F172A" strokeWidth="1.8" strokeLinejoin="round">
      <polygon points="88,131 116,120 128,125 100,137" fill="#0EA5E9" />
      <polygon points="88,131 100,137 128,125 128,129 100,141 88,135" fill="#FFFFFF" />
      <polygon points="88,125 116,114 128,119 100,131" fill="#0EA5E9" />
      <polygon points="88,125 100,131 128,119 128,123 100,135 88,129" fill="#FFFFFF" />
      <polygon points="88,119 116,108 128,113 100,125" fill="#38BDF8" />
      <polygon points="88,119 100,125 128,113 128,117 100,129 88,123" fill="#FFFFFF" />
    </g>
    <path d="M 80,113 C 86,91 102,72 119,58 C 112,69 107,77 109,79 C 103,82 99,86 102,88 C 96,91 92,95 95,97 C 89,101 84,106 80,113 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" strokeLinejoin="round" />
    <g>
      <polygon points="48,130 66,139 62,155 43,144 52,138" fill="#FACC15" stroke="#0F172A" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="152,130 134,139 138,155 157,144 148,138" fill="#FACC15" stroke="#0F172A" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 60,136 Q 100,156 140,136 L 145,149 Q 100,169 55,149 Z" fill="#FDE047" stroke="#0F172A" strokeWidth="2.4" strokeLinejoin="round" />
      <path id={lengkungPita} d="M 58,142.5 Q 100,162.5 142,142.5" fill="none" />
      <text fill="#0F172A" fontFamily="Georgia, serif" fontWeight="900" fontSize="13" letterSpacing="1" dy="4.5">
        <textPath href={`#${lengkungPita}`} startOffset="50%" textAnchor="middle">AN NUR</textPath>
      </text>
    </g>
    <text x="100" y="169" fill="#0F172A" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="10.5" textAnchor="middle" letterSpacing="1.2">SLAWI</text>
  </svg>
  );
}

// ---------------------------------------------------------------- ikon

const BENTUK = {
  dashboard: (<><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></>),
  santri: (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  angkatan: (<><path d="m12 2 10 5-10 5L2 7z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" /></>),
  impor: (<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5" /><path d="M12 3v12" /></>),
  unduh: (<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></>),
  backup: (<><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" /><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3" /></>),
  pengaturan: (<><path d="M4 21v-7" /><path d="M4 10V3" /><path d="M12 21v-9" /><path d="M12 8V3" /><path d="M20 21v-5" /><path d="M20 12V3" /><path d="M1 14h6" /><path d="M9 8h6" /><path d="M17 16h6" /></>),
  kunci: (<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
  file: (<><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M8 13h2" /><path d="M14 13h2" /><path d="M8 17h2" /><path d="M14 17h2" /></>),
  plus: (<path d="M12 5v14M5 12h14" />),
  cari: (<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>),
  ubah: (<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>),
  hapus: (<><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></>),
  centang: (<path d="m5 12 5 5 9-10" />),
  tutup: (<path d="M18 6 6 18M6 6l12 12" />),
  bawah: (<path d="m6 9 6 6 6-6" />),
  menu: (<path d="M4 6h16M4 12h16M4 18h16" />),
  kiri: (<path d="m15 18-6-6 6-6" />),
  kanan: (<path d="m9 18 6-6-6-6" />),
  peringatan: (<><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>),
  urut: (<><path d="m3 16 4 4 4-4" /><path d="M7 20V4" /><path d="m21 8-4-4-4 4" /><path d="M17 4v16" /></>),
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 8h.01" /><path d="M11 12h1v4h1" /></>),
  foto: (<><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></>),
  folder: (<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />),
  topi: (<><path d="M22 10 12 5 2 10l10 5z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /><path d="M22 10v6" /></>),
  keluar: (<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>),
  aktif: (<><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>),
  disk: (<><line x1="22" x2="2" y1="12" y2="12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /><line x1="6" x2="6.01" y1="16" y2="16" /><line x1="10" x2="10.01" y1="16" y2="16" /></>),
  segar: (<><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></>)
};

export function Ikon({ nama, ukuran = 16, tebal = 2, className }) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tebal} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cx('shrink-0', className)}>
      {BENTUK[nama]}
    </svg>
  );
}

// ---------------------------------------------------------------- tombol dan isian

const VARIAN = {
  utama: { tombol: 'bg-[#0F766E] text-white border-transparent hover:bg-[#115E59] shadow-sm', ikon: 'text-white' },
  garis: { tombol: 'bg-slate-100 text-slate-700 border-transparent hover:bg-slate-200/80', ikon: 'text-slate-600' },
  hijau: { tombol: 'bg-white text-[#0F766E] border-[#0F766E] hover:bg-slate-50', ikon: 'text-[#0F766E]' },
  bahaya: { tombol: 'bg-red-700 text-white border-transparent hover:bg-red-800', ikon: 'text-white' },
  teks: { tombol: 'bg-transparent text-[#0F766E] border-transparent hover:bg-slate-100', ikon: 'text-[#0F766E]' }
};

export function Tombol({ varian = 'garis', ikon, children, className, ...sisa }) {
  const v = VARIAN[varian];
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        v.tombol,
        className
      )}
      {...sisa}
    >
      {ikon && <Ikon nama={ikon} ukuran={ikon === 'plus' ? 16 : 14} className={v.ikon} />}
      {children}
    </button>
  );
}

export const kelasInput =
  'w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-[#12352E] placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 disabled:bg-slate-50';

export function Medan({ label, htmlFor, petunjuk, className, children }) {
  return (
    <div className={cx('flex flex-col gap-1 min-w-0', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-xs font-bold text-slate-800">
          {label}
        </label>
      )}
      {children}
      {petunjuk && <p className="m-0 text-[11px] font-medium text-slate-500">{petunjuk}</p>}
    </div>
  );
}

export function Kartu({ judul, sub, aksi, className, children }) {
  return (
    <section className={cx('bg-white rounded-2xl p-6 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] border border-slate-100/80 flex flex-col gap-4', className)}>
      {(judul || aksi) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            {judul && <h2 className="m-0 text-base font-extrabold text-slate-900 tracking-tight">{judul}</h2>}
            {sub && <p className="m-0 mt-0.5 text-[11px] font-medium text-slate-400">{sub}</p>}
          </div>
          {aksi}
        </div>
      )}
      {children}
    </section>
  );
}

// Kepala halaman polos: judul di kiri, tombol aksi di kanan.
export function HeaderHalaman({ judul, sub, atas, children }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 pb-1">
      <div className="min-w-0">
        {atas}
        <h1 className="m-0 text-2xl font-extrabold text-slate-900 tracking-tight">{judul}</h1>
        {sub && <p className="m-0 mt-0.5 text-xs font-medium text-slate-500">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
    </header>
  );
}

const WARNA_BANNER = {
  galat: 'bg-red-50 border-red-300 text-red-900',
  awas: 'bg-amber-50 border-amber-300 text-amber-900',
  info: 'bg-emerald-50 border-emerald-300 text-emerald-900'
};
const IKON_BANNER = { galat: 'text-red-600', awas: 'text-amber-600', info: 'text-emerald-700' };

export function Banner({ jenis = 'info', children, className }) {
  return (
    <div role={jenis === 'galat' ? 'alert' : undefined} className={cx('flex gap-2.5 items-start rounded-xl border px-3.5 py-2.5 text-xs font-medium', WARNA_BANNER[jenis], className)}>
      <Ikon nama={jenis === 'info' ? 'info' : 'peringatan'} ukuran={16} className={cx('mt-0.5', IKON_BANNER[jenis])} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------- status dan avatar

const WARNA_STATUS = {
  Aktif: 'text-emerald-600 bg-emerald-50 border-emerald-200/70',
  Alumni: 'text-sky-600 bg-sky-50 border-sky-200/70',
  Boyong: 'text-amber-600 bg-amber-50 border-amber-200/70',
  Pindah: 'text-rose-600 bg-rose-50 border-rose-200/70'
};

export function Lencana({ status }) {
  return (
    <span className={cx('inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border', WARNA_STATUS[status] || 'bg-slate-100 text-slate-700 border-slate-200')}>
      {status}
    </span>
  );
}

export function JkPill({ jk }) {
  const putra = jk === 'Putra';
  return (
    <span className={cx('inline-flex items-center gap-1.5 text-xs font-bold', putra ? 'text-[#0F766E]' : 'text-sky-600')}>
      <span className={cx('w-2 h-2 rounded-[2px] shrink-0', putra ? 'bg-[#0F766E]' : 'bg-sky-400')} />
      {jk}
    </span>
  );
}

const LATAR_AVATAR = ['#D5EFE6', '#FEF3C7', '#E0F2FE', '#FCE7F3', '#EDE9FE'];

export function Avatar({ nama, ukuran = 36 }) {
  const kata = String(nama || '?').trim().split(/\s+/);
  const inisial = ((kata[0] || '?')[0] + (kata[1] ? kata[1][0] : '')).toUpperCase();
  const latar = LATAR_AVATAR[String(nama || '').length % LATAR_AVATAR.length];
  return (
    <div aria-hidden="true" className="rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 text-slate-800" style={{ width: ukuran, height: ukuran, background: latar }}>
      {inisial}
    </div>
  );
}

// ---------------------------------------------------------------- dialog

export function Modal({ judul, sub, ikon, onTutup, lebar = 'max-w-lg', children }) {
  const id = useId();
  useEffect(() => {
    const tekan = (e) => { if (e.key === 'Escape') onTutup(); };
    document.addEventListener('keydown', tekan);
    return () => document.removeEventListener('keydown', tekan);
  }, [onTutup]);

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={cx('bg-white rounded-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[calc(100vh-32px)] overflow-y-auto flex flex-col gap-4', lebar)}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {ikon ? (
              <div className="w-9 h-9 rounded-xl bg-[#E6F4F1] border border-[#B5E2D8] text-slate-800 flex items-center justify-center shrink-0">
                <Ikon nama={ikon} ukuran={18} />
              </div>
            ) : (
              <LogoAnNur className="w-9 h-9 shrink-0" />
            )}
            <div className="min-w-0">
              <h3 id={id} className="m-0 text-sm font-extrabold text-slate-800">{judul}</h3>
              <p className="m-0 text-[11px] text-slate-500">{sub || 'Pondok Pesantren An Nur Slawi'}</p>
            </div>
          </div>
          <button type="button" aria-label="Tutup" onClick={onTutup} className="p-1 rounded-full text-slate-400 hover:text-slate-700 shrink-0">
            <Ikon nama="tutup" ukuran={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Konfirmasi({ judul, pesan, labelYa = 'Ya', bahaya, sibuk, onYa, onBatal }) {
  return (
    <Modal judul={judul} ikon="peringatan" lebar="max-w-md" onTutup={onBatal}>
      <p className="m-0 text-xs text-slate-600 leading-relaxed">{pesan}</p>
      <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-end gap-2">
        <Tombol varian="teks" className="!text-slate-600 hover:!bg-slate-100" onClick={onBatal}>Batal</Tombol>
        <Tombol varian={bahaya ? 'bahaya' : 'utama'} onClick={onYa} disabled={sibuk}>{labelYa}</Tombol>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- toast

const KonteksToast = createContext(() => {});
export const useToast = () => useContext(KonteksToast);

export function ToastProvider({ children }) {
  const [daftar, setDaftar] = useState([]);
  const nomor = useRef(0);

  const tampil = useCallback((pesan, jenis = 'ok') => {
    const id = ++nomor.current;
    setDaftar((d) => [...d, { id, pesan, jenis }]);
    setTimeout(() => setDaftar((d) => d.filter((x) => x.id !== id)), jenis === 'galat' ? 7000 : 4500);
  }, []);

  return (
    <KonteksToast.Provider value={tampil}>
      {children}
      <div aria-live="polite" className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 max-w-[440px]">
        {daftar.map((t) => (
          <div
            key={t.id}
            role={t.jenis === 'galat' ? 'alert' : 'status'}
            className={cx(
              'px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-bold break-words',
              t.jenis === 'galat' ? 'bg-red-50 text-red-900 border-red-300' : 'bg-slate-900 text-white border-white/10'
            )}
          >
            <span className={cx('w-2 h-2 rounded-full shrink-0', t.jenis === 'galat' ? 'bg-red-600' : 'bg-emerald-400 animate-ping')} />
            <span>{t.pesan}</span>
          </div>
        ))}
      </div>
    </KonteksToast.Provider>
  );
}
