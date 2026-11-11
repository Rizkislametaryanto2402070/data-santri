import React, { useState } from 'react';
import { api } from '../api.js';
import { LogoAnNur, Tombol, kelasInput } from '../ui.jsx';

export default function Kunci({ onBuka }) {
  const [pw, setPw] = useState('');
  const [kode, setKode] = useState('');
  const [lupa, setLupa] = useState(false);
  const [galat, setGalat] = useState('');
  const [sibuk, setSibuk] = useState(false);

  async function kirim(e) {
    e.preventDefault();
    setGalat('');
    setSibuk(true);
    try {
      if (lupa) {
        const r = await api('auth:pulihkan', kode);
        if (!r.ok) setGalat(r.error);
        else onBuka();
      } else {
        const benar = await api('auth:masuk', pw);
        if (benar === true) onBuka();
        else {
          setGalat('Password salah.');
          setPw('');
        }
      }
    } catch (x) {
      setGalat(x.message);
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F2E28] flex items-center justify-center p-4">
      <form onSubmit={kirim} className="bg-white rounded-3xl max-w-sm w-full p-7 text-center shadow-2xl flex flex-col gap-4">
        <div className="w-20 h-20 mx-auto">
          <LogoAnNur className="w-full h-full" />
        </div>
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900">Aplikasi Terkunci</span>
          <h1 className="m-0 text-base font-extrabold text-[#164A41] mt-1">PP. An Nur Slawi</h1>
          <p className="m-0 text-xs text-slate-500 mt-0.5">
            {lupa ? 'Masukkan kode pemulihan untuk membuka kembali sistem.' : 'Masukkan password untuk membuka kembali sistem data santri.'}
          </p>
        </div>

        {lupa ? (
          <div className="flex flex-col gap-1 text-left">
            <label htmlFor="kode" className="block text-xs font-bold text-[#164A41]">Kode pemulihan</label>
            <input id="kode" className={kelasInput} value={kode} onChange={(e) => setKode(e.target.value)} placeholder="XXXXX-XXXXX" autoFocus autoComplete="off" />
            <p className="m-0 text-[11px] font-medium text-slate-500">Kode ini ditampilkan sekali saat password dibuat. Jika cocok, password dihapus dan Anda bisa membuat yang baru di Pengaturan.</p>
          </div>
        ) : (
          <div>
            <label htmlFor="pw" className="sr-only">Password</label>
            <input
              id="pw"
              type="password"
              className="w-48 mx-auto block text-center text-lg font-extrabold tracking-widest px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-[#164A41] focus:ring-2 focus:ring-[#164A41]/15"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoFocus
              autoComplete="current-password"
            />
          </div>
        )}

        {galat && <p role="alert" className="m-0 text-xs text-red-800 font-bold">{galat}</p>}

        <Tombol type="submit" varian="utama" className="w-full py-2.5 font-extrabold" disabled={sibuk || (lupa ? !kode.trim() : !pw)}>
          {lupa ? 'Pulihkan Akses' : 'Buka Kunci Aplikasi'}
        </Tombol>
        <button type="button" onClick={() => { setLupa(!lupa); setGalat(''); }} className="text-xs text-[#164A41] font-bold bg-transparent border-0 cursor-pointer py-1 hover:underline">
          {lupa ? 'Kembali ke password' : 'Lupa password?'}
        </button>
      </form>
    </div>
  );
}
