import React, { useEffect, useState } from 'react';
import { getAllProspects, updateProspectStatus, getActiveMemo, getTimelineTargets } from '../services/db';
import { FileSpreadsheet, Eye } from '../components/Icons';

import Toast from '../components/Toast';
import GreetingModal from '../components/GreetingModal';
import CustomSelect from '../components/CustomSelect';
import ProspectDetailModal from '../components/ProspectDetailModal';



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

// Check if a date string is from today
const isToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
};

const statusFilterOptions = [
  { value: 'All', label: 'Semua Status' },
  { value: 'Cold', label: 'Sosialisasi (Cold)' },
  { value: 'Warm', label: 'Pemberkasan / Analisa (Warm)' },
  { value: 'Hot', label: 'Approval / Akad (Hot)' }
];

const categoryFilterOptions = [
  { value: 'All', label: 'Semua Kategori' },
  { value: 'Kredit', label: 'Kredit' },
  { value: 'Funding', label: 'Funding' }
];

const renderStatusBadge = (status) => {
  const s = status ? status.trim() : 'Cold';
  const statusLower = s.toLowerCase();
  
  // Mapping status to details with professional SVG icons and premium colors
  const config = {
    cold: {
      label: 'Cold',
      color: '#0284c7', // Sky Blue
      bg: '#e0f2fe',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
      )
    },
    warm: {
      label: 'Warm',
      color: '#ea580c', // Orange
      bg: '#ffedd5',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          <circle cx="12" cy="12" r="4"/>
        </svg>
      )
    },
    hot: {
      label: 'Hot',
      color: '#dc2626', // Red
      bg: '#fee2e2',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
      )
    },
    sosialisasi: {
      label: 'Sosialisasi',
      color: '#0d9488', // Teal
      bg: '#f0fdfa',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      )
    },
    negosiasi: {
      label: 'Negosiasi',
      color: '#4f46e5', // Indigo
      bg: '#e0e7ff',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      )
    },
    pemberkasan: {
      label: 'Pemberkasan',
      color: '#d97706', // Amber
      bg: '#fef3c7',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      )
    },
    analisa: {
      label: 'Analisa',
      color: '#2563eb', // Royal Blue
      bg: '#dbeafe',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      )
    },
    approval: {
      label: 'Approval',
      color: '#16a34a', // Emerald Green
      bg: '#dcfce7',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      )
    },
    akad: {
      label: 'Akad',
      color: '#15803d', // Dark Green
      bg: '#dcfce7',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9 11 11 13 15 9"/>
        </svg>
      )
    },
    ditolak: {
      label: 'Ditolak',
      color: '#b91c1c', // Crimson Red
      bg: '#fee2e2',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      )
    },
    batal: {
      label: 'Batal',
      color: '#475569', // Slate Gray
      bg: '#f1f5f9',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      )
    }
  };
  
  const activeConfig = config[statusLower] || config.cold;
  
  return (
    <div 
      title={`Status: ${activeConfig.label}`} 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        backgroundColor: activeConfig.bg,
        color: activeConfig.color,
        border: `1px solid rgba(0, 0, 0, 0.08)`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        flexShrink: 0,
        transition: 'all 0.2s ease',
        cursor: 'default'
      }}
    >
      {activeConfig.icon}
    </div>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState({ username: '', role: 'Officer', name: 'User' });

  const [prospects, setProspects] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isGreetingOpen, setIsGreetingOpen] = useState(false);

  const [filteredProspects, setFilteredProspects] = useState([]);
  const [stats, setStats] = useState({ total: 0, synced: 0, offline: 0, cold: 0, warm: 0, hot: 0 });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Memo & Targets State
  const [activeMemo, setActiveMemo] = useState(null);
  const [timelineTargets, setTimelineTargets] = useState({
    timeline: 'Juni 2026',
    targetKredit: 500000000,
    targetFunding: 1500000000
  });

  // Search & Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Pagination & Layout State
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Selected Prospect State for Detail Modal
  const [selectedProspect, setSelectedProspect] = useState(null);

  const loadData = async () => {
    const storedUser = localStorage.getItem('user');
    let currentUser = { username: '', role: 'Officer', name: 'User' };
    if (storedUser) {
      currentUser = JSON.parse(storedUser);
      setUser(currentUser);
      
      // Show greeting modal if not already greeted in this session
      const hasGreeted = sessionStorage.getItem('has_greeted');
      if (!hasGreeted) {
        setIsGreetingOpen(true);
        sessionStorage.setItem('has_greeted', 'true');
      }
    }

    const memo = getActiveMemo(currentUser.username);
    setActiveMemo(memo);
    const targets = getTimelineTargets();
    setTimelineTargets(targets);

    const data = await getAllProspects();
    
    // Role-based filtering
    const roleFiltered = (currentUser.role === 'Manager' || currentUser.role === 'Super Admin') 
      ? data 
      : data.filter(p => p.createdBy === currentUser.username);
    
    setProspects(roleFiltered);
    
    // Calculate stats
    const st = { total: roleFiltered.length, synced: 0, offline: 0, cold: 0, warm: 0, hot: 0 };
    roleFiltered.forEach(p => {
      if (p.synced) st.synced++; else st.offline++;
      if (p.status === 'Sosialisasi' || p.status === 'Cold') st.cold++;
      else if (p.status === 'Pemberkasan' || p.status === 'Analisa' || p.status === 'Warm') st.warm++;
      else if (p.status === 'Approval' || p.status === 'Akad' || p.status === 'Hot') st.hot++;
    });
    setStats(st);
  };

  const handleStatusChange = async (id, newStatus) => {
    await updateProspectStatus(id, newStatus);
    setToast({ show: true, message: `Status prospek berhasil diubah menjadi ${newStatus}!`, type: 'success' });
    
    // Custom note based on new status
    let customNote = `Melanjutkan ke proses ${newStatus}`;
    if (newStatus === 'Sosialisasi') customNote = 'Sosialisasi produk bjb dan pendekatan awal dengan nasabah';
    else if (newStatus === 'Pemberkasan') customNote = 'Melengkapi berkas dokumen persyaratan pengajuan';
    else if (newStatus === 'Analisa') customNote = 'Melakukan analisa data keuangan dan kelayakan';
    else if (newStatus === 'Approval') customNote = 'Mengajukan persetujuan komite kredit / pimpinan';
    else if (newStatus === 'Akad') customNote = 'Melaksanakan proses akad kredit / penempatan dana dan closing';

    // Update local modal data state immediately so the popup shows the new status and timeline instantly!
    setSelectedProspect(prev => prev && prev.id === id ? { 
      ...prev, 
      status: newStatus, 
      statusHistory: [
        ...(prev.statusHistory || [
          { status: prev.status || 'Sosialisasi', timestamp: prev.createdAt, updatedBy: 'Sales Lapangan', note: 'Pertemuan pertama & prospek terdaftar' }
        ]),
        { status: newStatus, timestamp: new Date().toISOString(), updatedBy: user.name || user.username, note: customNote }
      ]
    } : prev);

    loadData();
    
    // Automatically trigger sync if online
    const { syncData } = await import('../services/syncService');
    await syncData();
    loadData();
  };

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('focus', loadData);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  // Filter prospects & Reset page
  useEffect(() => {
    let result = prospects;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.phone && p.phone.includes(query)) ||
        (p.address && p.address.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(p => {
        if (statusFilter === 'Cold') return p.status === 'Sosialisasi' || p.status === 'Cold';
        if (statusFilter === 'Warm') return p.status === 'Pemberkasan' || p.status === 'Analisa' || p.status === 'Warm';
        if (statusFilter === 'Hot') return p.status === 'Approval' || p.status === 'Akad' || p.status === 'Hot';
        return p.status === statusFilter;
      });
    }

    if (categoryFilter !== 'All') {
      result = result.filter(p => p.category === categoryFilter);
    }

    setFilteredProspects(result);
    setCurrentPage(1);
  }, [prospects, searchQuery, statusFilter, categoryFilter]);

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const reversedProspects = [...filteredProspects].reverse();
  const currentProspects = reversedProspects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProspects.length / itemsPerPage);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredProspects.length === 0) {
      setToast({ show: true, message: 'Tidak ada data prospek untuk diekspor!', type: 'error' });
      return;
    }

    const headers = ['Nama', 'Telepon/WA', 'Alamat', 'Lokasi GPS', 'Kategori', 'Detail Kebutuhan', 'Estimasi (IDR)', 'Status', 'Catatan', 'Tanggal Dibuat', 'Sales'];
    const rows = filteredProspects.map(p => {
      const detail = p.category === 'Kredit' 
        ? `Tujuan: ${p.tujuanKredit || '-'}, Agunan: ${p.agunan || '-'}` 
        : `Produk: ${p.produkFunding || '-'}, Sumber: ${p.sumberDana || '-'}`;
      const estimasi = p.category === 'Kredit' ? p.plafond : p.penempatanDana;
      return [
        p.name,
        p.phone,
        p.address.replace(/\n/g, ' '),
        p.location || '-',
        p.category,
        detail,
        estimasi,
        p.status,
        p.catatan.replace(/\n/g, ' '),
        p.createdAt ? new Date(p.createdAt).toISOString() : '-',
        p.createdBy || 'unknown'
      ];
    });
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += [headers.join(','), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Pipeline_bjb_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const achievedKredit = prospects
    .filter(p => p.category === 'Kredit' && p.status === 'Akad')
    .reduce((sum, p) => sum + (p.plafond || 0), 0);
  const achievedFunding = prospects
    .filter(p => p.category === 'Funding' && p.status === 'Akad')
    .reduce((sum, p) => sum + (p.penempatanDana || 0), 0);

  const pctKredit = timelineTargets.targetKredit > 0 ? Math.round((achievedKredit / timelineTargets.targetKredit) * 100) : 0;
  const pctFunding = timelineTargets.targetFunding > 0 ? Math.round((achievedFunding / timelineTargets.targetFunding) * 100) : 0;

  return (
    <div className="main-content">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-4">
        <h2>Daftar Prospek</h2>
        {(user.role === 'Manager' || user.role === 'Super Admin') && (
          <button onClick={handleExportCSV} className="btn btn-primary flex items-center gap-2" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto' }}>
            <FileSpreadsheet size={16} />
            <span>Ekspor CSV</span>
          </button>
        )}
      </div>

      {/* 📢 ONE-WAY BROADCAST MEMO & TARGET TIMELINE PANEL */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-y)', marginBottom: 'var(--space-y)' }}>
        
        {/* Active Memo Broadcast Card */}
        {activeMemo && activeMemo.content && (
          <div className="card" style={{ 
            padding: '1.15rem', 
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05), rgba(10, 46, 92, 0.04))', 
            border: '1.5px solid rgba(212, 175, 55, 0.25)', 
            marginBottom: 0,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>📢</span>
              <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--bjb-blue-dark)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 800 }}>
                {activeMemo.title}
              </h4>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.45, fontStyle: 'italic', fontWeight: 500 }}>
              "{activeMemo.content}"
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              <span>Pengirim: <strong>{activeMemo.updatedBy}</strong></span>
              <span>{activeMemo.timestamp ? new Date(activeMemo.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : ''}</span>
            </div>
          </div>
        )}

        {/* Dynamic Officer Target Timeline Card */}
        {user.role === 'Officer' && (
          <div className="card" style={{ 
            padding: '1.15rem', 
            background: 'linear-gradient(135deg, var(--bjb-blue), var(--bjb-blue-dark))', 
            color: 'white',
            border: 'none',
            marginBottom: 0,
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.2rem' }}>🎯</span>
                <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--bjb-gold-light)', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                  Target Capaian Periode: {timelineTargets.timeline}
                </h4>
              </div>
              <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', fontSize: '0.65rem', fontWeight: 700 }}>
                Target bjb
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Kredit Target */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px', fontWeight: 600 }}>
                  <span style={{ opacity: 0.9 }}>Kredit (Akad): {formatRupiah(achievedKredit)} / {formatRupiah(timelineTargets.targetKredit)}</span>
                  <span style={{ color: 'var(--bjb-gold-light)' }}>{pctKredit}%</span>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ backgroundColor: 'var(--bjb-gold)', width: `${Math.min(pctKredit, 100)}%`, height: '100%' }} />
                </div>
              </div>

              {/* Funding Target */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px', fontWeight: 600 }}>
                  <span style={{ opacity: 0.9 }}>Funding (Akad): {formatRupiah(achievedFunding)} / {formatRupiah(timelineTargets.targetFunding)}</span>
                  <span style={{ color: '#34d399' }}>{pctFunding}%</span>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ backgroundColor: '#10B981', width: `${Math.min(pctFunding, 100)}%`, height: '100%' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mini Metrics Cards */}
      <div className="flex gap-2" style={{ marginBottom: 'var(--space-y)' }}>
        <div className="card card-metric">
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stats.total}</div>
          <div style={{ fontSize: '0.75rem' }} className="text-muted">Prospek</div>
        </div>
        <div className="card card-metric">
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--status-hot)' }}>{stats.synced}</div>
          <div style={{ fontSize: '0.75rem' }} className="text-muted">Synced</div>
        </div>
        <div className="card card-metric">
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--status-cold)' }}>{stats.offline}</div>
          <div style={{ fontSize: '0.75rem' }} className="text-muted">Offline</div>
        </div>
      </div>

      {/* Pipeline Status Counters */}
      <div className="card" style={{ padding: '0.75rem 1rem' }}>
        <div className="flex justify-between items-center" style={{ gap: '1rem' }}>
          <div className="text-center" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
            <span style={{ color: 'var(--status-cold)', fontWeight: 800, fontSize: '1.25rem' }}>{stats.cold}</span>
            <span className="text-sm text-muted" style={{ fontWeight: 600 }}>Cold</span>
          </div>
          <div className="text-center" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
            <span style={{ color: 'var(--status-warm)', fontWeight: 800, fontSize: '1.25rem' }}>{stats.warm}</span>
            <span className="text-sm text-muted" style={{ fontWeight: 600 }}>Warm</span>
          </div>
          <div className="text-center" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
            <span style={{ color: 'var(--status-hot)', fontWeight: 800, fontSize: '1.25rem' }}>{stats.hot}</span>
            <span className="text-sm text-muted" style={{ fontWeight: 600 }}>Hot</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Toggle */}
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-y)', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Prospek Terbaru ({filteredProspects.length})</h3>
        
        <div className="flex items-center gap-2" style={{ width: 'auto' }}>
          {/* View Mode Toggle */}
          <div className="tab-toggle" style={{ width: 'auto' }}>
            <button
              onClick={() => setViewMode('table')}
              className={`tab-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              title="Tampilan List"
            >
              List
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`tab-toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
              title="Tampilan Kartu"
            >
              Card
            </button>
          </div>

          {/* Items Per Page Selector */}
          <div style={{ width: '100px' }}>
            <CustomSelect
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              options={[
                { value: 5, label: '5 baris' },
                { value: 10, label: '10 baris' },
                { value: 20, label: '20 baris' },
                { value: 50, label: '50 baris' }
              ]}
              style={{ height: '32px', fontSize: '0.75rem' }}
            />
          </div>

          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="btn btn-outline" 
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', width: 'auto', fontWeight: 'bold', minHeight: '32px' }}
          >
            {showFilters ? 'Tutup Filter' : 'Cari & Filter'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card card-filter" style={{ position: 'relative', zIndex: 40 }}>
          <div className="form-group" style={{ marginBottom: 'var(--space-y)', position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Cari nama, telepon, alamat..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.95rem', height: '46px', boxSizing: 'border-box' }}
            />
          </div>

          <div className="flex gap-2">
            <div style={{ flex: 1 }}>
              <CustomSelect 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                options={statusFilterOptions}
              />
            </div>
            <div style={{ flex: 1 }}>
              <CustomSelect 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)} 
                options={categoryFilterOptions}
              />
            </div>
          </div>

        </div>
      )}

      {/* Prospects List / Table */}
      {filteredProspects.length === 0 ? (
        <div className="card text-center text-muted" style={{ padding: '2rem' }}>Belum ada prospek yang terdaftar.</div>
      ) : viewMode === 'table' ? (
        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {currentProspects.map((p, index) => {
            const estimasi = p.category === 'Kredit' ? p.plafond : p.penempatanDana;
            const salesName = p.createdBy === 'officer' ? 'Asep' : p.createdBy === 'officer_siti' ? 'Siti' : p.createdBy === 'officer_budi' ? 'Budi' : p.createdBy;
            
            return (
              <div 
                key={p.id} 
                className="clickable"
                onClick={() => setSelectedProspect(p)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.45rem 0.85rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  borderBottom: index < currentProspects.length - 1 ? '1px solid var(--border-light)' : 'none',
                  gap: '0.75rem',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {/* Left: Name & Metas inline to look highly compact */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: '120px', flex: '1 0 120px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--bjb-blue-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </div>
                    {isToday(p.createdAt) && <span className="badge-new">Baru</span>}
                    {!p.synced && <span className="badge-offline">Offline</span>}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, padding: '0.1rem 0.35rem', backgroundColor: 'var(--border-light)', borderRadius: '4px', fontSize: '0.68rem', color: 'var(--text-main)' }}>{p.category}</span>
                    <span style={{ color: 'var(--bjb-blue-light)', fontWeight: 800 }}>{formatRupiah(estimasi)}</span>
                    {(user.role === 'Manager' || user.role === 'Super Admin') && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>• Sales: {salesName}</span>
                    )}
                  </div>
                </div>

                {/* Right: Status Badge & small Detail Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  {renderStatusBadge(p.status)}
                  <button 
                    type="button"
                    className="btn btn-outline" 
                    style={{ padding: '0.2rem 0.45rem', fontSize: '0.68rem', width: 'auto', minHeight: 'auto', margin: 0, fontWeight: 700, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setSelectedProspect(p)}
                    title="Detail"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
          {currentProspects.map(p => {
            const estimasi = p.category === 'Kredit' ? p.plafond : p.penempatanDana;
            const salesName = p.createdBy === 'officer' ? 'Asep' : p.createdBy === 'officer_siti' ? 'Siti' : p.createdBy === 'officer_budi' ? 'Budi' : p.createdBy;

            return (
              <div 
                key={p.id} 
                className="card card-prospect clickable"
                onClick={() => setSelectedProspect(p)}
                style={{ 
                  cursor: 'pointer', 
                  transition: 'all 0.2s', 
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: 0
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--bjb-blue-dark)' }}>
                      {p.name}
                    </div>
                    {isToday(p.createdAt) && <span className="badge-new">Baru</span>}
                    {!p.synced && <span className="badge-offline">Offline</span>}
                    {(p.status === 'Approval' || p.status === 'Akad') && <span className="badge-urgent">Perlu Tindakan</span>}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{p.category}</span>
                    <span>•</span>
                    <span style={{ color: 'var(--bjb-blue-light)', fontWeight: 700 }}>{formatRupiah(estimasi)}</span>
                    {(user.role === 'Manager' || user.role === 'Super Admin') && (
                      <>
                        <span>•</span>
                        <span>Sales: {salesName}</span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                  {renderStatusBadge(p.status)}
                  <button 
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', width: 'auto', minHeight: 'auto', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setSelectedProspect(p)}
                    title="Detail"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {filteredProspects.length > itemsPerPage && (
        <div className="flex justify-between items-center" style={{ marginTop: 'var(--space-y)', padding: '0.5rem 0', borderTop: 'var(--border-width) solid var(--border)' }}>
          <button 
            type="button" 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="btn btn-outline"
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            Sebelumnya
          </button>
          <span className="text-sm font-semibold">
            Halaman {currentPage} dari {totalPages || 1}
          </span>
          <button 
            type="button" 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="btn btn-outline"
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            Berikutnya
          </button>
        </div>
      )}

      <Toast 
        isOpen={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />

      <GreetingModal
        isOpen={isGreetingOpen}
        userName={user.name}
        userRole={user.role}
        onClose={() => setIsGreetingOpen(false)}
      />

      <ProspectDetailModal
        isOpen={selectedProspect !== null}
        onClose={() => setSelectedProspect(null)}
        prospect={selectedProspect}
        isOnline={isOnline}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default Dashboard;
