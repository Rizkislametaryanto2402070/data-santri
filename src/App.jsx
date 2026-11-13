import React, { useEffect, useState } from 'react';
import { api } from './api.js';
import { Ikon, LogoAnNur, cx, useToast } from './ui.jsx';
import Kunci from './halaman/Kunci.jsx';
import Dashboard from './halaman/Dashboard.jsx';
import DaftarSantri from './halaman/DaftarSantri.jsx';
import FormSantri from './halaman/FormSantri.jsx';
import Master from './halaman/Master.jsx';
import Impor from './halaman/Impor.jsx';
import Backup from './halaman/Backup.jsx';
import Pengaturan from './halaman/Pengaturan.jsx';

const MENU = [
  { id: 'dashboard', label: 'Dashboard', ikon: 'dashboard' },
  { id: 'santri', label: 'Data Santri', ikon: 'santri' },
  { id: 'master', label: 'Angkatan & Kelas', ikon: 'angkatan' },
  { id: 'impor', label: 'Import Excel', ikon: 'impor' },
  { id: 'backup', label: 'Backup & Restore', ikon: 'backup' },
  { id: 'pengaturan', label: 'Pengaturan', ikon: 'pengaturan' }
];

// Di bawah lebar ini (piksel) tampilan otomatis memakai navbar di atas.
const LEBAR_SEMPIT = 1200;
const KUNCI_PILIHAN = 'santri.sidebar';

// Pilihan tampilan (sidebar/navbar) hanya preferensi tampilan; gagal baca/tulis tidak masalah.
function bacaPilihanSidebar() {
  try {
    return localStorage.getItem(KUNCI_PILIHAN) !== 'tutup';
  } catch {
    return true;
  }
}

function simpanPilihanSidebar(buka) {
  try {
    localStorage.setItem(KUNCI_PILIHAN, buka ? 'buka' : 'tutup');
  } catch {
    /* abaikan */
  }
}

// ---------------------------------------------------------------- mode sidebar

