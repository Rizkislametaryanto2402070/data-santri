'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const excel = require('./excel');

const DEV = !app.isPackaged && process.argv.includes('--dev');
let jendela = null;

// ---------------------------------------------------------------- lokasi data

// Versi portable menyimpan data di sebelah file .exe (mudah dibawa lewat flashdisk).
// Versi terpasang menyimpan di folder data pengguna Windows.
function folderData() {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    return path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'DataSantri-Data');
  }
  return path.join(app.getPath('userData'), 'data');
}

function pesanGalat(e) {
  if (e && (e.code === 'EBUSY' || e.code === 'EPERM' || e.code === 'EACCES')) {
    return 'File tidak bisa ditulis. Tutup file itu jika sedang terbuka di program lain, atau pilih lokasi lain.';
  }
  return (e && e.message) || String(e);
}

// Pembungkus: galat tak terduga dikirim sebagai { galat: true, error } agar tampilan bisa menampilkannya.
function daftar(saluran, fn) {
  ipcMain.handle(saluran, async (_event, ...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      console.error(saluran, e);
      return { galat: true, error: pesanGalat(e) };
    }
  });
}

// ---------------------------------------------------------------- saluran IPC

function daftarkanSaluran() {
  // Kunci aplikasi
  daftar('auth:status', () => ({ ada: db.passwordAda() }));
  daftar('auth:masuk', (pw) => db.masuk(pw));
  daftar('auth:atur', (o) => db.aturPassword(o && o.baru, o && o.lama));
  daftar('auth:hapus', (lama) => db.hapusPassword(lama));
  daftar('auth:pulihkan', (kode) => db.pulihkanPassword(kode));

  // Angkatan, kelas, asrama
  daftar('master:daftar', (t) => db.daftarMaster(t));
  daftar('master:tambah', (t, nama) => db.tambahMaster(t, nama));
  daftar('master:ubah', (t, id, nama) => db.ubahMaster(t, id, nama));
  daftar('master:hapus', (t, id) => db.hapusMaster(t, id));

  // Santri
  daftar('santri:daftar', (filter) => db.daftarSantri(filter || {}));
  daftar('santri:ambil', (id) => db.ambilSantri(id));
  daftar('santri:simpan', (d) => db.simpanSantri(d));
  daftar('santri:hapus', (id) => db.hapusSantri(id));

  daftar('dashboard:statistik', () => db.statistik());

  // Nomor Induk Santri
  daftar('nis:format', () => db.infoFormatNis());
  daftar('nis:periksa', (format) => db.periksaFormatNis(format));
  daftar('nis:simpanFormat', (format) => db.simpanFormatNis(format));
  daftar('nis:berikutnya', (angkatanId, jenisKelamin, kecualiId) => ({
    nis: db.nisBerikutnya(angkatanId, jenisKelamin, kecualiId)
  }));
  daftar('nis:pratinjauUrut', (angkatanId) => db.pratinjauUrut(angkatanId));
  daftar('nis:urutUlang', (angkatanId) => db.urutUlang(angkatanId));

  // Export Excel
  daftar('export:kolom', () => excel.daftarKolom());
  daftar('export:excel', async (o) => {
    let filter = {};
    let nama = 'Data_Santri_Semua';
    if (o.mode === 'angkatan') {
      filter = { angkatanId: o.angkatanId };
      const a = db.satu('SELECT nama FROM angkatan WHERE id = ?', [Number(o.angkatanId)]);
      nama = 'Data_Santri_Angkatan_' + (a ? a.nama : '');
    } else if (o.mode === 'filter') {
      filter = o.filter || {};
      nama = 'Data_Santri_Hasil_Filter';
    }
    const rows = db.daftarSantri(filter);
    if (!rows.length) return { ok: false, error: 'Tidak ada data santri untuk diekspor.' };

    const pilih = await dialog.showSaveDialog(jendela, {
      title: 'Simpan file Excel',
      defaultPath: path.join(app.getPath('documents'), nama + '.xlsx'),
      filters: [{ name: 'File Excel', extensions: ['xlsx'] }]
    });
    if (pilih.canceled || !pilih.filePath) return { ok: false, batal: true };

    await excel.tulisExport(
      rows,
      o.kolom,
      { sheetPerAngkatan: o.mode === 'semua' && !!o.sheetPerAngkatan, blokJk: o.blokJk !== false },
      pilih.filePath
    );
    return { ok: true, path: pilih.filePath, jumlah: rows.length };
  });

  // Impor Excel
  daftar('import:template', async () => {
    const pilih = await dialog.showSaveDialog(jendela, {
      title: 'Simpan template Excel',
      defaultPath: path.join(app.getPath('documents'), 'Template_Impor_Santri.xlsx'),
      filters: [{ name: 'File Excel', extensions: ['xlsx'] }]
    });
    if (pilih.canceled || !pilih.filePath) return { ok: false, batal: true };
    await excel.tulisTemplate(pilih.filePath);
    return { ok: true, path: pilih.filePath };
  });
  daftar('import:baca', async () => {
    const pilih = await dialog.showOpenDialog(jendela, {
      title: 'Pilih file Excel yang akan diimpor',
      properties: ['openFile'],
      filters: [{ name: 'File Excel', extensions: ['xlsx'] }]
    });
    if (pilih.canceled || !pilih.filePaths.length) return { ok: false, batal: true };
    const hasil = await excel.bacaImpor(pilih.filePaths[0], db.daftarNis());
    return { ok: true, berkas: path.basename(pilih.filePaths[0]), ...hasil };
  });
  daftar('import:masuk', (baris) => db.imporSantri(baris));

  // Backup dan pulihkan
  daftar('backup:info', () => ({
    terakhir: db.ambil('backup_terakhir'),
    folderOtomatis: db.ambil('folder_backup'),
    lokasiData: db.berkas()
  }));
  daftar('backup:buat', async () => {
    const pilih = await dialog.showSaveDialog(jendela, {
      title: 'Simpan file backup',
      defaultPath: path.join(app.getPath('documents'), `Backup-Santri-${db.tanggalFile()}.db`),
      filters: [{ name: 'Backup Data Santri', extensions: ['db'] }]
    });
    if (pilih.canceled || !pilih.filePath) return { ok: false, batal: true };
    db.salinKe(pilih.filePath);
    return { ok: true, path: pilih.filePath };
  });
  daftar('backup:pulihkan', async () => {
    const pilih = await dialog.showOpenDialog(jendela, {
      title: 'Pilih file backup',
      properties: ['openFile'],
      filters: [{ name: 'Backup Data Santri', extensions: ['db'] }]
    });
    if (pilih.canceled || !pilih.filePaths.length) return { ok: false, batal: true };

    const cek = db.validasiBuffer(fs.readFileSync(pilih.filePaths[0]));
    if (!cek.ok) return cek;

    const tanya = await dialog.showMessageBox(jendela, {
      type: 'warning',
      buttons: ['Batal', 'Ya, pulihkan'],
      defaultId: 0,
      cancelId: 0,
      title: 'Pulihkan data',
      message: `Data saat ini akan diganti dengan isi backup (${cek.jumlah} santri).`,
      detail: 'Data yang sekarang disimpan dulu sebagai cadangan otomatis, jadi masih bisa dikembalikan.'
    });
    if (tanya.response !== 1) return { ok: false, batal: true };
    return db.pulihkanDari(pilih.filePaths[0]);
  });
  daftar('backup:pilihFolder', async () => {
    const pilih = await dialog.showOpenDialog(jendela, {
      title: 'Pilih folder untuk backup otomatis',
      properties: ['openDirectory', 'createDirectory']
    });
    if (pilih.canceled || !pilih.filePaths.length) return { ok: false, batal: true };
    db.atur('folder_backup', pilih.filePaths[0]);
    return { ok: true, folder: pilih.filePaths[0] };
  });
  daftar('backup:matikanOtomatis', () => {
    db.atur('folder_backup', null);
    return { ok: true };
  });

  // Aplikasi
  daftar('app:info', () => ({
    versi: app.getVersion(),
    folderData: path.dirname(db.berkas()),
    portable: !!process.env.PORTABLE_EXECUTABLE_DIR
  }));
  daftar('app:tampilkan', (p) => { shell.showItemInFolder(p); return { ok: true }; });
  daftar('app:bukaFolderData', async () => {
    await shell.openPath(path.dirname(db.berkas()));
    return { ok: true };
  });
}

