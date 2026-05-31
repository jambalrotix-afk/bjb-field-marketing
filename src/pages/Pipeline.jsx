import React, { useEffect, useState } from 'react';
import { getAllProspects, updateProspectStatus } from '../services/db';
import { ChevronLeft, ChevronRight, Eye } from '../components/Icons';
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

const Pipeline = () => {
  const [user, setUser] = useState({ username: '', role: 'Officer', name: 'User' });
  const [prospects, setProspects] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Kredit'); // 'Kredit' or 'Funding'
  const [activeStage, setActiveStage] = useState('Sosialisasi'); // For mobile stage switching
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState('All');
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [visibleCounts, setVisibleCounts] = useState({ Sosialisasi: 10, Pemberkasan: 10, Analisa: 10, Approval: 10, Akad: 10 });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Marketing list for filtering
  const [officerOptions, setOfficerOptions] = useState([{ value: 'All', label: 'Semua Marketing' }]);

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

    // Extract list of officers for manager filter
    if (currentUser.role === 'Manager' || currentUser.role === 'Super Admin') {
      const storedUsers = localStorage.getItem('bjb-users');
      if (storedUsers) {
        const uList = JSON.parse(storedUsers);
        const marketingList = uList
          .filter(u => u.role === 'Officer')
          .map(u => ({ value: u.username, label: u.name }));
        setOfficerOptions([{ value: 'All', label: 'Semua Marketing' }, ...marketingList]);
      } else {
        // Fallback options
        const creators = [...new Set(data.map(p => p.createdBy))].filter(Boolean);
        const mapped = creators.map(c => {
          const label = c === 'officer' ? 'Asep Marketing' : c === 'officer_siti' ? 'Siti Funding' : c === 'officer_budi' ? 'Budi Kredit' : c;
          return { value: c, label };
        });
        setOfficerOptions([{ value: 'All', label: 'Semua Marketing' }, ...mapped]);
      }
    }
  };

  useEffect(() => {
    loadData();
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const normalizeStatus = (status) => {
    if (status === 'Cold') return 'Sosialisasi';
    if (status === 'Warm') return 'Pemberkasan';
    if (status === 'Hot') return 'Approval';
    return status || 'Sosialisasi';
  };

  const handleQuickMove = async (id, currentStatus, direction) => {
    const stageOrder = ['Sosialisasi', 'Pemberkasan', 'Analisa', 'Approval', 'Akad'];
    const normalized = normalizeStatus(currentStatus);
    const currentIndex = stageOrder.indexOf(normalized);
    let newStatus = normalized;
    
    if (direction === 'forward') {
      if (currentIndex < stageOrder.length - 1) {
        newStatus = stageOrder[currentIndex + 1];
      }
    } else if (direction === 'back') {
      if (currentIndex > 0) {
        newStatus = stageOrder[currentIndex - 1];
      }
    }

    if (newStatus !== currentStatus) {
      await updateProspectStatus(id, newStatus);
      setToast({ show: true, message: `Status prospek berhasil dipindahkan ke ${newStatus}!`, type: 'success' });
      loadData();

      // Automatically trigger sync if online
      const { syncData } = await import('../services/syncService');
      await syncData();
      loadData();
    }
  };

  // Filter and group prospects
  const filtered = prospects.filter(p => {
    // Category match (Kredit vs Funding)
    if (p.category !== activeCategory) return false;

    // Search query match
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name && p.name.toLowerCase().includes(q);
      const matchPhone = p.phone && p.phone.includes(q);
      const matchAddress = p.address && p.address.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchAddress) return false;
    }

    // Officer filter match
    if (selectedOfficer !== 'All' && p.createdBy !== selectedOfficer) return false;

    return true;
  });

  // Grouped by stage
  const getStageProspects = (stage) => filtered.filter(p => normalizeStatus(p.status) === stage);

  const stages = [
    { key: 'Sosialisasi', title: 'Sosialisasi' },
    { key: 'Pemberkasan', title: 'Pemberkasan' },
    { key: 'Analisa', title: 'Analisa' },
    { key: 'Approval', title: 'Approval' },
    { key: 'Akad', title: 'Akad' }
  ];

  return (
    <div className="main-content" style={{ paddingBottom: '90px' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2>Pipeline Prospek</h2>
      </div>

      {/* Business Process Tab Selector (Kredit vs Funding) */}
      <div className="tab-toggle" style={{ marginBottom: 'var(--space-y)' }}>
        <button
          onClick={() => {
            setActiveCategory('Kredit');
            setSelectedProspect(null);
            setVisibleCounts({ Sosialisasi: 10, Pemberkasan: 10, Analisa: 10, Approval: 10, Akad: 10 });
          }}
          className={`tab-toggle-btn ${activeCategory === 'Kredit' ? 'active' : ''}`}
        >
          Kredit (Pembiayaan)
        </button>
        <button
          onClick={() => {
            setActiveCategory('Funding');
            setSelectedProspect(null);
            setVisibleCounts({ Sosialisasi: 10, Pemberkasan: 10, Analisa: 10, Approval: 10, Akad: 10 });
          }}
          className={`tab-toggle-btn ${activeCategory === 'Funding' ? 'active' : ''}`}
        >
          Funding (Dana)
        </button>
      </div>

      {/* Search & Marketing Officer Filter Panel */}
      <div className="card" style={{ padding: '1rem', marginBottom: 'var(--space-y)', position: 'relative', zIndex: 40 }}>
        <div style={{ position: 'relative', marginBottom: (user.role === 'Manager' || user.role === 'Super Admin') ? '0.75rem' : '0' }}>
          <input
            type="text"
            placeholder="Cari prospek..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ fontSize: '0.9rem', height: '46px', boxSizing: 'border-box' }}
          />
        </div>

        {(user.role === 'Manager' || user.role === 'Super Admin') && (
          <div>
            <CustomSelect
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              options={officerOptions}
              placeholder="Pilih Marketing..."
            />
          </div>
        )}
      </div>

      {/* Stepper Timeline Progress Tracker */}
      <div className="pipeline-timeline-stepper">
        <div className="timeline-progress-line">
          <div className="timeline-progress-fill" style={{ 
            width: (() => {
              const idx = ['Sosialisasi', 'Pemberkasan', 'Analisa', 'Approval', 'Akad'].indexOf(activeStage);
              return idx === -1 ? '0%' : `${(idx / 4) * 100}%`;
            })()
          }} />
        </div>
        
        {stages.map((st, idx) => {
          const count = getStageProspects(st.key).length;
          const isActive = activeStage === st.key;
          const stageOrder = ['Sosialisasi', 'Pemberkasan', 'Analisa', 'Approval', 'Akad'];
          const isCompleted = stageOrder.indexOf(st.key) < stageOrder.indexOf(activeStage);
          
          const getStageColor = (key) => {
            if (key === 'Sosialisasi') return 'var(--status-cold)';
            if (key === 'Pemberkasan' || key === 'Analisa') return 'var(--status-warm)';
            return 'var(--status-hot)';
          };
          const getStageBgColor = (key) => {
            if (key === 'Sosialisasi') return 'var(--status-cold-bg)';
            if (key === 'Pemberkasan' || key === 'Analisa') return 'var(--status-warm-bg)';
            return 'var(--status-hot-bg)';
          };
          
          const stageColor = getStageColor(st.key);
          const stageBg = getStageBgColor(st.key);
          
          return (
            <div 
              key={st.key} 
              className={`timeline-step-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              onClick={() => {
                setActiveStage(st.key);
                setSelectedProspect(null);
                
                // Scroll the corresponding column into view on mobile screens smoothly!
                const colElement = document.getElementById(`column-${st.key}`);
                if (colElement) {
                  colElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
              }}
            >
              <div className="step-circle-wrapper">
                <div className="step-circle-glow" style={{
                  backgroundColor: stageColor,
                  opacity: isActive ? 0.25 : 0,
                  transform: isActive ? 'scale(1.4)' : 'scale(1)',
                  transition: 'all 0.3s ease'
                }} />
                <div 
                  className="step-circle"
                  style={{
                    borderColor: isActive ? stageColor : isCompleted ? stageColor : 'var(--border)',
                    backgroundColor: isActive ? stageColor : isCompleted ? stageBg : 'var(--surface)',
                    color: isActive ? 'white' : isCompleted ? stageColor : 'var(--text-muted)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {idx + 1}
                </div>
              </div>
              <div className="step-label">
                <span className="step-title" style={{
                  color: isActive ? 'var(--bjb-blue-dark)' : isCompleted ? stageColor : 'var(--text-muted)',
                  fontWeight: isActive ? 800 : 600,
                  transition: 'color 0.3s ease'
                }}>{st.title}</span>
                <span className="step-count" style={{
                  color: isActive ? 'var(--bjb-blue-light)' : isCompleted ? stageColor : 'var(--text-muted)',
                  transition: 'color 0.3s ease'
                }}>{count} prospek</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div 
        className="pipeline-board"
        onScroll={(e) => {
          if (window.innerWidth >= 768) return;
          const scrollLeft = e.currentTarget.scrollLeft;
          const width = e.currentTarget.offsetWidth;
          const colIndex = Math.round(scrollLeft / (width - 20)); // Adjust slightly for mobile gaps
          const newStage = stages[colIndex]?.key;
          if (newStage && newStage !== activeStage) {
            setActiveStage(newStage);
          }
        }}
      >
        {stages.map(stage => {
          const list = getStageProspects(stage.key);
          const statusLower = stage.key.toLowerCase();
          
          return (
            <div 
              key={stage.key} 
              id={`column-${stage.key}`}
              className={`pipeline-column pipeline-column-${statusLower}`}
            >
              {/* Column Header */}
              <div className="pipeline-column-header">
                <div className="pipeline-column-title">
                  <span>{stage.title}</span>
                </div>
                <span className="pipeline-column-count">{list.length}</span>
              </div>

              {/* Column Cards */}
              <div className="pipeline-cards-container">
                {list.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border)', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    Tidak ada prospek
                  </div>
                ) : (
                  <>
                    {list.slice(0, visibleCounts[stage.key]).map(p => {
                      const estimasi = p.category === 'Kredit' ? p.plafond : p.penempatanDana;
                      const salesName = p.createdBy === 'officer' ? 'Asep' : p.createdBy === 'officer_siti' ? 'Siti' : p.createdBy === 'officer_budi' ? 'Budi' : p.createdBy;
                      
                      return (
                        <div key={p.id} className={`pipeline-card pipeline-card-${statusLower}`}>
                          {/* Row 1: Nama Prospek + Badges */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.3rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                            <div className="pipeline-card-name" style={{ marginBottom: 0 }}>{p.name}</div>
                            {isToday(p.createdAt) && <span className="badge-new">Baru</span>}
                            {!p.synced && <span className="badge-offline">Offline</span>}
                            {(p.status === 'Approval' || p.status === 'Akad') && <span className="badge-urgent">Segera</span>}
                          </div>

                          {/* Row 2: Info Produk + Nominal */}
                          <div className="pipeline-card-meta">
                            <span className="pipeline-card-product">
                              {p.category === 'Kredit' 
                                ? (p.tujuanKredit || 'Kredit') 
                                : (p.produkFunding || 'Funding')}
                            </span>
                            <span className="pipeline-card-amount">
                              {formatRupiah(estimasi)}
                            </span>
                            {(user.role === 'Manager' || user.role === 'Super Admin') && (
                              <span className="pipeline-card-sales">Sales: {salesName}</span>
                            )}
                          </div>

                          {/* Row 3: Detail + Geser Tahap */}
                          <div className="pipeline-card-footer">
                            <button
                              type="button"
                              onClick={() => setSelectedProspect(p)}
                              className="pipeline-card-detail-btn"
                              title="Detail"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Eye size={16} />
                            </button>

                            <div className="pipeline-card-move">
                              <button
                                type="button"
                                onClick={() => handleQuickMove(p.id, p.status, 'back')}
                                disabled={normalizeStatus(p.status) === 'Sosialisasi'}
                                className="quick-move-btn"
                                title="Pindahkan ke tahapan sebelumnya"
                              >
                                <ChevronLeft size={13} />
                              </button>
                              <span className="pipeline-move-label">Geser</span>
                              <button
                                type="button"
                                onClick={() => handleQuickMove(p.id, p.status, 'forward')}
                                disabled={normalizeStatus(p.status) === 'Akad'}
                                className="quick-move-btn"
                                title="Pindahkan ke tahapan berikutnya"
                              >
                                <ChevronRight size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Column Pagination Load More Button */}
                    {list.length > visibleCounts[stage.key] && (
                      <button
                        onClick={() => setVisibleCounts(prev => ({ ...prev, [stage.key]: prev[stage.key] + 15 }))}
                        className="btn"
                        style={{
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.75rem',
                          marginTop: '0.4rem',
                          borderRadius: '8px',
                          width: '100%',
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--bjb-blue)',
                          fontWeight: 700,
                          minHeight: 'auto',
                          boxShadow: 'var(--shadow-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        Muat Lebih Banyak ({list.length - visibleCounts[stage.key]} Lagi)
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ProspectDetailModal
        isOpen={selectedProspect !== null}
        onClose={() => setSelectedProspect(null)}
        prospect={selectedProspect}
        isOnline={isOnline}
      />

      <Toast
        isOpen={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default Pipeline;
