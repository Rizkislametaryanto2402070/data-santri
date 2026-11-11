/** @type {import('tailwindcss').Config} */
// Warna mengikuti desain acuan dan ditulis langsung di kelas (mis. bg-[#164A41]),
// jadi konfigurasi ini cukup memuat lokasi file dan font.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif']
      }
    }
  },
  plugins: []
};