function Sidebar({ aktif, pergi, onKunci, onTutup, bisaTutup, versi }) {
  return (
    <aside className="w-[240px] shrink-0 sticky top-3 lg:top-4 h-[calc(100vh-1.5rem)] lg:h-[calc(100vh-2rem)] rounded-[28px] bg-gradient-to-b from-[#0D7A68] via-[#0B6B5B] to-[#085549] text-white flex flex-col justify-between py-6 px-4 overflow-y-auto shadow-[0_2px_12px_-4px_rgba(15,23,42,0.18)] select-none">
      {bisaTutup && (
        <button
          type="button"
          onClick={onTutup}
          title="Tutup sidebar (pakai navbar di atas)"
          aria-label="Tutup sidebar"
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-50 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Ikon nama="kiri" ukuran={16} />
        </button>
      )}

      <div>
        <div className="flex flex-col items-center text-center px-2 pb-5 border-b border-white/10">
          <div className="w-24 h-24 rounded-full p-1.5 border-2 border-emerald-100/40 bg-white/10 shadow-lg flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-inner">
              <LogoAnNur className="w-[72px] h-[72px]" />
            </div>
          </div>
          <div className="mt-3.5 text-base font-extrabold tracking-tight text-white">PP. An Nur Slawi</div>
          <p className="m-0 text-[11px] text-emerald-50/85 font-medium mt-0.5">Sistem Informasi Data Santri</p>
        </div>

        <nav aria-label="Menu utama" className="mt-5 space-y-1.5 px-1">
          {MENU.map((m) => {
            const aktifMenu = aktif === m.id;
            return (
              <button
                key={m.id}
                type="button"
                aria-current={aktifMenu ? 'page' : undefined}
                onClick={() => pergi(m.id)}
                className={cx(
                  'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs text-left transition-all duration-150 cursor-pointer',
                  aktifMenu ? 'bg-white text-[#0F766E] font-extrabold shadow-md' : 'text-emerald-50/85 hover:bg-white/10 hover:text-white font-semibold'
                )}
              >
                <Ikon nama={m.ikon} tebal={aktifMenu ? 2.4 : 2} className={aktifMenu ? 'text-[#0F766E]' : 'text-emerald-100/80'} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-white/10 px-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onKunci}
          className="flex items-center gap-2.5 text-xs font-bold text-emerald-50/90 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Ikon nama="kunci" className="text-amber-300" />
          <span>Kunci Aplikasi</span>
        </button>
        <span className="text-[10px] font-semibold text-emerald-100/60">v{versi || '1.0.0'}</span>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------- mode navbar

function Navbar({ aktif, pergi, onKunci, onBuka, bisaBuka, versi }) {
  return (
    <nav aria-label="Menu utama" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pb-2 select-none">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:gap-x-8">
        <div className="flex items-center gap-3">
          {bisaBuka && (
            <button
              type="button"
              onClick={onBuka}
              title="Tampilkan sidebar"
              aria-label="Tampilkan sidebar"
              className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white/70 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Ikon nama="menu" ukuran={18} />
            </button>
          )}
          <button type="button" onClick={() => pergi('dashboard')} title={versi ? `Versi ${versi}` : undefined} className="flex items-center gap-2.5 text-left cursor-pointer">
            <LogoAnNur className="w-11 h-11 shrink-0 drop-shadow-sm" />
            <div>
              <div className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">PP. An Nur Slawi</div>
              <div className="text-[10px] font-semibold text-slate-400 mt-1">Sistem Informasi Santri</div>
            </div>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          {MENU.map((m) => {
            const isAktif = aktif === m.id;
            return (
              <button
                key={m.id}
                type="button"
                aria-current={isAktif ? 'page' : undefined}
                onClick={() => pergi(m.id)}
                className={cx(
                  'px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer relative',
                  isAktif ? 'font-extrabold text-slate-900 bg-white/80 shadow-sm' : 'font-semibold text-slate-500 hover:text-slate-800 hover:bg-white/40'
                )}
              >
                {m.label}
                {isAktif && <span className="absolute -bottom-1 left-3 right-3 h-0.5 rounded-full bg-[#0F766E]" />}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onKunci}
        title="Kunci Aplikasi"
        className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
      >
        <Ikon nama="kunci" ukuran={16} />
        <span>Kunci Aplikasi</span>
      </button>
    </nav>
  );
}

// ---------------------------------------------------------------- aplikasi

export default function App() {
  const toast = useToast();
  const [status, setStatus] = useState('memuat'); // memuat | terkunci | buka | galat
  const [pesanGalat, setPesanGalat] = useState('');
  const [adaPassword, setAdaPassword] = useState(false);
  const [info, setInfo] = useState(null);
  const [nav, setNav] = useState({ halaman: 'dashboard', param: null });
  const [sidebarBuka, setSidebarBuka] = useState(bacaPilihanSidebar);
  const [sempit, setSempit] = useState(() => window.innerWidth < LEBAR_SEMPIT);

  useEffect(() => {
    api('auth:status')
      .then((r) => {
        setAdaPassword(r.ada);
        setStatus(r.ada ? 'terkunci' : 'buka');
      })
      .catch((e) => {
        setPesanGalat(e.message);
        setStatus('galat');
      });
    api('app:info').then(setInfo).catch(() => {});
  }, []);

  useEffect(() => {
    const ubah = () => setSempit(window.innerWidth < LEBAR_SEMPIT);
    window.addEventListener('resize', ubah);
    return () => window.removeEventListener('resize', ubah);
  }, []);

  const pergi = (halaman, param = null) => setNav({ halaman, param });

  function aturSidebar(buka) {
    setSidebarBuka(buka);
    simpanPilihanSidebar(buka);
  }

  function kunciSekarang() {
    if (!adaPassword) {
      toast('Belum ada password. Atur dulu di menu Pengaturan.', 'galat');
      pergi('pengaturan');
      return;
    }
    setStatus('terkunci');
  }

  if (status === 'memuat') return null;
  if (status === 'galat') {
    return (
      <div className="min-h-screen bg-[#ECEFF3] flex items-center justify-center p-8">
        <div role="alert" className="max-w-md bg-white border border-slate-100/80 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] rounded-2xl p-8">
          <h1 className="m-0 mb-2 text-base font-extrabold text-slate-900">Aplikasi tidak bisa dimulai</h1>
          <p className="m-0 text-xs text-slate-600">{pesanGalat}</p>
        </div>
      </div>
    );
  }
  if (status === 'terkunci') return <Kunci onBuka={() => { setNav({ halaman: 'dashboard', param: null }); setStatus('buka'); }} />;

  const aktif = nav.halaman === 'form' ? 'santri' : nav.halaman;
  const kunciHalaman = nav.halaman + JSON.stringify(nav.param);
  const props = { pergi, param: nav.param };
  const versi = info ? info.versi : null;
  // Sidebar tampil bila dipilih dan jendela cukup lebar; jendela sempit selalu memakai navbar.
  const pakaiSidebar = sidebarBuka && !sempit;

  const isi = (
    <main className="flex flex-col gap-6">
      {nav.halaman === 'dashboard' && <Dashboard key={kunciHalaman} {...props} />}
      {nav.halaman === 'santri' && <DaftarSantri key={kunciHalaman} {...props} />}
      {nav.halaman === 'form' && <FormSantri key={kunciHalaman} {...props} />}
      {nav.halaman === 'master' && <Master key={kunciHalaman} {...props} />}
      {nav.halaman === 'impor' && <Impor key={kunciHalaman} {...props} />}
      {nav.halaman === 'backup' && <Backup key={kunciHalaman} {...props} />}
      {nav.halaman === 'pengaturan' && <Pengaturan key={kunciHalaman} {...props} onPasswordBerubah={setAdaPassword} />}
    </main>
  );

  if (pakaiSidebar) {
    return (
      <div className="min-h-screen bg-[#ECEFF3] p-3 lg:p-4 text-slate-800">
        <div className="flex gap-3 lg:gap-4 items-start">
          <Sidebar aktif={aktif} pergi={pergi} onKunci={kunciSekarang} onTutup={() => aturSidebar(false)} bisaTutup versi={versi} />
          <div className="flex-1 min-w-0 bg-[#F5F7FA] rounded-[28px] p-5 sm:p-7 lg:p-8 shadow-sm border border-white/80 min-h-[calc(100vh-1.5rem)] lg:min-h-[calc(100vh-2rem)]">
            {isi}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ECEFF3] p-3 sm:p-4 text-slate-800">
      <div className="mx-auto bg-[#F5F7FA] rounded-[28px] p-5 sm:p-7 lg:p-8 shadow-sm border border-white/80 space-y-6 min-h-[calc(100vh-1.5rem)] sm:min-h-[calc(100vh-2rem)]">
        <Navbar aktif={aktif} pergi={pergi} onKunci={kunciSekarang} onBuka={() => aturSidebar(true)} bisaBuka={!sempit} versi={versi} />
        {isi}
      </div>
    </div>
  );
}
