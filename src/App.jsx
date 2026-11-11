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

export default function App() {
  const toast = useToast();
  const [status, setStatus] = useState('memuat'); // memuat | terkunci | buka | galat
  const [pesanGalat, setPesanGalat] = useState('');
  const [adaPassword, setAdaPassword] = useState(false);
  const [info, setInfo] = useState(null);
  const [nav, setNav] = useState({ halaman: 'dashboard', param: null });

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

  const pergi = (halaman, param = null) => setNav({ halaman, param });

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
      <div className="min-h-screen flex items-center justify-center p-8">
        <div role="alert" className="max-w-md bg-white border border-[#164A41]/10 shadow-sm rounded-2xl p-8">
          <h1 className="m-0 mb-2 text-base font-extrabold text-[#164A41]">Aplikasi tidak bisa dimulai</h1>
          <p className="m-0 text-xs text-slate-600">{pesanGalat}</p>
        </div>
      </div>
    );
  }
  if (status === 'terkunci') return <Kunci onBuka={() => { setNav({ halaman: 'dashboard', param: null }); setStatus('buka'); }} />;

  const aktif = nav.halaman === 'form' ? 'santri' : nav.halaman;
  const kunciHalaman = nav.halaman + JSON.stringify(nav.param);
  const props = { pergi, param: nav.param };

  return (
    <div className="flex min-h-screen bg-[#E3F0EC]">
      {/* SIDEBAR: hijau zamrud tua dengan kapsul putih pada menu aktif */}
      <aside className="w-[250px] bg-[#164A41] text-white flex flex-col justify-between shrink-0 py-6 px-4 h-screen sticky top-0 overflow-y-auto select-none">
        <div>
          <div className="flex flex-col items-center text-center px-2 pb-6 border-b border-white/10">
            <div className="relative">
              <div className="w-24 h-24 rounded-full p-1.5 border-2 border-emerald-200/50 bg-white/10 shadow-lg flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-inner">
                  <LogoAnNur className="w-[72px] h-[72px]" />
                </div>
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#00C838] border-2 border-[#164A41]" />
            </div>

            <div className="mt-3.5 text-base font-extrabold tracking-tight text-white">PP. An Nur Slawi</div>
            <p className="m-0 text-[11px] text-emerald-100/75 font-medium mt-0.5">Sistem Informasi Data Santri</p>

            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-semibold text-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15]" />
              <span>Mode Offline · Lokal</span>
            </div>
          </div>

          <nav aria-label="Menu utama" className="mt-6 space-y-1.5 px-1">
            {MENU.map((m) => {
              const aktifMenu = aktif === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-current={aktifMenu ? 'page' : undefined}
                  onClick={() => pergi(m.id)}
                  className={cx(
                    'w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs text-left transition-all duration-150',
                    aktifMenu ? 'bg-[#E3F0EC] text-[#164A41] font-extrabold shadow-md' : 'text-emerald-50/85 hover:bg-white/10 hover:text-white font-semibold'
                  )}
                >
                  <Ikon nama={m.ikon} tebal={aktifMenu ? 2.4 : 2} className={aktifMenu ? 'text-[#164A41]' : 'text-emerald-200/80'} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-5 border-t border-white/10 px-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={kunciSekarang}
              className="flex items-center gap-2.5 text-xs font-bold text-emerald-100/90 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Ikon nama="kunci" className="text-[#FACC15]" />
              <span>Kunci Aplikasi</span>
            </button>
            <span className="text-[10px] font-semibold text-emerald-200/60">v{info ? info.versi : '1.0.0'}</span>
          </div>
        </div>
      </aside>

      {/* AREA KANAN: bilah putih di atas tiap halaman + kanvas #E3F0EC */}
      <div className="flex-1 min-w-0 bg-[#E3F0EC]">
        <main className="p-5 flex flex-col gap-5">
          {nav.halaman === 'dashboard' && <Dashboard key={kunciHalaman} {...props} />}
          {nav.halaman === 'santri' && <DaftarSantri key={kunciHalaman} {...props} />}
          {nav.halaman === 'form' && <FormSantri key={kunciHalaman} {...props} />}
          {nav.halaman === 'master' && <Master key={kunciHalaman} {...props} />}
          {nav.halaman === 'impor' && <Impor key={kunciHalaman} {...props} />}
          {nav.halaman === 'backup' && <Backup key={kunciHalaman} {...props} />}
          {nav.halaman === 'pengaturan' && <Pengaturan key={kunciHalaman} {...props} onPasswordBerubah={setAdaPassword} />}
        </main>
      </div>
    </div>
  );
}
