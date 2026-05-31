import { openDB } from 'idb';

const DB_NAME = 'bjb-field-marketing-db';
const DB_VERSION = 3; // Incremented database version to 3 to force schema upgrade and logs store creation
const PROSPECTS_STORE = 'prospects';
const SYNC_QUEUE_STORE = 'sync-queue';
const LOGS_STORE = 'logs';

const formatRupiah = (value) => {
  if (!value) return 'Rp 0';
  const numberString = value.toString().replace(/[^0-9]/g, '');
  const sisa = numberString.length % 3;
  let rupiah = numberString.substr(0, sisa);
  const ribuan = numberString.substr(sisa).match(/\d{3}/g);

  if (ribuan) {
    const separator = sisa ? '.' : '';
    rupiah += separator + ribuan.join('.');
  }
  return rupiah ? 'Rp ' + rupiah : 'Rp 0';
};

export const initDB = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, _oldVersion) {
      if (!db.objectStoreNames.contains(PROSPECTS_STORE)) {
        db.createObjectStore(PROSPECTS_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(LOGS_STORE)) {
        db.createObjectStore(LOGS_STORE, { keyPath: 'id', autoIncrement: true });
      }
    },
  });

  // Seed mock data for demonstration if empty
  const count = await db.count(PROSPECTS_STORE);
  if (count === 0) {
    const mockProspects = [
      {
        name: 'CV Maju Jaya (Bpk. Ahmad)',
        phone: '08122334455',
        address: 'Jl. Merdeka No. 10, Bandung',
        location: '-6.9175, 107.6191',
        category: 'Kredit',
        tujuanKredit: 'Modal Kerja',
        plafond: 250000000,
        omzet: 80000000,
        agunan: 'SHM Ruko',
        status: 'Approval',
        catatan: 'Usaha berkembang pesat, berkas sedang diverifikasi.',
        createdBy: 'officer',
        createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        tanggalKunjungan: new Date(Date.now() - 3600000 * 24 * 2.5).toISOString().split('T')[0],
        synced: true,
        statusHistory: [
          { status: 'Sosialisasi', timestamp: new Date(Date.now() - 3600000 * 24 * 2.5).toISOString(), updatedBy: 'Asep Marketing', note: 'Sosialisasi program bjb Kredit komersial' },
          { status: 'Pemberkasan', timestamp: new Date(Date.now() - 3600000 * 24 * 2.3).toISOString(), updatedBy: 'Asep Marketing', note: 'Melengkapi kelengkapan berkas Kredit komersial' },
          { status: 'Analisa', timestamp: new Date(Date.now() - 3600000 * 24 * 2.1).toISOString(), updatedBy: 'Asep Marketing', note: 'Pemeriksaan kelayakan usaha & BI Checking' },
          { status: 'Approval', timestamp: new Date(Date.now() - 3600000 * 24 * 2.0).toISOString(), updatedBy: 'Asep Marketing', note: 'Melanjutkan ke approval komite kredit' }
        ]
      },
      {
        name: 'PT Surya Abadi',
        phone: '08139988776',
        address: 'Kawasan Industri Rancaekek, Bandung',
        location: '-6.9744, 107.7631',
        category: 'Funding',
        produkFunding: 'Deposito',
        penempatanDana: 1000000000,
        sumberDana: 'Hasil Usaha',
        status: 'Akad',
        catatan: 'Rencana penempatan dana 1 Miliar jangka waktu 6 bulan.',
        createdBy: 'officer_siti',
        createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
        tanggalKunjungan: new Date(Date.now() - 3600000 * 24 * 1.2).toISOString().split('T')[0],
        synced: true,
        statusHistory: [
          { status: 'Sosialisasi', timestamp: new Date(Date.now() - 3600000 * 24 * 1.2).toISOString(), updatedBy: 'Siti Funding', note: 'Sosialisasi penempatan Deposito di kantor PT Surya Abadi' },
          { status: 'Pemberkasan', timestamp: new Date(Date.now() - 3600000 * 24 * 1.15).toISOString(), updatedBy: 'Siti Funding', note: 'Penyiapan berkas data nasabah baru' },
          { status: 'Analisa', timestamp: new Date(Date.now() - 3600000 * 24 * 1.1).toISOString(), updatedBy: 'Siti Funding', note: 'Evaluasi kesepakatan penawaran bunga deposito khusus' },
          { status: 'Approval', timestamp: new Date(Date.now() - 3600000 * 24 * 1.05).toISOString(), updatedBy: 'Siti Funding', note: 'Persetujuan direksi & pimpinan wilayah' },
          { status: 'Akad', timestamp: new Date(Date.now() - 3600000 * 24 * 1.0).toISOString(), updatedBy: 'Siti Funding', note: 'Penandatanganan bilyet deposito & penempatan dana' }
        ]
      },
      {
        name: 'Toko Berkah (Ibu Aminah)',
        phone: '08571122334',
        address: 'Jl. Pajajaran No. 45, Bandung',
        location: '-6.9052, 107.6033',
        category: 'Kredit',
        tujuanKredit: 'Investasi',
        plafond: 120000000,
        omzet: 45000000,
        agunan: 'BPKB Mobil',
        status: 'Analisa',
        catatan: 'Butuh tambahan modal untuk renovasi toko.',
        createdBy: 'officer',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        tanggalKunjungan: new Date(Date.now() - 3600000 * 18).toISOString().split('T')[0],
        synced: false,
        statusHistory: [
          { status: 'Sosialisasi', timestamp: new Date(Date.now() - 3600000 * 18).toISOString(), updatedBy: 'Asep Marketing', note: 'Sosialisasi program Kredit Investasi di toko' },
          { status: 'Pemberkasan', timestamp: new Date(Date.now() - 3600000 * 15).toISOString(), updatedBy: 'Asep Marketing', note: 'Pengumpulan fotokopi jaminan BPKB Mobil & SKU' },
          { status: 'Analisa', timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), updatedBy: 'Asep Marketing', note: 'Analisa taksiran nilai jaminan BPKB & kapasitas cicilan' }
        ]
      },
      {
        name: 'Bapak Hendra (Tani Makmur)',
        phone: '08215566778',
        address: 'Jl. Raya Lembang No. 120, Bandung Barat',
        location: '-6.8173, 107.6189',
        category: 'Kredit',
        tujuanKredit: 'Modal Kerja',
        plafond: 75000000,
        omzet: 25000000,
        agunan: 'Kios Pasar',
        status: 'Sosialisasi',
        catatan: 'Baru sosialisasi program Kredit Mesra bjb.',
        createdBy: 'officer_budi',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        tanggalKunjungan: new Date(Date.now() - 3600000 * 6).toISOString().split('T')[0],
        synced: false,
        statusHistory: [
          { status: 'Sosialisasi', timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), updatedBy: 'Budi Kredit', note: 'Kunjungan lapangan & sosialisasi Kredit Mesra bjb' }
        ]
      },
      {
        name: 'Ibu Rina (Apotek Sehat)',
        phone: '08782244668',
        address: 'Jl. Dago No. 88, Bandung',
        location: '-6.8892, 107.6161',
        category: 'Funding',
        produkFunding: 'Tabungan Bisnis',
        penempatanDana: 150000000,
        sumberDana: 'Omzet Apotek',
        status: 'Pemberkasan',
        catatan: 'Tertarik dengan bunga Tabungan Bisnis bjb.',
        createdBy: 'officer_siti',
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        tanggalKunjungan: new Date(Date.now() - 3600000 * 2).toISOString().split('T')[0],
        synced: true,
        statusHistory: [
          { status: 'Sosialisasi', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), updatedBy: 'Siti Funding', note: 'Sosialisasi program bjb Tabungan Bisnis' },
          { status: 'Pemberkasan', timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), updatedBy: 'Siti Funding', note: 'Nasabah mengumpulkan berkas pembukaan rekening' }
        ]
      },
      {
        name: 'Bapak Mulyana (Warung Sembako)',
        phone: '08123456789',
        address: 'Jl. Kiara Condong No. 12, Bandung',
        location: '-6.9254, 107.6462',
        category: 'Kredit',
        tujuanKredit: 'Modal Kerja',
        plafond: 50000000,
        omzet: 18000000,
        agunan: 'Kios Kelontong',
        status: 'Batal',
        catatan: 'Nasabah merasa suku bunga terlalu tinggi dan memutuskan membatalkan pengajuan.',
        createdBy: 'officer',
        createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
        tanggalKunjungan: new Date(Date.now() - 3600000 * 24 * 5.2).toISOString().split('T')[0],
        synced: true,
        statusHistory: [
          { status: 'Sosialisasi', timestamp: new Date(Date.now() - 3600000 * 24 * 5.2).toISOString(), updatedBy: 'Asep Marketing', note: 'Sosialisasi Kredit Mikro Utama' },
          { status: 'Pemberkasan', timestamp: new Date(Date.now() - 3600000 * 24 * 5.1).toISOString(), updatedBy: 'Asep Marketing', note: 'Pemberkasan awal dokumen legalitas usaha' },
          { status: 'Batal', timestamp: new Date(Date.now() - 3600000 * 24 * 5.0).toISOString(), updatedBy: 'Asep Marketing', note: 'Nasabah membatalkan karena suku bunga tidak cocok' }
        ]
      },
      {
        name: 'CV Sinar Harapan (Bpk. Taufik)',
        phone: '08527788990',
        address: 'Jl. Soekarno Hatta No. 450, Bandung',
        location: '-6.9402, 107.6531',
        category: 'Kredit',
        tujuanKredit: 'Investasi',
        plafond: 400000000,
        omzet: 120000000,
        agunan: 'SHM Tanah Kosong',
        status: 'Ditolak',
        catatan: 'Ditolak oleh analis komite kredit karena riwayat kolektibilitas (BI Checking) kurang baik.',
        createdBy: 'officer_budi',
        createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
        tanggalKunjungan: new Date(Date.now() - 3600000 * 24 * 4.5).toISOString().split('T')[0],
        synced: true,
        statusHistory: [
          { status: 'Sosialisasi', timestamp: new Date(Date.now() - 3600000 * 24 * 4.5).toISOString(), updatedBy: 'Budi Kredit', note: 'Kunjungan dan penawaran pembiayaan investasi' },
          { status: 'Pemberkasan', timestamp: new Date(Date.now() - 3600000 * 24 * 4.3).toISOString(), updatedBy: 'Budi Kredit', note: 'Pengumpulan kelengkapan laporan keuangan & agunan' },
          { status: 'Analisa', timestamp: new Date(Date.now() - 3600000 * 24 * 4.1).toISOString(), updatedBy: 'Budi Kredit', note: 'Pengecekan SLIK OJK / BI Checking' },
          { status: 'Ditolak', timestamp: new Date(Date.now() - 3600000 * 24 * 4.0).toISOString(), updatedBy: 'Budi Kredit', note: 'Ditolak komite karena riwayat SLIK Kol-5' }
        ]
      }
    ];

    for (const p of mockProspects) {
      await db.add(PROSPECTS_STORE, p);
    }

    // Seed mock logs too!
    const mockLogs = [
      {
        username: 'admin',
        name: 'Administrator Utama',
        role: 'Super Admin',
        action: 'SYSTEM_INIT',
        details: 'Sistem diinisialisasi pertama kali.',
        timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
      },
      {
        username: 'officer',
        name: 'Asep Marketing',
        role: 'Officer',
        action: 'LOGIN',
        details: 'Melakukan login ke aplikasi.',
        timestamp: new Date(Date.now() - 3600000 * 24 * 2 - 3600000).toISOString()
      },
      {
        username: 'officer',
        name: 'Asep Marketing',
        role: 'Officer',
        action: 'CREATE_PROSPECT',
        details: 'Menambahkan prospek Kredit: CV Maju Jaya (Bpk. Ahmad) (Plafond Rp 250.000.000).',
        timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
      },
      {
        username: 'officer_siti',
        name: 'Siti Funding',
        role: 'Officer',
        action: 'CREATE_PROSPECT',
        details: 'Menambahkan prospek Funding: PT Surya Abadi (Penempatan Rp 1.000.000.000).',
        timestamp: new Date(Date.now() - 3600000 * 24 * 1).toISOString()
      }
    ];

    for (const log of mockLogs) {
      await db.add(LOGS_STORE, log);
    }
  }

  return db;
};

