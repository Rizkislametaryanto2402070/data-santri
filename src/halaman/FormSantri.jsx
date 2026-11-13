import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { Banner, HeaderHalaman, Ikon, Kartu, Medan, Tombol, cx, kelasInput, useToast } from '../ui.jsx';

const AWAL = {
  id: null, nis: '', nisn: '', nik: '', nama: '', jenis_kelamin: '',
  tempat_lahir: '', tanggal_lahir: '', alamat: '',
  angkatan_id: '', kelas_id: '', asrama_id: '', kamar: '', status: 'Aktif', tanggal_masuk: '', catatan: '',
  nama_ayah: '', nama_ibu: '', nama_wali: '', hp_wali: '', foto: null
};

const BATAS_FOTO = 500 * 1024; // 500 KB
const SISI_FOTO = 360; // foto diperkecil agar database tetap ringan

// Membaca foto, menolak yang lebih dari 500 KB, lalu memperkecilnya ke JPEG.
function bacaFoto(berkas) {
  return new Promise((selesai, gagal) => {
    if (!/^image\/(jpeg|png)$/.test(berkas.type)) return gagal(new Error('Foto harus berformat JPG atau PNG.'));
    if (berkas.size > BATAS_FOTO) {
      return gagal(new Error(`Ukuran foto ${Math.round(berkas.size / 1024)} KB, melebihi batas 500 KB. Pilih foto yang lebih kecil.`));
    }
    const baca = new FileReader();
    baca.onerror = () => gagal(new Error('Foto tidak bisa dibaca.'));
    baca.onload = () => {
      const gambar = new Image();
      gambar.onerror = () => gagal(new Error('File ini bukan gambar yang valid.'));
      gambar.onload = () => {
        const skala = Math.min(1, SISI_FOTO / Math.max(gambar.width, gambar.height));
        const kanvas = document.createElement('canvas');
        kanvas.width = Math.max(1, Math.round(gambar.width * skala));
        kanvas.height = Math.max(1, Math.round(gambar.height * skala));
        const g = kanvas.getContext('2d');
        g.fillStyle = '#FFFFFF';
        g.fillRect(0, 0, kanvas.width, kanvas.height);
        g.drawImage(gambar, 0, 0, kanvas.width, kanvas.height);
        selesai(kanvas.toDataURL('image/jpeg', 0.82));
      };
      gambar.src = baca.result;
    };
    baca.readAsDataURL(berkas);
  });
}