// ---------------------------------------------------------------- jendela

function buatJendela() {
  jendela = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    title: 'Data Santri',
    backgroundColor: '#F6F5F0',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  jendela.once('ready-to-show', () => jendela.show());
  jendela.on('closed', () => { jendela = null; });

  // Aplikasi ini offline: tolak pembukaan jendela baru atau pindah ke alamat lain.
  jendela.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  jendela.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://') && !url.startsWith('http://localhost:5173')) e.preventDefault();
  });

  if (DEV) {
    jendela.loadURL('http://localhost:5173');
    jendela.webContents.openDevTools({ mode: 'detach' });
  } else {
    jendela.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

// ---------------------------------------------------------------- mulai

async function mulai() {
  Menu.setApplicationMenu(null);
  const hasil = await db.buka(folderData());
  daftarkanSaluran();
  buatJendela();

  if (hasil.rusakKe) {
    dialog.showMessageBox(jendela, {
      type: 'error',
      title: 'File data rusak',
      message: 'File data tidak bisa dibaca, jadi aplikasi dimulai dengan data kosong.',
      detail: `File yang rusak disimpan di:\n${hasil.rusakKe}\n\nGunakan menu Backup & Restore untuk memulihkan dari file backup terakhir.`
    });
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (jendela) {
      if (jendela.isMinimized()) jendela.restore();
      jendela.focus();
    }
  });

  app.whenReady().then(mulai).catch((e) => {
    dialog.showErrorBox('Aplikasi gagal dimulai', (e && e.stack) || String(e));
    app.quit();
  });

  app.on('window-all-closed', () => app.quit());

  // Backup otomatis setiap aplikasi ditutup (jika folder sudah dipilih).
  app.on('before-quit', () => {
    try {
      if (!db.siap()) return;
      const folder = db.ambil('folder_backup');
      if (folder) db.cadangkanKe(folder);
    } catch (e) {
      console.error('Backup otomatis gagal:', e);
    }
  });
}