// Activity logs operations
export const writeLog = async (action, details, customUser = null) => {
  try {
    const db = await initDB();
    let user = customUser;
    
    if (!user) {
      const storedUser = localStorage.getItem('user');
      user = storedUser ? JSON.parse(storedUser) : { username: 'system', name: 'System', role: 'System' };
    }
    
    await db.add(LOGS_STORE, {
      username: user.username,
      name: user.name,
      role: user.role,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to write log:', err);
  }
};

export const getAllLogs = async () => {
  const db = await initDB();
  return db.getAll(LOGS_STORE);
};

export const clearLogs = async () => {
  const db = await initDB();
  const tx = db.transaction(LOGS_STORE, 'readwrite');
  await tx.objectStore(LOGS_STORE).clear();
  await tx.done;
  
  // Write a log indicating clearing logs
  await writeLog('CLEAR_LOGS', 'Seluruh riwayat aktivitas telah dihapus oleh Super Admin.');
};

export const saveProspect = async (prospect) => {
  const db = await initDB();
  const nowStr = new Date().toISOString();
  
  // Fetch active session user info
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : { username: prospect.createdBy || 'unknown', name: 'Sales Lapangan', role: 'Officer' };
  
  const initialStatus = prospect.status || 'Sosialisasi';
  
  const id = await db.add(PROSPECTS_STORE, { 
    ...prospect, 
    createdAt: nowStr, 
    synced: false,
    statusHistory: [
      {
        status: initialStatus,
        timestamp: nowStr,
        updatedBy: user.name || user.username,
        note: 'Pertemuan pertama & prospek terdaftar'
      }
    ]
  });
  // Add to sync queue
  await db.add(SYNC_QUEUE_STORE, { prospectId: id, action: 'CREATE' });
  
  // Write prospect creation log
  const detailString = prospect.category === 'Kredit'
    ? `Menambahkan prospek Kredit: ${prospect.name} (Plafond ${formatRupiah(prospect.plafond)})`
    : `Menambahkan prospek Funding: ${prospect.name} (Penempatan ${formatRupiah(prospect.penempatanDana)})`;
  
  await writeLog('CREATE_PROSPECT', detailString, user);
  return id;
};

export const getAllProspects = async () => {
  const db = await initDB();
  return db.getAll(PROSPECTS_STORE);
};

export const markAsSynced = async (id) => {
  const db = await initDB();
  const prospect = await db.get(PROSPECTS_STORE, id);
  if (prospect) {
    prospect.synced = true;
    await db.put(PROSPECTS_STORE, prospect);
  }
};

export const updateProspectStatus = async (id, status) => {
  const db = await initDB();
  const prospect = await db.get(PROSPECTS_STORE, id);
  if (prospect) {
    const oldStatus = prospect.status;
    const nowStr = new Date().toISOString();
    
    // Fetch active session user info
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : { username: 'system', name: 'System', role: 'System' };
    
    prospect.status = status;
    prospect.synced = false; // Mark as unsynced
    
    if (!prospect.statusHistory) {
      prospect.statusHistory = [
        {
          status: oldStatus || 'Sosialisasi',
          timestamp: prospect.createdAt || nowStr,
          updatedBy: prospect.createdBy || 'System',
          note: 'Status awal saat terdaftar'
        }
      ];
    }
    
    let customNote = `Melanjutkan ke proses ${status}`;
    if (status === 'Sosialisasi') customNote = 'Sosialisasi produk bjb dan pendekatan awal dengan nasabah';
    else if (status === 'Pemberkasan') customNote = 'Melengkapi berkas dokumen persyaratan pengajuan';
    else if (status === 'Analisa') customNote = 'Melakukan analisa data keuangan dan kelayakan';
    else if (status === 'Approval') customNote = 'Mengajukan persetujuan komite kredit / pimpinan';
    else if (status === 'Akad') customNote = 'Melaksanakan proses akad kredit / penempatan dana dan closing';
    else if (status === 'Batal') customNote = 'Prospek dibatalkan / tidak melanjutkan proses';
    else if (status === 'Ditolak') customNote = 'Prospek ditolak oleh komite kredit / pihak bank';

    prospect.statusHistory.push({
      status: status,
      timestamp: nowStr,
      updatedBy: user.name || user.username,
      note: customNote
    });
    
    await db.put(PROSPECTS_STORE, prospect);
    
    // Add to sync queue
    await db.add(SYNC_QUEUE_STORE, { prospectId: id, action: 'UPDATE' });
    
    // Log the action
    const detailString = `Mengubah status prospek ${prospect.name} dari ${oldStatus} menjadi ${status}.`;
    await writeLog('UPDATE_PROSPECT_STATUS', detailString);
  }
};

// ===============================================
// 📢 ONE-WAY MEMO & TARGET TIMELINE HELPERS
// ===============================================

export const getActiveMemo = (username = 'all') => {
  try {
    const memosStr = localStorage.getItem('bjb-memos-mapped');
    const memos = memosStr ? JSON.parse(memosStr) : {};
    
    // If requesting specific officer memo, return it. Fallback to 'all' memo if specific doesn't exist.
    if (username !== 'all' && memos[username]) {
      return memos[username];
    }
    
    return memos['all'] || {
      title: 'PENGUMUMAN RESMI BJB FIELD',
      content: 'Tingkatkan terus penetrasi produk Kredit & Funding di wilayah binaan Anda. Dorong nasabah potensial ke tahap Akad untuk pencapaian target maksimal kantor cabang.',
      updatedBy: 'Pimpinan Cabang Utama',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
    };
  } catch (e) {
    console.error('Failed to get active memo:', e);
    return null;
  }
};

export const saveActiveMemo = (title, content, senderName, recipient = 'all') => {
  try {
    const memosStr = localStorage.getItem('bjb-memos-mapped');
    const memos = memosStr ? JSON.parse(memosStr) : {};
    
    memos[recipient] = {
      title: title.toUpperCase(),
      content,
      updatedBy: senderName,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('bjb-memos-mapped', JSON.stringify(memos));
    writeLog('SEND_MEMO', `Mengirimkan memo khusus untuk ${recipient === 'all' ? 'Seluruh Sales' : recipient}: "${title}"`);
    return true;
  } catch (e) {
    console.error('Failed to save active memo:', e);
    return false;
  }
};

export const markMemoAsRead = (username, recipient = 'all') => {
  try {
    const memosStr = localStorage.getItem('bjb-memos-mapped');
    const memos = memosStr ? JSON.parse(memosStr) : {};
    
    // Check if user has specific memo or if it falls back to 'all'
    const key = memos[recipient] ? recipient : 'all';
    
    if (!memos[key]) {
      memos[key] = {
        title: 'PENGUMUMAN RESMI BJB FIELD',
        content: 'Tingkatkan terus penetrasi produk Kredit & Funding di wilayah binaan Anda. Dorong nasabah potensial ke tahap Akad untuk pencapaian target maksimal kantor cabang.',
        updatedBy: 'Pimpinan Cabang Utama',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
      };
    }
    
    if (!memos[key].readBy) {
      memos[key].readBy = [];
    }
    
    if (!memos[key].readBy.includes(username)) {
      memos[key].readBy.push(username);
      localStorage.setItem('bjb-memos-mapped', JSON.stringify(memos));
      writeLog('READ_MEMO', `Officer ${username} membaca memo "${memos[key].title}"`);
    }
    return true;
  } catch (e) {
    console.error('Failed to mark memo as read:', e);
    return false;
  }
};


export const getTimelineTargets = () => {
  try {
    const targetStr = localStorage.getItem('bjb-timeline-targets');
    return targetStr ? JSON.parse(targetStr) : {
      timeline: 'Juni 2026',
      targetKredit: 500000000,   // 500 Juta
      targetFunding: 1500000000  // 1.5 Miliar
    };
  } catch (e) {
    console.error('Failed to get timeline targets:', e);
    return null;
  }
};

export const saveTimelineTargets = (timeline, targetKredit, targetFunding) => {
  try {
    const targetData = {
      timeline,
      targetKredit: Number(targetKredit),
      targetFunding: Number(targetFunding)
    };
    localStorage.setItem('bjb-timeline-targets', JSON.stringify(targetData));
    writeLog('SET_TARGETS', `Mengubah target target baru untuk periode ${timeline} (Kredit: Rp ${targetKredit.toLocaleString('id-ID')}, Funding: Rp ${targetFunding.toLocaleString('id-ID')})`);
    return true;
  } catch (e) {
    console.error('Failed to save timeline targets:', e);
    return false;
  }
};

export const getTargetAlertSettings = () => {
  try {
    const alertStr = localStorage.getItem('bjb-target-alerts');
    return alertStr ? JSON.parse(alertStr) : {
      alertEnabled: true,
      alertThreshold: 70
    };
  } catch (e) {
    console.error('Failed to get target alert settings:', e);
    return { alertEnabled: true, alertThreshold: 70 };
  }
};

export const saveTargetAlertSettings = (alertEnabled, alertThreshold) => {
  try {
    const alertData = {
      alertEnabled: Boolean(alertEnabled),
      alertThreshold: Number(alertThreshold)
    };
    localStorage.setItem('bjb-target-alerts', JSON.stringify(alertData));
    writeLog('SET_TARGET_ALERTS', `Mengubah pengaturan alert target (Aktif: ${alertEnabled ? 'Ya' : 'Tidak'}, Batas: ${alertThreshold}%)`);
    return true;
  } catch (e) {
    console.error('Failed to save target alert settings:', e);
    return false;
  }
};


