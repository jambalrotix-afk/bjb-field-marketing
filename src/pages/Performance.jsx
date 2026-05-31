import React, { useEffect, useState } from 'react';
import { getAllProspects, getTimelineTargets } from '../services/db';
import { BarChart3, Filter, Search, Target, Table, Crown, Compass, Printer, FileSpreadsheet, Hash, DollarSign } from '../components/Icons';
import CustomSelect from '../components/CustomSelect';
import Toast from '../components/Toast';

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

// Target Constants
const TARGET_KREDIT = 500000000;   // 500 Juta
const TARGET_FUNDING = 1500000000; // 1.5 Miliar

const Performance = () => {
  const [user, setUser] = useState({ username: '', role: 'Officer', name: 'User' });
  const [prospects, setProspects] = useState([]);
  const [chartMetric, setChartMetric] = useState('count'); // 'count' or 'volume'
  const [timeFilter, setTimeFilter] = useState('semua'); // 'semua', 'harian', 'mingguan', 'bulanan', 'custom'
  const [activeTab, setActiveTab] = useState('grafik'); // 'grafik', 'konversi', 'tabel'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('semua');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 📢 Targets Configuration State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [timelineTargets, setTimelineTargets] = useState({
    timeline: 'Juni 2026',
    targetKredit: 500000000,
    targetFunding: 1500000000
  });

  const loadData = async () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    const data = await getAllProspects();
    setProspects(data);

    // Fetch and populate dynamic target timeline configuration
    const activeTargets = getTimelineTargets();
    if (activeTargets) {
      setTimelineTargets(activeTargets);
    }
  };

  useEffect(() => {
    loadData();
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Geographical Hotspot clustering algorithm
  const getGeographicalHotspots = () => {
    const hotspots = {
      'Bandung Tengah': 0,
      'Bandung Utara': 0,
      'Bandung Timur': 0,
      'Bandung Barat': 0,
      'Bandung Selatan': 0
    };

    prospects.forEach(p => {
      if (!p.address) return;
      const addr = p.address.toLowerCase();
      if (addr.includes('dago') || addr.includes('setiabudi') || addr.includes('lembang') || addr.includes('utara')) {
        hotspots['Bandung Utara']++;
      } else if (addr.includes('rancaekek') || addr.includes('kiara') || addr.includes('cibiru') || addr.includes('timur') || addr.includes('soekarno')) {
        hotspots['Bandung Timur']++;
      } else if (addr.includes('cibeureum') || addr.includes('cimahi') || addr.includes('barat') || addr.includes('pajajaran')) {
        hotspots['Bandung Barat']++;
      } else if (addr.includes('dayeuhkolot') || addr.includes('baleendah') || addr.includes('selatan') || addr.includes('ciwidey')) {
        hotspots['Bandung Selatan']++;
      } else {
        hotspots['Bandung Tengah']++;
      }
    });

    const total = Object.values(hotspots).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(hotspots).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100)
    })).sort((a, b) => b.count - a.count);
  };

  const getMarketingPerformance = () => {
    const perfMap = {};
    const marketingNames = {
      officer: 'Asep Marketing',
      officer_siti: 'Siti Funding',
      officer_budi: 'Budi Kredit'
    };

    const now = new Date();

    const filteredProspects = prospects.filter(p => {
      if (timeFilter !== 'semua') {
        if (timeFilter === 'custom') {
          try {
            const pDate = new Date(p.tanggalKunjungan || p.createdAt || Date.now());
            const pDateStr = pDate.toISOString().split('T')[0];
            
            if (customStartDate && pDateStr < customStartDate) return false;
            if (customEndDate && pDateStr > customEndDate) return false;
          } catch (e) {
            console.error('Invalid prospect date:', e);
            return false;
          }
        } else {
          const pDate = new Date(p.createdAt || Date.now());
          const diffTime = now - pDate;
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          
          if (timeFilter === 'harian' && diffDays > 1) return false;
          if (timeFilter === 'mingguan' && diffDays > 7) return false;
          if (timeFilter === 'bulanan' && diffDays > 30) return false;
        }
      }
      
      if (categoryFilter !== 'semua') {
        if (p.category !== categoryFilter) return false;
      }
      
      return true;
    });

    filteredProspects.forEach(p => {
      const creator = p.createdBy || 'unknown';
      const name = marketingNames[creator] || creator;

      if (!perfMap[creator]) {
        perfMap[creator] = {
          username: creator,
          name: name,
          prospectsCount: 0,
          totalKredit: 0,
          totalFunding: 0,
          totalVolume: 0,
          coldCount: 0,
          warmCount: 0,
          hotCount: 0
        };
      }

      perfMap[creator].prospectsCount += 1;
      
      const status = p.status || 'Sosialisasi';
      if (status === 'Sosialisasi' || status === 'Cold') {
        perfMap[creator].coldCount += 1;
      } else if (status === 'Pemberkasan' || status === 'Analisa' || status === 'Warm') {
        perfMap[creator].warmCount += 1;
      } else if (status === 'Approval' || status === 'Akad' || status === 'Hot') {
        perfMap[creator].hotCount += 1;
      }

      if (p.category === 'Kredit') {
        const val = p.plafond || 0;
        perfMap[creator].totalKredit += val;
        perfMap[creator].totalVolume += val;
      } else if (p.category === 'Funding') {
        const val = p.penempatanDana || 0;
        perfMap[creator].totalFunding += val;
        perfMap[creator].totalVolume += val;
      }
    });

    // Calculate derived analytical metrics
    return Object.values(perfMap).map(d => {
      const isCreditFocused = d.totalKredit >= d.totalFunding;
      const targetVal = isCreditFocused ? timelineTargets.targetKredit : timelineTargets.targetFunding;
      const avgTicketSize = d.prospectsCount > 0 ? Math.round(d.totalVolume / d.prospectsCount) : 0;
      const targetAchievement = targetVal > 0 ? Math.round((d.totalVolume / targetVal) * 100) : 0;
      
      return {
        ...d,
        isCreditFocused,
        targetVal,
        avgTicketSize,
        targetAchievement
      };
    });
  };

  const rawPerformanceData = getMarketingPerformance();
  const performanceData = rawPerformanceData.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const maxCount = Math.max(...performanceData.map(d => d.prospectsCount), 1);
  const maxVolume = Math.max(...performanceData.map(d => d.totalVolume), 1);

  // Leaderboard Sorting (Based on total rupiah volume)
  const leaderboardData = [...performanceData].sort((a, b) => b.totalVolume - a.totalVolume);

  // geographical hotspots
  const hotspotsData = getGeographicalHotspots();



  // CSV Export helper
  const handleExportCSV = () => {
    if (performanceData.length === 0) {
      alert('Tidak ada data untuk diekspor!');
      return;
    }
    const headers = ['Nama Marketing', 'Total Prospek (Unit)', 'Volume Kredit (IDR)', 'Volume Funding (IDR)', 'Volume Total (IDR)', 'Rata-rata Tiket (IDR)', 'Ketercapaian Target (%)'];
    const rows = performanceData.map(d => [
      d.name,
      d.prospectsCount,
      d.totalKredit,
      d.totalFunding,
      d.totalVolume,
      d.avgTicketSize,
      `${d.targetAchievement}%`
    ]);

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += [headers.join(','), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Kinerja_Tim_BJB_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="main-content" style={{ paddingBottom: '90px' }}>
      
      {/* 5. PRINT READY OFFICIAL HEADER (Hidden on Screen, Visible on Print) */}
      <div className="print-only-header">
        <div className="print-header-layout">
          <div>
            <h1 className="print-kop-title" style={{ margin: 0, fontSize: '13pt' }}>PT BANK PEMBANGUNAN DAERAH JAWA BARAT DAN BANTEN, Tbk.</h1>
            <p className="print-kop-address" style={{ margin: '4px 0 0', fontSize: '7.5pt', color: '#475569', lineHeight: 1.35 }}>
              Kantor Cabang Utama Bandung • Jl. Asia Afrika No. 122, Bandung<br/>
              Telepon: (022) 4260950 • Email: info@bankbjb.co.id
            </p>
          </div>
          <div className="print-kop-logo" style={{ fontSize: '18pt', fontWeight: 800, color: 'var(--bjb-blue)' }}>
            <span style={{ color: 'var(--bjb-gold)' }}>bjb</span> Field
          </div>
        </div>
        <div style={{ marginTop: '1rem', borderBottom: '2px solid #000', paddingBottom: '0.4rem' }}>
          <h2 style={{ margin: '8px 0 0', fontSize: '11pt', textAlign: 'center', color: 'var(--bjb-blue-dark)', fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase' }}>
            LAPORAN ANALISIS KINERJA & PROSPEKTUS TIM MARKETING LAPANGAN
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '8pt', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
            Periode Laporan: {timeFilter === 'semua' ? 'Semua Riwayat Kunjungan' : timeFilter === 'custom' ? `${customStartDate} s/d ${customEndDate}` : timeFilter.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Header Screen */}
      <div className="flex justify-between items-center mb-4 hide-print page-header-responsive">
        <h2>Analisis Kinerja Tim</h2>
        
        <div className="flex gap-2 btn-group-responsive">
          <button 
            type="button" 
            onClick={handlePrint} 
            className="btn btn-outline flex items-center gap-1"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', width: 'auto', minHeight: 'auto', fontWeight: 'bold' }}
          >
            <Printer size={15} />
            <span>Cetak PDF</span>
          </button>
          
          {(user.role === 'Manager' || user.role === 'Super Admin') && (
            <button 
              onClick={handleExportCSV} 
              className="btn btn-primary flex items-center gap-1" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', width: 'auto', minHeight: 'auto' }}
            >
              <FileSpreadsheet size={15} />
              <span>Ekspor CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card hide-print" style={{ padding: '1rem', marginBottom: 'var(--space-y)', position: 'relative', zIndex: 50 }}>
        <h3 className="card-title" style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>
          <Filter size={16} />
          Pencarian & Penyaringan
        </h3>
        
        {/* Search */}
        <div className="form-group" style={{ marginBottom: '0.75rem', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="Cari nama sales marketing..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ fontSize: '0.88rem', padding: '0 0.6rem 0 2.2rem', height: '42px', marginBottom: 0, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kategori Prospek</span>
            <CustomSelect 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'semua', label: 'Semua Kategori' },
                { value: 'Kredit', label: 'Kredit (Plafond)' },
                { value: 'Funding', label: 'Funding (Dana)' }
              ]}
              style={{ height: '38px', fontSize: '0.8rem' }}
            />
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Periode Kunjungan</span>
            <CustomSelect 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              options={[
                { value: 'semua', label: 'Semua Riwayat' },
                { value: 'harian', label: 'Hari Ini (Harian)' },
                { value: 'mingguan', label: '7 Hari (Mingguan)' },
                { value: 'bulanan', label: '30 Hari (Bulanan)' },
                { value: 'custom', label: 'Pilih Tanggal...' }
              ]}
              style={{ height: '38px', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        {/* Date Pickers */}
        {timeFilter === 'custom' && (
          <div className="flex gap-2" style={{ marginTop: '0.75rem', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Tanggal Mulai</span>
              <input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)} 
                className="form-input"
                style={{ fontSize: '0.8rem', height: '38px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Tanggal Selesai</span>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)} 
                className="form-input"
                style={{ fontSize: '0.8rem', height: '38px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs Menu – 3 items in standard tab-toggle flex bar */}
      <div className="tab-toggle hide-print" style={{ marginBottom: 'var(--space-y)' }}>
        <button 
          onClick={() => setActiveTab('grafik')} 
          className={`tab-toggle-btn ${activeTab === 'grafik' ? 'active' : ''}`}
        >
          <BarChart3 size={16} />
          <span>Grafik</span>
        </button>
        <button 
          onClick={() => setActiveTab('konversi')} 
          className={`tab-toggle-btn ${activeTab === 'konversi' ? 'active' : ''}`}
        >
          <Target size={16} />
          <span>Konversi</span>
        </button>
        <button 
          onClick={() => setActiveTab('tabel')} 
          className={`tab-toggle-btn ${activeTab === 'tabel' ? 'active' : ''}`}
        >
          <Table size={16} />
          <span>Tabel</span>
        </button>
      </div>

      {/* Tab: GRAFIK KINERJA */}
      {activeTab === 'grafik' && (
        <>
          {/* 3. LEADERBOARD PODIUM SECTON (1st, 2nd, 3rd podium) */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 className="card-title" style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Crown size={18} style={{ color: 'var(--bjb-gold)' }} />
              Klasemen Sales Terbaik
            </h3>
            
            {leaderboardData.length === 0 ? (
              <div className="text-center text-muted text-xs py-4">Belum ada data klasemen saat ini.</div>
            ) : (
              <div className="leaderboard-podium">
                
                {/* 2nd Place */}
                {leaderboardData[1] && (
                  <div className="podium-column podium-silver">
                    <span className="podium-name">{leaderboardData[1].name}</span>
                    <span className="podium-val">{formatRupiah(leaderboardData[1].totalVolume)}</span>
                    <div className="podium-avatar">
                      {leaderboardData[1].name.charAt(0)}
                      <span className="podium-rank-badge">2</span>
                    </div>
                    <div className="podium-pillar">
                      <span style={{ fontSize: '0.75rem' }}>2nd</span>
                    </div>
                  </div>
                )}

                {/* 1st Place (Winner) */}
                {leaderboardData[0] && (
                  <div className="podium-column podium-gold">
                    <span className="podium-name" style={{ fontWeight: 800, fontSize: '0.7rem' }}>{leaderboardData[0].name}</span>
                    <span className="podium-val" style={{ fontWeight: 700 }}>{formatRupiah(leaderboardData[0].totalVolume)}</span>
                    <div className="podium-avatar">
                      {leaderboardData[0].name.charAt(0)}
                      <span className="podium-rank-badge">1</span>
                    </div>
                    <div className="podium-pillar">
                      <span style={{ fontSize: '0.85rem' }}>👑 1st</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {leaderboardData[2] && (
                  <div className="podium-column podium-bronze">
                    <span className="podium-name">{leaderboardData[2].name}</span>
                    <span className="podium-val">{formatRupiah(leaderboardData[2].totalVolume)}</span>
                    <div className="podium-avatar">
                      {leaderboardData[2].name.charAt(0)}
                      <span className="podium-rank-badge">3</span>
                    </div>
                    <div className="podium-pillar">
                      <span style={{ fontSize: '0.7rem' }}>3rd</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="card-title" style={{ fontSize: '1rem' }}>
              <BarChart3 size={18} />
              Grafik Volume Kerja Tim
            </h3>

            {/* Metric selection toggle */}
            <div className="tab-toggle hide-print" style={{ marginBottom: 'var(--space-y)' }}>
              <button 
                type="button" 
                onClick={() => setChartMetric('count')} 
                className={`tab-toggle-btn ${chartMetric === 'count' ? 'active' : ''}`}
                style={{ fontSize: '0.78rem', padding: '0.4rem' }}
              >
                <Hash size={14} />
                <span>Jumlah Prospek (Unit)</span>
              </button>
              <button 
                type="button" 
                onClick={() => setChartMetric('volume')} 
                className={`tab-toggle-btn ${chartMetric === 'volume' ? 'active' : ''}`}
                style={{ fontSize: '0.78rem', padding: '0.4rem' }}
              >
                <DollarSign size={14} />
                <span>Total Rupiah (Volume IDR)</span>
              </button>
            </div>

            {/* Progress Bars */}
            <div style={{ marginBottom: '1.5rem' }}>
              {performanceData.length === 0 ? (
                <div className="text-center text-muted text-xs py-4">Belum ada data kinerja untuk periode ini.</div>
              ) : (
                performanceData.map(d => {
                  const percentage = chartMetric === 'count' 
                    ? (d.prospectsCount / maxCount) * 100 
                    : (d.totalVolume / maxVolume) * 100;
                  
                  return (
                    <div key={d.username} style={{ marginBottom: '1.25rem' }}>
                      <div className="flex justify-between text-xs font-semibold mb-2">
                        <span style={{ color: 'var(--bjb-blue-dark)' }}>{d.name}</span>
                        <span style={{ color: 'var(--text-main)' }}>
                          {chartMetric === 'count' 
                            ? `${d.prospectsCount} Unit` 
                            : formatRupiah(d.totalVolume)}
                        </span>
                      </div>
                      <div style={{ 
                        backgroundColor: 'var(--border-light)', 
                        height: '10px', 
                        borderRadius: '999px', 
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          background: 'linear-gradient(90deg, var(--bjb-blue-light), var(--bjb-blue))', 
                          width: `${percentage}%`, 
                          height: '100%',
                          borderRadius: '999px',
                          transition: 'width 0.5s ease-out'
                        }} />
                      </div>

                      {/* 1. TARGET achievement progress bar indicator (Target vs Aktual) */}
                      <div className="flex justify-between items-center" style={{ fontSize: '0.65rem', marginTop: '6px', color: 'var(--text-muted)' }}>
                        <span>Target Bulanan: {formatRupiah(d.targetVal)}</span>
                        <span style={{ 
                          fontWeight: 700, 
                          color: d.targetAchievement >= 100 ? 'var(--status-hot)' : 'var(--bjb-blue)'
                        }}>
                          {d.targetAchievement}% Ketercapaian
                        </span>
                      </div>
                      <div style={{ backgroundColor: '#f1f5f9', height: '4px', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                        <div style={{ 
                          backgroundColor: d.targetAchievement >= 100 ? 'var(--status-hot)' : 'var(--bjb-gold)', 
                          width: `${Math.min(d.targetAchievement, 100)}%`, 
                          height: '100%',
                          borderRadius: '2px' 
                        }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Tab: RINCIAN DETIL TABEL */}
      {activeTab === 'tabel' && (
        <div className="card">
          <h3 className="card-title" style={{ fontSize: '1rem' }}>
            <Table size={18} />
            Rincian Hasil Kerja Tim
          </h3>
          <p className="text-muted text-xs" style={{ marginBottom: '1.25rem', lineHeight: 1.4 }}>
            Tabel rincian nominal penyerapan kredit (plafond) dan produk pendanaan (funding) dari masing-masing marketing.
          </p>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nama Marketing</th>
                  <th className="text-center">Prospek</th>
                  <th className="text-right" style={{ fontSize: '0.78rem' }}>Kredit</th>
                  <th className="text-right" style={{ fontSize: '0.78rem' }}>Funding</th>
                  {/* 2. AVERAGE TICKET SIZE Column */}
                  <th className="text-right" style={{ fontSize: '0.78rem' }}>Rata-rata Tiket</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted text-xs" style={{ padding: '1.5rem' }}>
                      Belum ada data kinerja untuk periode ini.
                    </td>
                  </tr>
                ) : (
                  performanceData.map(d => (
                    <tr key={d.username}>
                      <td className="font-semibold" style={{ fontSize: '0.8rem' }}>{d.name}</td>
                      <td className="text-center" style={{ fontSize: '0.8rem' }}>{d.prospectsCount}</td>
                      <td className="text-right" style={{ color: 'var(--bjb-blue)', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>{formatRupiah(d.totalKredit)}</td>
                      <td className="text-right" style={{ color: 'var(--status-warm)', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>{formatRupiah(d.totalFunding)}</td>
                      <td className="text-right" style={{ color: 'var(--bjb-blue-dark)', fontSize: '0.76rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {formatRupiah(d.avgTicketSize)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: KONVERSI DAN FUNNEL */}
      {activeTab === 'konversi' && (
        <>
          <div className="card">
            <h3 className="card-title" style={{ fontSize: '1rem' }}>
              <Target size={18} />
              Analisis Konversi & Closing Rate
            </h3>
            <p className="text-muted text-xs" style={{ marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Mengukur efektivitas tim marketing di lapangan dalam menyaring prospek baru (**Cold**), menindaklanjuti proses berkas (**Warm**), hingga tahap akhir akad (**Hot**).
            </p>

            {performanceData.length === 0 ? (
              <div className="text-center text-muted text-xs py-4">Belum ada data konversi untuk periode ini.</div>
            ) : (
              performanceData.map(d => {
                const total = d.prospectsCount;
                const prosesLanjut = d.warmCount + d.hotCount;
                const closing = d.hotCount;

                const pctCold = total > 0 ? (d.coldCount / total) * 100 : 0;
                const pctWarm = total > 0 ? (d.warmCount / total) * 100 : 0;
                const pctHot = total > 0 ? (d.hotCount / total) * 100 : 0;

                const pctLanjut = total > 0 ? Math.round((prosesLanjut / total) * 100) : 0;
                const pctClosing = total > 0 ? Math.round((closing / total) * 100) : 0;

                return (
                  <div key={d.username} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold" style={{ color: 'var(--bjb-blue-dark)', fontSize: '0.85rem' }}>{d.name}</span>
                      <span className="text-xs font-semibold text-muted">
                        Total Prospek: {total} Unit
                      </span>
                    </div>

                    {/* Stacked Funnel Progress Bar */}
                    <div style={{ display: 'flex', height: '12px', borderRadius: '999px', overflow: 'hidden', margin: '0.4rem 0 0.6rem', backgroundColor: 'var(--border-light)' }}>
                      {d.coldCount > 0 && (
                        <div style={{ width: `${pctCold}%`, backgroundColor: 'var(--status-cold)', height: '100%' }} title={`Cold: ${d.coldCount}`} />
                      )}
                      {d.warmCount > 0 && (
                        <div style={{ width: `${pctWarm}%`, backgroundColor: 'var(--status-warm)', height: '100%' }} title={`Warm: ${d.warmCount}`} />
                      )}
                      {d.hotCount > 0 && (
                        <div style={{ width: `${pctHot}%`, backgroundColor: 'var(--status-hot)', height: '100%' }} title={`Hot: ${d.hotCount}`} />
                      )}
                    </div>

                    {/* Status Breakdown Legend & Count */}
                    <div className="flex gap-2 text-xs font-semibold" style={{ marginBottom: '0.75rem', fontSize: '0.68rem' }}>
                      <div className="flex items-center" style={{ flex: 1, gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--status-cold)', flexShrink: 0 }} />
                        <span className="text-muted">Cold: {d.coldCount} ({total > 0 ? Math.round(pctCold) : 0}%)</span>
                      </div>
                      <div className="flex items-center" style={{ flex: 1, gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--status-warm)', flexShrink: 0 }} />
                        <span className="text-muted">Warm: {d.warmCount} ({total > 0 ? Math.round(pctWarm) : 0}%)</span>
                      </div>
                      <div className="flex items-center" style={{ flex: 1, gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--status-hot)', flexShrink: 0 }} />
                        <span className="text-muted">Hot: {d.hotCount} ({total > 0 ? Math.round(pctHot) : 0}%)</span>
                      </div>
                    </div>

                    {/* Performance Rates Box */}
                    <div className="flex gap-2">
                      <div style={{ flex: 1, padding: '0.4rem 0.6rem', backgroundColor: 'rgba(245, 158, 11, 0.04)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                        <div className="text-muted" style={{ fontSize: '0.62rem', fontWeight: 600 }}>Proses Lanjut Rate</div>
                        <div className="font-bold" style={{ color: '#d97706', fontSize: '0.8rem', marginTop: '1px' }}>
                          {pctLanjut}% <span style={{ fontSize: '0.65rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>({prosesLanjut} Klien)</span>
                        </div>
                      </div>
                      <div style={{ flex: 1, padding: '0.4rem 0.6rem', backgroundColor: 'rgba(16, 185, 129, 0.04)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                        <div className="text-muted" style={{ fontSize: '0.62rem', fontWeight: 600 }}>Closing Rate (Hot)</div>
                        <div className="font-bold" style={{ color: '#059669', fontSize: '0.8rem', marginTop: '1px' }}>
                          {pctClosing}% <span style={{ fontSize: '0.65rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>({closing} Klien)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 4. GEOGRAPHICAL HOTSPOTS CLUSTERING SECTION */}
          <div className="card">
            <h3 className="card-title" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Compass size={18} style={{ color: 'var(--bjb-blue)' }} />
              Hotspot Wilayah Kunjungan Terbanyak
            </h3>
            <p className="text-muted text-xs" style={{ marginBottom: '1rem', lineHeight: 1.4 }}>
              Sebaran data kluster area prospek/nasabah berdasarkan data alamat lengkap kunjungan lapangan tim sales.
            </p>

            <div className="hotspot-container">
              {hotspotsData.map(item => (
                <div key={item.name} className="hotspot-row">
                  <span className="hotspot-label">{item.name}</span>
                  <div className="hotspot-bar-outer">
                    <div 
                      className="hotspot-bar-inner" 
                      style={{ 
                        width: `${item.percentage}%`,
                        background: 'linear-gradient(90deg, #1e40af, #3b82f6)' 
                      }} 
                    />
                  </div>
                  <span className="hotspot-value">{item.count} Prospek</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Tab: KELOLA MEMO & TARGET (settings) removed & moved to separate Broadcast & Settings screens */}

      {/* 5. PRINT READY OFFICIAL SIGNATURE AREA (Hidden on Screen, Visible on Print) */}
      <div className="print-signature-area" style={{ display: 'none' }}>
        <div className="print-signature-box">
          <p style={{ margin: 0 }}>Bandung, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
          <p style={{ fontWeight: 800, color: 'var(--bjb-blue-dark)', margin: '4px 0 5rem', fontFamily: 'Outfit, sans-serif' }}>Pimpinan Kantor Cabang Pembantu</p>
          <div className="print-signature-line" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ahmad Heryawan, M.M.
          </div>
          <p style={{ fontSize: '7.5pt', color: '#64748b', margin: '4px 0 0' }}>NIP. 198003112005081001</p>
        </div>
      </div>

      <Toast 
        isOpen={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
      
    </div>
  );
};

export default Performance;
