import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, MapPin, Calendar, User, TrendingUp, Globe, FileText } from './Icons';
import PromptModal from './PromptModal';

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

const formatWhatsAppUrl = (phone) => {
  if (!phone) return '#';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return `https://wa.me/${clean}`;
};

const ProspectPhotoModal = ({ blob }) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!blob) return;
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  if (!url) return null;

  return (
    <div style={{ 
      marginTop: '0.75rem', 
      width: '100%', 
      maxHeight: '220px', 
      overflow: 'hidden', 
      borderRadius: 'var(--radius)', 
      border: 'var(--border-width) solid var(--border)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <img src={url} alt="Foto Prospek" style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
    </div>
  );
};

const ProspectDetailModal = ({ isOpen, onClose, prospect, isOnline, onStatusChange, onDelete }) => {
  const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : { role: 'Officer' };
  const isSuperAdmin = currentUser.role === 'Super Admin';

  // State untuk custom prompt modal
  const [promptModal, setPromptModal] = useState({ open: false, type: null });

  const openPrompt = (type) => setPromptModal({ open: true, type });
  const closePrompt = () => setPromptModal({ open: false, type: null });

  const handlePromptConfirm = (reason) => {
    const { type } = promptModal;
    closePrompt();
    if (type === 'Batal' || type === 'Ditolak') {
      onStatusChange(prospect.id, type);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !prospect) return null;

  const promptConfig = promptModal.type === 'Ditolak'
    ? { icon: '🚫', title: 'Tolak Prospek', label: 'Alasan Penolakan (Opsional)', placeholder: 'Contoh: Tidak memenuhi syarat kredit...', type: 'danger', confirmText: 'Tolak Prospek' }
    : { icon: '❌', title: 'Batalkan Prospek', label: 'Alasan Pembatalan (Opsional)', placeholder: 'Contoh: Nasabah menarik diri...', type: 'warning', confirmText: 'Batalkan' };

  const p = prospect;
  const estimasi = p.category === 'Kredit' ? p.plafond : p.penempatanDana;
  const salesName = p.createdBy === 'officer' ? 'Asep Marketing' : p.createdBy === 'officer_siti' ? 'Siti Funding' : p.createdBy === 'officer_budi' ? 'Budi Kredit' : p.createdBy;
  const getStatusColors = (status) => {
    const s = status ? status.trim() : 'Cold';
    const statusLower = s.toLowerCase();
    
    // 100% unique, highly distinct colors matching the Dashboard status dots exactly
    const config = {
      cold: { color: '#0ea5e9', bg: '#e0f2fe' },                 // Sky Blue
      warm: { color: '#f97316', bg: '#ffedd5' },                 // Orange
      hot: { color: '#f43f5e', bg: '#ffe4e6' },                  // Deep Pink/Rose
      sosialisasi: { color: '#a855f7', bg: '#f3e8ff' },          // Purple
      negosiasi: { color: '#4f46e5', bg: '#e0e7ff' },            // Indigo Blue
      pemberkasan: { color: '#eab308', bg: '#fef9c3' },          // Bright Yellow
      analisa: { color: '#06b6d4', bg: '#ecfeff' },              // Cyan/Teal
      approval: { color: '#84cc16', bg: '#ecfccb' },            // Lime Green
      akad: { color: '#10b981', bg: '#dcfce7' },                // Emerald Green (Success!)
      ditolak: { color: '#ef4444', bg: '#fee2e2' },              // Crimson Red
      batal: { color: '#64748b', bg: '#f1f5f9' }                 // Slate Gray
    };
    
    return config[statusLower] || config.cold;
  };
  const { color: statusColor, bg: statusBgColor } = getStatusColors(p.status);

  return createPortal(
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content" style={{ maxWidth: '520px', width: '100%', display: 'flex', flexDirection: 'column', maxHeight: '90dvh' }}>
        
        {/* Header */}
        <div className="modal-header" style={{ 
          padding: '1.25rem 1.5rem 1rem', 
          borderBottom: '1px solid var(--border-light)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Detail Prospek ({p.category})
            </span>
            <h3 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--bjb-blue-dark)', fontFamily: 'Outfit, sans-serif' }}>
              {p.name}
            </h3>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: 'var(--text-muted)', 
              padding: '6px', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-body" style={{ 
          padding: '1.5rem', 
          overflowY: 'auto', 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.25rem' 
        }}>
          {/* Banner Status Terminal (Batal/Ditolak) */}
          {(p.status === 'Batal' || p.status === 'Ditolak') && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: p.status === 'Ditolak' ? '#fef2f2' : '#f8fafc',
              border: `1px solid ${p.status === 'Ditolak' ? '#fca5a5' : '#cbd5e1'}`,
              borderRadius: 'var(--radius)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <span style={{ 
                fontSize: '0.85rem', 
                fontWeight: 800, 
                color: p.status === 'Ditolak' ? '#b91c1c' : '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                🚫 PROSPEK INI TELAH {p.status.toUpperCase()}
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                {p.status === 'Ditolak' 
                  ? 'Pengajuan prospek ini telah ditolak oleh bank.' 
                  : 'Prospek ini telah dibatalkan / tidak dilanjutkan.'}
              </p>
              {onStatusChange && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Apakah Anda yakin ingin mengaktifkan kembali prospek ini?')) {
                      const activeHistory = (p.statusHistory || []).filter(h => h.status !== 'Batal' && h.status !== 'Ditolak');
                      const lastActiveStatus = activeHistory.length > 0 ? activeHistory[activeHistory.length - 1].status : 'Sosialisasi';
                      onStatusChange(p.id, lastActiveStatus);
                    }
                  }}
                  className="btn btn-outline"
                  style={{ 
                    padding: '0.35rem 0.75rem', 
                    fontSize: '0.74rem', 
                    width: 'auto', 
                    minHeight: 'auto', 
                    marginTop: '0.25rem',
                    borderColor: p.status === 'Ditolak' ? '#b91c1c' : 'var(--bjb-blue)',
                    color: p.status === 'Ditolak' ? '#b91c1c' : 'var(--bjb-blue)',
                  }}
                >
                  Aktifkan Kembali
                </button>
              )}
            </div>
          )}

          {/* Elegant Horizontal 5-Stage Stepper Progress Timeline */}
          {onStatusChange && (
            <div style={{ 
              padding: '0.875rem 0.5rem', 
              backgroundColor: 'var(--surface-hover)', 
              borderRadius: 'var(--radius)', 
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              position: 'relative',
              opacity: (p.status === 'Batal' || p.status === 'Ditolak') ? 0.45 : 1,
              pointerEvents: (p.status === 'Batal' || p.status === 'Ditolak') ? 'none' : 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px', padding: '0 4px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--bjb-blue)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Tahapan Prospek (Klik untuk Mengubah)
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, ...getStatusColors(p.status), padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  {p.status || 'Sosialisasi'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', padding: '0.5rem 0.25rem' }}>
                {/* Stepper horizontal progress line */}
                <div style={{ 
                  position: 'absolute', 
                  left: '1.5rem', 
                  right: '1.5rem', 
                  top: 'calc(0.5rem + 12px)', 
                  transform: 'translateY(-50%)', 
                  height: '3px', 
                  backgroundColor: 'var(--border)', 
                  zIndex: 1 
                }}>
                  <div style={{ 
                    height: '100%', 
                    backgroundColor: 'var(--bjb-blue)', 
                    width: `${(() => {
                      const idx = ['Sosialisasi', 'Pemberkasan', 'Analisa', 'Approval', 'Akad'].indexOf(p.status || 'Sosialisasi');
                      return idx === -1 ? '0%' : `${(idx / 4) * 100}%`;
                    })()}`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                {['Sosialisasi', 'Pemberkasan', 'Analisa', 'Approval', 'Akad'].map((stage, idx) => {
                  const isActive = (p.status || 'Sosialisasi') === stage;
                  const stageOrder = ['Sosialisasi', 'Pemberkasan', 'Analisa', 'Approval', 'Akad'];
                  const activeIdx = stageOrder.indexOf(p.status || 'Sosialisasi');
                  const currentIdx = stageOrder.indexOf(stage);
                  const isCompleted = currentIdx <= activeIdx;
                  
                  const colors = getStatusColors(stage);
                  
                  return (
                    <button 
                      key={stage}
                      type="button"
                      onClick={() => onStatusChange(p.id, stage)}
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        background: 'none',
                        border: 'none',
                        cursor: isActive ? 'default' : 'pointer',
                        padding: 0,
                        zIndex: 2,
                        width: '48px',
                        outline: 'none'
                      }}
                      title={`Ubah status ke ${stage}`}
                    >
                      <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        backgroundColor: isActive ? colors.color : isCompleted ? 'var(--bjb-blue-light)' : 'var(--surface)',
                        border: isActive ? `2px solid ${colors.color}` : isCompleted ? '2px solid var(--bjb-blue-light)' : '2px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isActive || isCompleted ? 'white' : 'var(--text-muted)',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        boxShadow: isActive ? `0 0 8px ${colors.color}80` : 'none',
                        transition: 'all 0.25s ease',
                        boxSizing: 'border-box'
                      }}>
                        {idx + 1}
                      </div>
                      <span style={{ 
                        fontSize: '0.62rem', 
                        fontWeight: isActive ? 800 : 600, 
                        color: isActive ? colors.color : 'var(--text-muted)',
                        marginTop: '4px',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        transition: 'color 0.25s ease'
                      }}>
                        {stage}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Status and Plafond Card */}
          <div style={{ 
            background: `linear-gradient(135deg, var(--bjb-blue), var(--bjb-blue-dark))`, 
            borderRadius: 'var(--radius)', 
            padding: '1.25rem', 
            color: 'white',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 500, display: 'block', marginBottom: '2px' }}>
                {p.category === 'Kredit' ? 'ESTIMASI PLAFOND' : 'PENEMPATAN DANA'}
              </span>
              <strong style={{ fontSize: '1.4rem', fontFamily: 'Outfit, sans-serif', color: 'var(--bjb-gold-light)' }}>
                {formatRupiah(estimasi)}
              </strong>
            </div>
            <div style={{ 
              backgroundColor: statusBgColor, 
              color: statusColor, 
              padding: '0.4rem 0.8rem', 
              borderRadius: 'var(--radius-full)', 
              fontSize: '0.75rem', 
              fontWeight: 800,
              fontFamily: 'Outfit, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `1px solid ${statusColor}40`
            }}>
              {p.status || 'Cold'}
            </div>
          </div>

          {/* Business details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                {p.category === 'Kredit' ? 'TUJUAN KREDIT' : 'PRODUK FUNDING'}
              </span>
              <strong style={{ fontSize: '0.88rem', color: 'var(--bjb-blue-dark)' }}>
                {p.category === 'Kredit' ? (p.tujuanKredit || '-') : (p.produkFunding || '-')}
              </strong>
            </div>

            {p.category === 'Kredit' ? (
              <>
                <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    OMZET USAHA
                  </span>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--bjb-blue-dark)' }}>
                    {formatRupiah(p.omzet)}
                  </strong>
                </div>
                <div style={{ gridColumn: 'span 2', padding: '0.75rem 1rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    AGUNAN / JAMINAN
                  </span>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--bjb-blue-dark)' }}>
                    {p.agunan || '-'}
                  </strong>
                </div>
              </>
            ) : (
              <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  SUMBER DANA
                </span>
                <strong style={{ fontSize: '0.88rem', color: 'var(--bjb-blue-dark)' }}>
                  {p.sumberDana || '-'}
                </strong>
              </div>
            )}
          </div>

          {/* Contact and address */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--bjb-blue-dark)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontWeight: 700 }}>
              <FileText size={16} /> Info Kontak & Kunjungan
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div className="detail-info-row">
                <span className="detail-info-label">
                  <Phone size={14} style={{ color: 'var(--bjb-blue)', flexShrink: 0 }} />
                  No. Telepon:
                </span>
                <div className="detail-info-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <a href={`tel:${p.phone}`} style={{ fontSize: '0.85rem', color: 'var(--bjb-blue)', fontWeight: 700, textDecoration: 'none' }} title="Telepon Langsung">
                    {p.phone}
                  </a>
                  <a 
                    href={formatWhatsAppUrl(p.phone)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    title="Hubungi via WhatsApp"
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: '0.25rem',
                      backgroundColor: 'rgba(37, 211, 102, 0.12)',
                      borderRadius: '50%',
                      transition: 'all 0.2s ease',
                      lineHeight: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(37, 211, 102, 0.25)';
                      e.currentTarget.style.transform = 'scale(1.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(37, 211, 102, 0.12)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#25D366' }}>
                      <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.993L2 22l5.13-1.347a9.96 9.96 0 0 0 4.887 1.277h.005c5.505 0 9.989-4.478 9.99-9.985C22 6.478 17.517 2 12.012 2zm4.7 13.916c-.223.63-1.29 1.233-1.78 1.282-.44.043-.102.26-2.585-.722-2.73-1.08-4.48-3.863-4.616-4.046-.137-.183-1.108-1.472-1.108-2.81 0-1.337.697-1.996.944-2.26.248-.263.546-.329.728-.329l.52.003c.125 0 .292-.047.457.348.17.408.583 1.423.633 1.527.05.105.083.227.013.368-.07.14-.105.228-.21.35-.105.122-.22.272-.315.365-.104.103-.213.216-.09.428.122.21.543.896 1.164 1.448.8.71 1.472.93 1.68 1.02.207.09.328.075.45-.067.12-.14.52-.607.66-.814.137-.207.273-.173.46-.104.187.07 1.185.56 1.388.662.204.102.34.152.39.238.05.085.05.495-.173 1.125z"/>
                    </svg>
                  </a>
                </div>
              </div>

              <div className="detail-info-row-start">
                <span className="detail-info-label">
                  <MapPin size={14} style={{ color: 'var(--status-cold)', marginTop: '3px', flexShrink: 0 }} />
                  Alamat:
                </span>
                <span className="detail-info-value">
                  {p.address || '-'}
                </span>
              </div>

              <div className="detail-info-row" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.6rem', marginTop: '0.2rem' }}>
                <span className="detail-info-label">
                  <User size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  Marketing:
                </span>
                <span className="detail-info-value" style={{ fontWeight: 600 }}>
                  {salesName}
                </span>
              </div>

              <div className="detail-info-row">
                <span className="detail-info-label">
                  <Calendar size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  Tgl Kunjungan:
                </span>
                <span className="detail-info-value">
                  {p.createdAt || p.tanggalKunjungan ? new Date(p.createdAt || p.tanggalKunjungan).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}
                </span>
              </div>
            </div>
          </div>



          {/* Catatan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--bjb-blue-dark)', margin: 0, fontWeight: 700 }}>
              Catatan / Deskripsi
            </h4>
            <div style={{ 
              padding: '0.875rem 1rem', 
              backgroundColor: 'var(--surface-hover)', 
              borderRadius: 'var(--radius)', 
              border: '1px solid var(--border)',
              fontSize: '0.85rem',
              color: 'var(--text-main)',
              lineHeight: 1.5,
              whiteSpace: 'pre-line'
            }}>
              {p.catatan || 'Tidak ada catatan.'}
            </div>
          </div>

          {/* Location / Map */}
          {p.location && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--bjb-blue-dark)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontWeight: 700 }}>
                <MapPin size={16} /> Koordinat Lokasi
              </h4>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                {p.location}
              </div>
              {isOnline ? (
                <iframe 
                  width="100%" 
                  height="160" 
                  style={{ border: 0, borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }} 
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(p.location)}&z=15&output=embed`} 
                  allowFullScreen 
                  loading="lazy" 
                />
              ) : (
                <div style={{ 
                  padding: '1.5rem', 
                  backgroundColor: 'var(--surface-hover)', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px', 
                  borderRadius: 'var(--radius)', 
                  fontSize: '0.8rem', 
                  color: 'var(--text-muted)', 
                  border: '1px dashed var(--border)' 
                }}>
                  <Globe size={24} style={{ color: 'var(--text-muted)' }} />
                  <span>Peta Offline (Koneksi Internet Diperlukan untuk Memuat Peta)</span>
                </div>
              )}
            </div>
          )}

          {/* Photo */}
          {p.photoBlob && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--bjb-blue-dark)', margin: 0, fontWeight: 700 }}>
                Foto Lokasi / Usaha
              </h4>
              <ProspectPhotoModal blob={p.photoBlob} />
            </div>
          )}

          {/* History Progress Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--bjb-blue-dark)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontWeight: 700 }}>
              <TrendingUp size={16} /> Riwayat Progres Prospek
            </h4>
            
            <div style={{ 
              padding: '1rem 1rem 1rem 1.5rem', 
              backgroundColor: 'var(--surface-hover)', 
              borderRadius: 'var(--radius)', 
              border: '1px solid var(--border)',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem', 
              position: 'relative', 
              maxHeight: '125px',
              overflowY: 'auto',
              boxSizing: 'border-box'
            }}>
              {/* Vertical Dotted line */}
              <div style={{ 
                position: 'absolute', 
                left: '22px', 
                top: '20px', 
                bottom: '20px', 
                width: '2px', 
                borderLeft: '1.5px dotted var(--border)' 
              }} />

              {(p.statusHistory || [
                { 
                  status: p.status || 'Sosialisasi', 
                  timestamp: p.createdAt || p.tanggalKunjungan, 
                  updatedBy: salesName, 
                  note: 'Pertemuan pertama & prospek terdaftar' 
                }
              ]).map((hist, idx) => {
                const { color: histStatusColor, bg: histStatusBg } = getStatusColors(hist.status);
                return (
                  <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {/* Circle Dot on Timeline */}
                    <div style={{ 
                      position: 'absolute', 
                      left: '-20px', 
                      top: '6px', 
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '50%', 
                      backgroundColor: histStatusColor, 
                      border: '2px solid var(--surface)' 
                    }} />

                    {/* Timeline Item Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 800, 
                        color: histStatusColor, 
                        backgroundColor: histStatusBg,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em'
                      }}>
                        {hist.status}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 500 }}>
                        {hist.timestamp ? new Date(hist.timestamp).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                      </span>
                    </div>
                    
                    {/* Timeline Item Content */}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '2px', fontWeight: 500 }}>
                      {hist.note}
                    </div>
                    {hist.updatedBy && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Oleh: {hist.updatedBy === 'officer' ? 'Asep Marketing' : hist.updatedBy === 'officer_siti' ? 'Siti Funding' : hist.updatedBy === 'officer_budi' ? 'Budi Kredit' : hist.updatedBy}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="modal-actions" style={{ 
          padding: '1rem 1.5rem', 
          backgroundColor: 'var(--surface-hover)', 
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem' 
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {onStatusChange && p.status !== 'Batal' && p.status !== 'Ditolak' && (
              <>
                <button
                  type="button"
                  onClick={() => openPrompt('Batal')}
                  className="btn btn-outline"
                  style={{ 
                    padding: '0.5rem 0.8rem', 
                    fontSize: '0.8rem', 
                    width: 'auto', 
                    minHeight: 'auto', 
                    margin: 0,
                    borderColor: '#64748b',
                    color: '#64748b',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  Batalkan
                </button>
                <button
                  type="button"
                  onClick={() => openPrompt('Ditolak')}
                  className="btn"
                  style={{ 
                    padding: '0.5rem 0.8rem', 
                    fontSize: '0.8rem', 
                    width: 'auto', 
                    minHeight: 'auto', 
                    margin: 0,
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    border: '1px solid rgba(185, 28, 28, 0.2)',
                    borderRadius: 'var(--radius)',
                    fontWeight: 700
                  }}
                >
                  Tolak
                </button>
              </>
            )}
            {isSuperAdmin && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Apakah Anda yakin ingin menghapus prospek "${p.name}"? Tindakan ini tidak dapat dibatalkan.`)) {
                    onDelete(p.id);
                  }
                }}
                className="btn"
                style={{ 
                  padding: '0.5rem 0.8rem', 
                  fontSize: '0.8rem', 
                  width: 'auto', 
                  minHeight: 'auto', 
                  margin: 0,
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                  borderRadius: 'var(--radius)',
                  fontWeight: 700
                }}
              >
                Hapus Prospek
              </button>
            )}
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            style={{ 
              padding: '0.5rem 1.5rem', 
              fontSize: '0.85rem',
              width: 'auto',
              borderRadius: 'var(--radius)',
              margin: 0
            }}
          >
            Tutup
          </button>
        </div>

      </div>

      {/* Custom Prompt Modal (pengganti window.prompt) */}
      <PromptModal
        isOpen={promptModal.open}
        {...promptConfig}
        onConfirm={handlePromptConfirm}
        onCancel={closePrompt}
        cancelText="Kembali"
      />
    </div>,
    document.body
  );
};

export default ProspectDetailModal;
