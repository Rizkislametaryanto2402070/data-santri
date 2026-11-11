import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' wajib: aplikasi dimuat dari file lokal (file://), bukan dari server.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true }
});
