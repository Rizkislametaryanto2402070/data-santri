'use strict';

// Jembatan aman antara tampilan (React) dan proses utama. Tampilan hanya boleh
// memanggil saluran yang namanya berpola "bagian:aksi", tidak ada akses langsung
// ke file atau sistem.

const { contextBridge, ipcRenderer } = require('electron');

const POLA = /^(auth|master|santri|nis|dashboard|export|import|backup|app):[a-zA-Z]+$/;

contextBridge.exposeInMainWorld('api', {
  panggil: (saluran, ...args) => {
    if (!POLA.test(saluran)) return Promise.reject(new Error('Saluran tidak dikenal: ' + saluran));
    return ipcRenderer.invoke(saluran, ...args);
  }
});
