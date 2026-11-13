/** @type {import('tailwindcss').Config} */
// Warna mengikuti desain acuan dan ditulis langsung di kelas (mis. bg-[#0F766E]),
// jadi konfigurasi ini cukup memuat lokasi file dan font.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Langkah opasitas tambahan supaya modifier seperti bg-black/55 dan bg-white/35 benar-benar dibuat.
      opacity: { 12: '0.12', 15: '0.15', 35: '0.35', 55: '0.55', 85: '0.85' },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif']
      }
    }
  },
  plugins: []
};
