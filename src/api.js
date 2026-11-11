// Pemanggil ke proses utama Electron (lihat electron/preload.js dan electron/main.js).
// Galat tak terduga dari proses utama dilempar sebagai Error biasa.
export async function api(saluran, ...args) {
  if (!window.api) {
    throw new Error('Aplikasi ini harus dijalankan lewat Electron (npm run dev, atau file .exe).');
  }
  const hasil = await window.api.panggil(saluran, ...args);
  if (hasil && hasil.galat) throw new Error(hasil.error);
  return hasil;
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const p2 = (n) => String(n).padStart(2, '0');

export function hariIni() {
  const d = new Date();
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

// ISO -> "Minggu, 8 November 2026 · 19.42"
export function waktuIndo(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()} · ${p2(d.getHours())}.${p2(d.getMinutes())}`;
}

// Teks ringkas filter yang sedang aktif, mis. "Angkatan 2024 · Aktif · Putra".
export function ringkasFilter(filter, master) {
  const bagian = [];
  if (filter.angkatanId) {
    const a = master.angkatan.find((x) => String(x.id) === String(filter.angkatanId));
    if (a) bagian.push('Angkatan ' + a.nama);
  }
  if (filter.kelasId) {
    const k = master.kelas.find((x) => String(x.id) === String(filter.kelasId));
    if (k) bagian.push(k.nama);
  }
  if (filter.asramaId) {
    const r = master.asrama.find((x) => String(x.id) === String(filter.asramaId));
    if (r) bagian.push(r.nama);
  }
  if (filter.status) bagian.push(filter.status);
  if (filter.jenisKelamin) bagian.push(filter.jenisKelamin);
  if (filter.q) bagian.push(`"${filter.q}"`);
  return bagian.join(' · ');
}
