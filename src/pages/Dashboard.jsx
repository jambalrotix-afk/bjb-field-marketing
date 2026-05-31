import React, { useEffect, useState, useRef } from 'react';
import { getAllProspects, updateProspectStatus, getActiveMemo, getTimelineTargets, markMemoAsRead } from '../services/db';
import { FileSpreadsheet, Eye, LayoutList, LayoutGrid, Heart } from '../components/Icons';

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

const getStatusBadgeClass = (status) => {
  const s = status ? status.toLowerCase() : 'sosialisasi';
  if (s === 'batal') return 'badge-batal';
  if (s === 'ditolak') return 'badge-ditolak';
  if (s === 'akad') return 'badge-akad';
  if (s === 'approval') return 'badge-approval';
  if (s === 'analisa') return 'badge-analisa';
  if (s === 'pemberkasan') return 'badge-pemberkasan';
  return 'badge-sosialisasi';
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
  
  // Mapping each status to a completely unique, highly distinct professional color
  const config = {
    cold: { label: 'Cold', color: '#0ea5e9' },                 // Sky Blue
    warm: { label: 'Warm', color: '#f97316' },                 // Orange
    hot: { label: 'Hot', color: '#f43f5e' },                   // Deep Pink/Rose
    sosialisasi: { label: 'Sosialisasi', color: '#a855f7' },   // Purple
    negosiasi: { label: 'Negosiasi', color: '#4f46e5' },       // Indigo Blue
    pemberkasan: { label: 'Pemberkasan', color: '#eab308' },   // Bright Yellow
    analisa: { label: 'Analisa', color: '#06b6d4' },           // Cyan/Teal
    approval: { label: 'Approval', color: '#84cc16' },         // Lime Green
    akad: { label: 'Akad', color: '#10b981' },                 // Emerald Green (Success!)
    ditolak: { label: 'Ditolak', color: '#ef4444' },           // Crimson Red
    batal: { label: 'Batal', color: '#64748b' }                // Slate Gray
  };
  
  const activeConfig = config[statusLower] || config.cold;
  
  return (
    <div 
      title={`Status: ${activeConfig.label}`} 
      style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: activeConfig.color,
        boxShadow: `0 0 0 3px ${activeConfig.color}20`,
        flexShrink: 0,
        margin: '0 8px 0 4px',
        display: 'inline-block',
        cursor: 'pointer',
        transition: 'all 0.15s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.25)';
        e.currentTarget.style.boxShadow = `0 0 0 5px ${activeConfig.color}35`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = `0 0 0 3px ${activeConfig.color}20`;
      }}
    />
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
  const lastTapRef = useRef(0);
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

  const handleMarkMemoAsRead = () => {
    if (user.role === 'Officer') {
      markMemoAsRead(user.username, user.username);
      const memo = getActiveMemo(user.username);
      setActiveMemo(memo);
      setToast({ show: true, message: 'Memo berhasil ditandai dibaca! ❤️', type: 'success' });
    }
  };

  const handleMemoDoubleClick = () => {
    if (user.role === 'Officer') {
      handleMarkMemoAsRead();
    }
  };

  const handleMemoTouchStart = () => {
    if (user.role !== 'Officer') return;
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      handleMarkMemoAsRead();
    }
    lastTapRef.current = now;
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
          <div 
            className="card" 
            onDoubleClick={handleMemoDoubleClick}
            onTouchStart={handleMemoTouchStart}
            title={user.role === 'Officer' ? "Klik 2x / double tap kartu ini untuk menandai dibaca" : ""}
            style={{ 
              padding: '1.15rem', 
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05), rgba(10, 46, 92, 0.04))', 
              border: '1.5px solid rgba(212, 175, 55, 0.25)', 
              marginBottom: 0,
              boxShadow: 'var(--shadow-sm)',
              cursor: user.role === 'Officer' ? 'pointer' : 'default',
              userSelect: 'none'
            }}
          >
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Love (Heart) Icon & Text */}
                {user.role === 'Officer' ? (
                  <button
                    type="button"
                    onClick={handleMarkMemoAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: (activeMemo.readBy && activeMemo.readBy.includes(user.username)) ? '#ef4444' : 'var(--text-muted)',
                      transition: 'transform 0.15s ease, color 0.15s ease',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.12)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Heart 
                      size={13} 
                      fill={(activeMemo.readBy && activeMemo.readBy.includes(user.username)) ? '#ef4444' : 'none'} 
                      color={(activeMemo.readBy && activeMemo.readBy.includes(user.username)) ? '#ef4444' : 'var(--text-muted)'} 
                    />
                    <span style={{ fontWeight: 700 }}>
                      {(activeMemo.readBy && activeMemo.readBy.includes(user.username)) ? 'Sudah Dibaca' : 'Tandai Dibaca'}
                    </span>
                  </button>
                ) : (
                  <div 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      color: (activeMemo.readBy && activeMemo.readBy.length > 0) ? '#ef4444' : 'var(--text-muted)',
                      cursor: 'help'
                    }}
                    title={activeMemo.readBy && activeMemo.readBy.length > 0 ? `Dibaca oleh: ${activeMemo.readBy.join(', ')}` : 'Belum dibaca oleh officer'}
                  >
                    <Heart 
                      size={13} 
                      fill={(activeMemo.readBy && activeMemo.readBy.length > 0) ? '#ef4444' : 'none'} 
                      color={(activeMemo.readBy && activeMemo.readBy.length > 0) ? '#ef4444' : 'var(--text-muted)'} 
                    />
                    <span style={{ fontWeight: 700 }}>
                      Dibaca {activeMemo.readBy ? activeMemo.readBy.length : 0} Officer
                    </span>
                  </div>
                )}
                <span>•</span>
                <span>{activeMemo.timestamp ? new Date(activeMemo.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : ''}</span>
              </div>
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
          <div className="tab-toggle" style={{ width: 'auto', height: '34px', padding: '2px', boxSizing: 'border-box', display: 'flex', alignItems: 'stretch' }}>
            <button
              onClick={() => setViewMode('table')}
              className={`tab-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              title="Tampilan List"
              style={{ height: '100%', padding: '0 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'calc(var(--radius) - 3px)' }}
            >
              <LayoutList size={14} />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`tab-toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
              title="Tampilan Kartu"
              style={{ height: '100%', padding: '0 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'calc(var(--radius) - 3px)' }}
            >
              <LayoutGrid size={14} />
              <span>Card</span>
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
              style={{ height: '34px', fontSize: '0.75rem' }}
            />
          </div>

          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="btn btn-outline" 
            style={{ height: '34px', padding: '0 0.75rem', fontSize: '0.75rem', width: 'auto', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', minHeight: 'auto', boxSizing: 'border-box' }}
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
                className="prospect-row"
                onClick={() => setSelectedProspect(p)}
                style={{
                  borderBottom: index < currentProspects.length - 1 ? '1px solid var(--border-light)' : 'none'
                }}
              >
                {/* Left: Name & Metas inline to look highly compact and perfectly aligned */}
                <div className="prospect-row-info">
                  {/* Column 1: Client Name & Badges */}
                  <div className="prospect-row-name-col">
                    <div className="prospect-row-name" title={p.name}>
                      {p.name}
                    </div>
                    {isToday(p.createdAt) && <span className="badge-new" title="Prospek Baru Ditambahkan Hari Ini" />}
                    {!p.synced && <span className="badge-offline">Offline</span>}
                  </div>
                  
                  {/* Column 2: Category (Kredit / Funding) - Fixed width for alignment */}
                  <div className="prospect-row-category-col">
                    <span className={`prospect-row-category ${p.category === 'Kredit' ? 'prospect-row-category-kredit' : 'prospect-row-category-funding'}`}>
                      {p.category}
                    </span>
                  </div>
                  
                  {/* Column 3: Nominal Value - Aligned perfectly */}
                  <div className="prospect-row-nominal-col">
                    <span className="prospect-row-nominal">
                      {formatRupiah(estimasi)}
                    </span>
                  </div>
                </div>

                {/* Right: Status Badge & small Detail Button */}
                <div className="prospect-row-actions" onClick={(e) => e.stopPropagation()}>
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
                  marginBottom: 0,
                  backgroundColor: '#ffffff', // Explicitly white background like data archive cards
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--bjb-blue-dark)' }}>
                      {p.name}
                    </div>
                    {isToday(p.createdAt) && <span className="badge-new" title="Prospek Baru Ditambahkan Hari Ini" />}
                    {!p.synced && <span className="badge-offline">Offline</span>}
                    {(p.status === 'Approval' || p.status === 'Akad') && <span className="badge-urgent">Perlu Tindakan</span>}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 600 }}>{p.category}</span>
                    <span>•</span>
                    <span style={{ color: 'var(--bjb-blue-light)', fontWeight: 700 }}>{formatRupiah(estimasi)}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Sales: {salesName}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                  <span className={`badge ${getStatusBadgeClass(p.status)}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 800 }}>
                    {p.status || 'Sosialisasi'}
                  </span>
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
