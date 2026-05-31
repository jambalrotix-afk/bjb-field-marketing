import React, { useEffect, useState } from 'react';
import { getAllProspects, updateProspectStatus } from '../services/db';
import { Folder, Users, TrendingUp, Ban, FileSpreadsheet, Search, Sliders, Eye, LayoutList, LayoutGrid, CreditCard, Banknote, Layers } from '../components/Icons';
import Toast from '../components/Toast';
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

const isToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
};

const renderStatusBadge = (status) => {
  const s = status ? status.trim() : 'Cold';
  const statusLower = s.toLowerCase();
  
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

const statusFilterOptions = [
  { value: 'All', label: 'Semua Status' },
  { value: 'Active', label: 'Prospek Aktif (Sosialisasi - Approval)' },
  { value: 'Akad', label: 'Klien Akad (Closing Sukses)' },
  { value: 'Batal', label: 'Dibatalkan / Tidak Lanjut' },
  { value: 'Ditolak', label: 'Ditolak Komite' }
];

const sortOptions = [
  { value: 'Newest', label: 'Terbaru Ditambahkan' },
  { value: 'Oldest', label: 'Terlama Ditambahkan' },
  { value: 'HighestNominal', label: 'Nominal Terbesar' },
  { value: 'Alphabetical', label: 'Nama Nasabah (A-Z)' }
];

const ClientDirectory = () => {
  const [user, setUser] = useState({ username: '', role: 'Officer', name: 'User' });
  const [prospects, setProspects] = useState([]);
  const [filteredProspects, setFilteredProspects] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All'); // 'All', 'Kredit', 'Funding'
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination & view modes
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedProspect, setSelectedProspect] = useState(null);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    success: 0,
    terminal: 0
  });

  const loadData = async () => {
    const storedUser = localStorage.getItem('user');
    let currentUser = { username: '', role: 'Officer', name: 'User' };
    if (storedUser) {
      currentUser = JSON.parse(storedUser);
      setUser(currentUser);
    }

    const data = await getAllProspects();
    
    // Role-based filtering
    const roleFiltered = (currentUser.role === 'Manager' || currentUser.role === 'Super Admin')
      ? data
      : data.filter(p => p.createdBy === currentUser.username);

    setProspects(roleFiltered);

    // Calculate metrics
    const activeStages = ['Sosialisasi', 'Pemberkasan', 'Analisa', 'Approval', 'Cold', 'Warm', 'Hot'];
    const s = { total: roleFiltered.length, active: 0, success: 0, terminal: 0 };
    roleFiltered.forEach(p => {
      if (p.status === 'Akad') {
        s.success++;
      } else if (p.status === 'Batal' || p.status === 'Ditolak') {
        s.terminal++;
      } else if (activeStages.includes(p.status)) {
        s.active++;
      } else {
        s.active++; // fallback
      }
    });
    setStats(s);
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

  const handleStatusChange = async (id, newStatus) => {
    await updateProspectStatus(id, newStatus);
    setToast({ show: true, message: `Status prospek/klien berhasil diubah menjadi ${newStatus}!`, type: 'success' });
    
    // Update local modal state immediately
    setSelectedProspect(prev => {
      if (prev && prev.id === id) {
        let customNote = `Melanjutkan ke proses ${newStatus}`;
        if (newStatus === 'Sosialisasi') customNote = 'Sosialisasi produk bjb dan pendekatan awal dengan nasabah';
        else if (newStatus === 'Pemberkasan') customNote = 'Melengkapi berkas dokumen persyaratan pengajuan';
        else if (newStatus === 'Analisa') customNote = 'Melakukan analisa data keuangan dan kelayakan';
        else if (newStatus === 'Approval') customNote = 'Mengajukan persetujuan komite kredit / pimpinan';
        else if (newStatus === 'Akad') customNote = 'Melaksanakan proses akad kredit / penempatan dana dan closing';
        else if (newStatus === 'Batal') customNote = 'Prospek dibatalkan / tidak melanjutkan proses';
        else if (newStatus === 'Ditolak') customNote = 'Prospek ditolak oleh komite kredit / pihak bank';

        return {
          ...prev,
          status: newStatus,
          statusHistory: [
            ...(prev.statusHistory || []),
            { status: newStatus, timestamp: new Date().toISOString(), updatedBy: user.name || user.username, note: customNote }
          ]
        };
      }
      return prev;
    });

    loadData();
    
    // Auto sync
    const { syncData } = await import('../services/syncService');
    await syncData();
    loadData();
  };

  // Filtering & Sorting Process
  useEffect(() => {
    let result = [...prospects];

    // Search Query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q)) ||
        (p.address && p.address.toLowerCase().includes(q))
      );
    }

    // Category Filter
    if (categoryFilter !== 'All') {
      result = result.filter(p => p.category === categoryFilter);
    }

    // Status Filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Active') {
        const activeStages = ['Sosialisasi', 'Pemberkasan', 'Analisa', 'Approval', 'Cold', 'Warm', 'Hot'];
        result = result.filter(p => p.status !== 'Akad' && p.status !== 'Batal' && p.status !== 'Ditolak');
      } else {
        result = result.filter(p => p.status === statusFilter);
      }
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'Newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'Oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'HighestNominal') {
        const valA = a.category === 'Kredit' ? (a.plafond || 0) : (a.penempatanDana || 0);
        const valB = b.category === 'Kredit' ? (b.plafond || 0) : (b.penempatanDana || 0);
        return valB - valA;
      }
      if (sortBy === 'Alphabetical') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });

    setFilteredProspects(result);
    setCurrentPage(1);
  }, [prospects, searchQuery, categoryFilter, statusFilter, sortBy]);

  // Pagination bounds
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProspects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProspects.length / itemsPerPage);

  // CSV Export Function
  const handleExportCSV = () => {
    if (filteredProspects.length === 0) {
      setToast({ show: true, message: 'Tidak ada data untuk diekspor!', type: 'error' });
      return;
    }

    const headers = ['Nama', 'Telepon/WA', 'Alamat', 'Kategori', 'Status', 'Nominal Estimasi (IDR)', 'Sales Marketing', 'Tanggal Terdaftar'];
    const rows = filteredProspects.map(p => {
      const estimasi = p.category === 'Kredit' ? p.plafond : p.penempatanDana;
      const salesName = p.createdBy === 'officer' ? 'Asep' : p.createdBy === 'officer_siti' ? 'Siti' : p.createdBy === 'officer_budi' ? 'Budi' : p.createdBy;
      return [
        p.name,
        p.phone,
        p.address.replace(/\n/g, ' '),
        p.category,
        p.status || 'Sosialisasi',
        estimasi,
        salesName,
        p.createdAt ? new Date(p.createdAt).toLocaleDateString('id-ID') : '-'
      ];
    });

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += [headers.join(','), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Arsip_Klien_Prospek_BJB_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <div className="main-content" style={{ paddingBottom: '90px' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2>Direktori Arsip & Klien</h2>
        {(user.role === 'Manager' || user.role === 'Super Admin') && (
          <button onClick={handleExportCSV} className="btn btn-primary flex items-center gap-2" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto' }}>
            <FileSpreadsheet size={16} />
            <span>Ekspor CSV</span>
          </button>
        )}
      </div>

      {/* Mini Metrics Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: 'var(--space-y)' }}>
        <div className="card card-metric" style={{ padding: '0.5rem', margin: 0, minHeight: '65px' }}>
          <Folder size={18} style={{ color: 'var(--bjb-blue)' }} />
          <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: '2px' }}>{stats.total}</div>
          <div style={{ fontSize: '0.6rem', fontWeight: 600 }} className="text-muted">Total</div>
        </div>
        <div className="card card-metric" style={{ padding: '0.5rem', margin: 0, minHeight: '65px' }}>
          <Users size={18} style={{ color: 'var(--status-hot)' }} />
          <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: '2px', color: 'var(--status-hot)' }}>{stats.success}</div>
          <div style={{ fontSize: '0.6rem', fontWeight: 600 }} className="text-muted">Akad</div>
        </div>
        <div className="card card-metric" style={{ padding: '0.5rem', margin: 0, minHeight: '65px' }}>
          <TrendingUp size={18} style={{ color: 'var(--status-warm)' }} />
          <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: '2px', color: 'var(--status-warm)' }}>{stats.active}</div>
          <div style={{ fontSize: '0.6rem', fontWeight: 600 }} className="text-muted">Berjalan</div>
        </div>
        <div className="card card-metric" style={{ padding: '0.5rem', margin: 0, minHeight: '65px' }}>
          <Ban size={18} style={{ color: '#b91c1c' }} />
          <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: '2px', color: '#b91c1c' }}>{stats.terminal}</div>
          <div style={{ fontSize: '0.6rem', fontWeight: 600 }} className="text-muted">Gagal/Batal</div>
        </div>
      </div>

      {/* Tab Category Selector */}
      <div className="tab-toggle" style={{ marginBottom: 'var(--space-y)' }}>
        <button
          onClick={() => setCategoryFilter('All')}
          className={`tab-toggle-btn ${categoryFilter === 'All' ? 'active' : ''}`}
        >
          <Layers size={15} />
          <span>Semua Kategori</span>
        </button>
        <button
          onClick={() => setCategoryFilter('Kredit')}
          className={`tab-toggle-btn ${categoryFilter === 'Kredit' ? 'active' : ''}`}
        >
          <CreditCard size={15} />
          <span>Kredit</span>
        </button>
        <button
          onClick={() => setCategoryFilter('Funding')}
          className={`tab-toggle-btn ${categoryFilter === 'Funding' ? 'active' : ''}`}
        >
          <Banknote size={15} />
          <span>Funding</span>
        </button>
      </div>

      {/* Search and Filters Toggle Panel */}
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-y)', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1rem', margin: 0 }}>Daftar Arsip ({filteredProspects.length})</h3>
        
        <div className="flex items-center gap-2" style={{ width: 'auto' }}>
          {/* List/Card Mode Toggle */}
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

          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="btn btn-outline" 
            style={{ height: '34px', padding: '0 0.75rem', fontSize: '0.75rem', width: 'auto', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', minHeight: 'auto', boxSizing: 'border-box' }}
          >
            <Sliders size={12} style={{ marginRight: '4px' }} />
            {showFilters ? 'Tutup Filter' : 'Cari & Filter'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card card-filter" style={{ position: 'relative', zIndex: 40, padding: '1rem' }}>
          <div className="form-group" style={{ marginBottom: '0.75rem', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Cari nama nasabah, telepon, alamat..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.88rem', height: '44px', paddingLeft: '2.2rem', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Pilih Status</span>
              <CustomSelect 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                options={statusFilterOptions}
                style={{ height: '36px', fontSize: '0.8rem' }}
              />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Urutkan Data</span>
              <CustomSelect 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                options={sortOptions}
                style={{ height: '36px', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Baris per Halaman</span>
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
                style={{ height: '36px', fontSize: '0.8rem' }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('All');
                  setStatusFilter('All');
                  setSortBy('Newest');
                  setItemsPerPage(10);
                }} 
                className="btn btn-secondary" 
                style={{ fontSize: '0.75rem', height: '36px', width: '100%', padding: 0 }}
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Directory Contents */}
      {filteredProspects.length === 0 ? (
        <div className="card text-center text-muted" style={{ padding: '2.5rem' }}>
          Data prospek / klien tidak ditemukan.
        </div>
      ) : viewMode === 'table' ? (
        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {currentItems.map((p, index) => {
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
                  borderBottom: index < currentItems.length - 1 ? '1px solid var(--border-light)' : 'none',
                  gap: '0.75rem',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {/* Left: Name & Metas inline to look highly compact and perfectly aligned */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                  {/* Column 1: Client Name & Badges */}
                  <div style={{ flex: '1 1 0%', minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div 
                      style={{ 
                        fontWeight: 700, 
                        fontSize: '0.82rem', 
                        color: 'var(--bjb-blue-dark)', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap'
                      }}
                      title={p.name}
                    >
                      {p.name}
                    </div>
                    {isToday(p.createdAt) && <span className="badge-new" title="Prospek Baru Ditambahkan Hari Ini" />}
                    {!p.synced && <span className="badge-offline">Offline</span>}
                  </div>
                  
                  {/* Column 2: Category (Kredit / Funding) - Fixed width for alignment */}
                  <div style={{ width: '65px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    <span 
                      style={{ 
                        fontWeight: 700, 
                        padding: '0.1rem 0.35rem', 
                        backgroundColor: p.category === 'Kredit' ? '#eff6ff' : '#f0fdf4', 
                        color: p.category === 'Kredit' ? '#1d4ed8' : '#15803d',
                        border: p.category === 'Kredit' ? '1px solid #bfdbfe' : '1px solid #bbf7d0',
                        borderRadius: '4px', 
                        fontSize: '0.68rem',
                        display: 'inline-block',
                        textAlign: 'center',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      {p.category}
                    </span>
                  </div>
                  
                  {/* Column 3: Nominal Value - Aligned perfectly */}
                  <div style={{ width: '120px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    <span 
                      style={{ 
                        color: 'var(--bjb-blue-light)', 
                        fontWeight: 800, 
                        fontSize: '0.82rem',
                        fontFamily: 'Outfit, sans-serif'
                      }}
                    >
                      {formatRupiah(estimasi)}
                    </span>
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
          {currentItems.map(p => {
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
                  backgroundColor: '#ffffff', // Explicitly white background!
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

export default ClientDirectory;