// Pilihan angkatan / kelas / asrama, dengan opsi menambah baru di tempat.
function PilihMaster({ id, label, tabel, nilai, daftar, onUbah, onSegar, petunjuk }) {
  const [baru, setBaru] = useState(false);
  const [nama, setNama] = useState('');
  const [galat, setGalat] = useState('');

  async function buat() {
    try {
      const r = await api('master:tambah', tabel, nama);
      if (!r.ok) { setGalat(r.error); return; }
      await onSegar();
      onUbah(String(r.id));
      setBaru(false);
      setNama('');
      setGalat('');
    } catch (e) {
      setGalat(e.message);
    }
  }

  return (
    <Medan label={label} htmlFor={id} petunjuk={petunjuk} className="flex-[1_1_100%]">
      <select
        id={id}
        className={kelasInput}
        value={baru ? '__baru' : nilai}
        onChange={(e) => {
          if (e.target.value === '__baru') setBaru(true);
          else { setBaru(false); onUbah(e.target.value); }
        }}
      >
        <option value="">{daftar.length ? 'Pilih…' : 'Belum ada, buat baru'}</option>
        {daftar.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
        <option value="__baru">+ Tambah baru…</option>
      </select>
      {baru && (
        <div className="flex flex-wrap gap-2 items-start mt-1">
          <input aria-label={`Nama ${tabel} baru`} className={cx(kelasInput, 'flex-1 basis-[140px] w-auto')} value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama baru" autoFocus />
          <Tombol varian="hijau" onClick={buat} disabled={!nama.trim()}>Buat</Tombol>
          <Tombol varian="teks" onClick={() => { setBaru(false); setGalat(''); }}>Batal</Tombol>
          {galat && <p role="alert" className="m-0 basis-full text-red-800 font-bold text-[11px]">{galat}</p>}
        </div>
      )}
    </Medan>
  );
}

export default function FormSantri({ pergi, param }) {
  const toast = useToast();
  const idEdit = param && param.id ? param.id : null;
  const [f, setF] = useState(AWAL);
  const [awal, setAwal] = useState(null); // data asli saat mengedit
  const [master, setMaster] = useState({ angkatan: [], kelas: [], asrama: [] });
  const [memuat, setMemuat] = useState(!!idEdit);
  const [galat, setGalat] = useState('');
  const [galatFoto, setGalatFoto] = useState('');
  const [nisOto, setNisOto] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const inputFoto = useRef(null);
  const banner = useRef(null);

  const muatMaster = useCallback(async () => {
    const [angkatan, kelas, asrama] = await Promise.all([
      api('master:daftar', 'angkatan'), api('master:daftar', 'kelas'), api('master:daftar', 'asrama')
    ]);
    setMaster({ angkatan, kelas, asrama });
  }, []);

  useEffect(() => { muatMaster().catch((e) => toast(e.message, 'galat')); }, [muatMaster, toast]);

  useEffect(() => {
    if (!idEdit) return;
    api('santri:ambil', idEdit)
      .then((d) => {
        if (!d) { toast('Data santri tidak ditemukan.', 'galat'); pergi('santri'); return; }
        const isi = { ...AWAL };
        Object.keys(AWAL).forEach((k) => { if (d[k] !== null && d[k] !== undefined) isi[k] = k.endsWith('_id') ? String(d[k]) : d[k]; });
        setF(isi);
        setAwal({ nis: isi.nis, angkatan_id: isi.angkatan_id, jenis_kelamin: isi.jenis_kelamin });
        setMemuat(false);
      })
      .catch((e) => { toast(e.message, 'galat'); setMemuat(false); });
  }, [idEdit, pergi, toast]);

  useEffect(() => { if (galat && banner.current) banner.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [galat]);

  const ubah = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const isi = (k) => ({ id: k, value: f[k] ?? '', onChange: (e) => ubah(k, e.target.value) });

  // Nomor induk otomatis: dibuat jika kosong, atau jika angkatan/jenis kelamin berubah dan nomor tidak diubah manual.
  const grupBerubah = !!awal && (String(awal.angkatan_id) !== String(f.angkatan_id) || awal.jenis_kelamin !== f.jenis_kelamin);
  const perluOtomatis = !f.nis || (!!awal && grupBerubah && f.nis === awal.nis);

  useEffect(() => {
    if (!perluOtomatis || !f.angkatan_id || !f.jenis_kelamin) { setNisOto(''); return undefined; }
    let batal = false;
    api('nis:berikutnya', Number(f.angkatan_id), f.jenis_kelamin, idEdit || 0)
      .then((r) => { if (!batal) setNisOto(r.nis || ''); })
      .catch(() => {});
    return () => { batal = true; };
  }, [perluOtomatis, f.angkatan_id, f.jenis_kelamin, idEdit]);

  async function pilihFoto(e) {
    const berkas = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!berkas) return;
    setGalatFoto('');
    try {
      ubah('foto', await bacaFoto(berkas));
    } catch (x) {
      setGalatFoto(x.message);
    }
  }

  async function simpan(tambahLagi) {
    setGalat('');
    setSibuk(true);
    try {
      const r = await api('santri:simpan', { ...f, foto: f.foto || null });
      if (!r.ok) { setGalat(r.error); return; }
      toast(`${f.nama.trim()} disimpan. Nomor induk: ${r.nis}${r.nisBerubah ? ' (diperbarui)' : ''}`);
      if (tambahLagi) {
        setF({ ...AWAL, angkatan_id: f.angkatan_id, kelas_id: f.kelas_id, asrama_id: f.asrama_id, status: f.status, tanggal_masuk: f.tanggal_masuk });
        setNisOto('');
        window.scrollTo({ top: 0 });
      } else {
        pergi('santri');
      }
    } catch (e) {
      setGalat(e.message);
    } finally {
      setSibuk(false);
    }
  }

  if (memuat) return null;

  return (
    <>
      <HeaderHalaman
        judul={idEdit ? 'Ubah Data Santri' : 'Tambah Santri Baru'}
        sub="Kolom bertanda * wajib diisi."
        atas={
          <nav aria-label="Jejak halaman" className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mb-0.5">
            <button type="button" onClick={() => pergi('santri')} className="bg-transparent border-0 text-slate-800 font-bold cursor-pointer p-0 hover:underline">Data Santri</button>
            <span aria-hidden="true">/</span>
            <span>{idEdit ? 'Ubah Santri' : 'Tambah Santri'}</span>
          </nav>
        }
      />

      {galat && <div ref={banner}><Banner jenis="galat">{galat}</Banner></div>}

      <form onSubmit={(e) => { e.preventDefault(); simpan(false); }} className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-5 items-start">
          <div className="flex-[2_1_520px] min-w-0 flex flex-col gap-5">
            <Kartu judul="Identitas Santri">
              <div className="flex flex-wrap gap-x-5 gap-y-4">
                <Medan
                  label="Nomor Induk Santri"
                  htmlFor="nis"
                  className="flex-[1_1_100%]"
                  petunjuk={
                    perluOtomatis
                      ? nisOto
                        ? (idEdit && grupBerubah ? `Angkatan atau jenis kelamin berubah, nomor akan diganti otomatis menjadi ${nisOto}.` : `Dibuat otomatis: ${nisOto}. Kosongkan kolom ini untuk memakai nomor tersebut.`)
                        : 'Pilih angkatan dan jenis kelamin, nomor induk dibuat otomatis sesuai format di Pengaturan.'
                      : 'Nomor diisi manual. Mengubahnya tidak mengubah nomor santri lain.'
                  }
                >
                  <input {...isi('nis')} className={kelasInput} placeholder="Otomatis" autoComplete="off" />
                </Medan>

                <Medan label="NISN" htmlFor="nisn" className="flex-[1_1_200px]"><input {...isi('nisn')} className={kelasInput} placeholder="10 digit" inputMode="numeric" /></Medan>
                <Medan label="NIK" htmlFor="nik" className="flex-[1_1_200px]"><input {...isi('nik')} className={kelasInput} placeholder="16 digit" inputMode="numeric" /></Medan>
                <Medan label="Nama Lengkap *" htmlFor="nama" className="flex-[1_1_100%]"><input {...isi('nama')} className={kelasInput} placeholder="Sesuai akta kelahiran" required /></Medan>

                <fieldset className="flex-[1_1_100%] m-0 p-0 border-0 flex flex-col gap-0.5">
                  <legend className="p-0 mb-1 text-xs font-bold text-slate-800">Jenis Kelamin *</legend>
                  <div className="flex flex-wrap gap-4">
                    {['Putra', 'Putri'].map((j) => (
                      <label key={j} className="flex items-center gap-2 min-h-[36px] pr-2 text-xs font-semibold text-[#12352E]">
                        <input type="radio" name="jenis-kelamin" value={j} checked={f.jenis_kelamin === j} onChange={() => ubah('jenis_kelamin', j)} className="w-4 h-4 m-0 accent-[#0F766E]" />
                        {j}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <Medan label="Tempat Lahir" htmlFor="tempat_lahir" className="flex-[1_1_200px]"><input {...isi('tempat_lahir')} className={kelasInput} placeholder="Kota atau kabupaten" /></Medan>
                <Medan label="Tanggal Lahir" htmlFor="tanggal_lahir" className="flex-[1_1_200px]"><input {...isi('tanggal_lahir')} type="date" className={kelasInput} /></Medan>
                <Medan label="Alamat Lengkap" htmlFor="alamat" className="flex-[1_1_100%]">
                  <textarea {...isi('alamat')} rows={3} className={cx(kelasInput, 'py-2.5 resize-y')} placeholder="Jalan, RT/RW, desa, kecamatan, kabupaten" />
                </Medan>
              </div>
            </Kartu>

            <Kartu judul="Data Wali">
              <div className="flex flex-wrap gap-x-5 gap-y-4">
                <Medan label="Nama Ayah" htmlFor="nama_ayah" className="flex-[1_1_240px]"><input {...isi('nama_ayah')} className={kelasInput} /></Medan>
                <Medan label="Nama Ibu" htmlFor="nama_ibu" className="flex-[1_1_240px]"><input {...isi('nama_ibu')} className={kelasInput} /></Medan>
                <Medan label="Nama Wali" htmlFor="nama_wali" className="flex-[1_1_240px]"><input {...isi('nama_wali')} className={kelasInput} placeholder="Isi jika wali bukan orang tua" /></Medan>
                <Medan label="No. HP / WhatsApp Wali" htmlFor="hp_wali" className="flex-[1_1_240px]"><input {...isi('hp_wali')} type="tel" className={kelasInput} placeholder="08xx-xxxx-xxxx" /></Medan>
              </div>
            </Kartu>
          </div>

          <div className="flex-[1_1_300px] min-w-0 flex flex-col gap-5">
            <Kartu judul="Foto Santri">
              <div className="flex flex-col items-center gap-3.5">
                <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-[#B5E2D8] bg-slate-50 flex items-center justify-center text-[#B5E2D8] overflow-hidden">
                  {f.foto ? <img src={f.foto} alt={`Foto ${f.nama || 'santri'}`} className="w-full h-full object-cover" /> : <Ikon nama="foto" ukuran={56} />}
                </div>
                <input ref={inputFoto} id="foto" type="file" accept="image/jpeg,image/png" onChange={pilihFoto} className="sr-only" tabIndex={-1} aria-label="Pilih file foto" />
                <div className="flex flex-wrap gap-2 justify-center">
                  <Tombol ikon="impor" onClick={() => inputFoto.current && inputFoto.current.click()}>{f.foto ? 'Ganti Foto' : 'Pilih Foto'}</Tombol>
                  {f.foto && <Tombol varian="teks" onClick={() => { ubah('foto', null); setGalatFoto(''); }}>Hapus</Tombol>}
                </div>
                <span className="text-[11px] font-medium text-slate-500 text-center">JPG atau PNG, maksimal 500 KB. Foto otomatis diperkecil agar database tetap ringan.</span>
                {galatFoto && <p role="alert" className="m-0 text-xs text-red-800 font-bold text-center">{galatFoto}</p>}
              </div>
            </Kartu>

            <Kartu judul="Data Pondok">
              <div className="flex flex-wrap gap-x-5 gap-y-4">
                <PilihMaster id="angkatan_id" label="Angkatan *" tabel="angkatan" nilai={f.angkatan_id} daftar={master.angkatan} onUbah={(v) => ubah('angkatan_id', v)} onSegar={muatMaster} petunjuk="Tulis sebagai tahun, mis. 2024. Dipakai di nomor induk." />
                <PilihMaster id="kelas_id" label="Kelas" tabel="kelas" nilai={f.kelas_id} daftar={master.kelas} onUbah={(v) => ubah('kelas_id', v)} onSegar={muatMaster} />
                <PilihMaster id="asrama_id" label="Asrama" tabel="asrama" nilai={f.asrama_id} daftar={master.asrama} onUbah={(v) => ubah('asrama_id', v)} onSegar={muatMaster} />
                <Medan label="Kamar" htmlFor="kamar" className="flex-[1_1_100%]"><input {...isi('kamar')} className={kelasInput} placeholder="Contoh: 04" /></Medan>

                <fieldset className="flex-[1_1_100%] m-0 p-0 border-0 flex flex-col gap-0.5">
                  <legend className="p-0 mb-1 text-xs font-bold text-slate-800">Status Santri</legend>
                  <div className="flex flex-wrap gap-x-4">
                    {['Aktif', 'Alumni', 'Boyong', 'Pindah'].map((s) => (
                      <label key={s} className="flex items-center gap-2 min-h-[36px] pr-2 text-xs font-semibold text-[#12352E]">
                        <input type="radio" name="status" value={s} checked={f.status === s} onChange={() => ubah('status', s)} className="w-4 h-4 m-0 accent-[#0F766E]" />
                        {s}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <Medan label="Tanggal Masuk" htmlFor="tanggal_masuk" className="flex-[1_1_100%]"><input {...isi('tanggal_masuk')} type="date" className={kelasInput} /></Medan>
                <Medan label="Catatan Khusus" htmlFor="catatan" className="flex-[1_1_100%]">
                  <textarea {...isi('catatan')} rows={3} className={cx(kelasInput, 'py-2.5 resize-y')} placeholder="Kesehatan, prestasi, atau hal lain yang perlu dicatat" />
                </Medan>
              </div>
            </Kartu>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] border border-slate-100/80 px-6 py-4 flex flex-wrap items-center justify-end gap-3">
          <span className="mr-auto text-[11px] font-medium text-slate-500">Data disimpan langsung ke database di laptop ini.</span>
          <Tombol onClick={() => pergi('santri')}>Batal</Tombol>
          {!idEdit && <Tombol varian="hijau" onClick={() => simpan(true)} disabled={sibuk}>Simpan &amp; Tambah Lagi</Tombol>}
          <Tombol type="submit" varian="utama" ikon="centang" disabled={sibuk}>{sibuk ? 'Menyimpan…' : 'Simpan Santri'}</Tombol>
        </div>
      </form>
    </>
  );
}
