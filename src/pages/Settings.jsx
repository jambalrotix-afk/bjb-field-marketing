import React, { useEffect, useState } from 'react';
import { getTimelineTargets, saveTimelineTargets, getTargetAlertSettings, saveTargetAlertSettings } from '../services/db';
import { Settings as SettingsIcon, Target } from '../components/Icons';
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

const Settings = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [targetTimeline, setTargetTimeline] = useState('');
  const [targetKreditInput, setTargetKreditInput] = useState('');
  const [targetFundingInput, setTargetFundingInput] = useState('');
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(70);

  // Helper to format input real-time with dot thousand separators
  const formatNumberString = (value) => {
    if (value === null || value === undefined) return '';
    const clean = value.toString().replace(/[^0-9]/g, '');
    if (!clean) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(clean, 10));
  };

  // Helper to convert formatted string back to a clean number for DB storage
  const parseStringToNumber = (valueStr) => {
    if (!valueStr) return 0;
    const clean = valueStr.toString().replace(/\./g, '');
    return parseInt(clean, 10) || 0;
  };

  const loadData = () => {
    const activeTargets = getTimelineTargets();
    if (activeTargets) {
      setTargetTimeline(activeTargets.timeline);
      setTargetKreditInput(formatNumberString(activeTargets.targetKredit));
      setTargetFundingInput(formatNumberString(activeTargets.targetFunding));
    }

    const alertSettings = getTargetAlertSettings();
    if (alertSettings) {
      setAlertEnabled(alertSettings.alertEnabled);
      setAlertThreshold(alertSettings.alertThreshold);
    }
  };

  const handleSaveTargets = (e) => {
    e.preventDefault();
    const kreditNum = parseStringToNumber(targetKreditInput);
    const fundingNum = parseStringToNumber(targetFundingInput);

    if (!targetTimeline.trim() || !kreditNum || !fundingNum) {
      setToast({ show: true, message: 'Harap lengkapi semua bidang target!', type: 'error' });
      return;
    }
    const success = saveTimelineTargets(targetTimeline, kreditNum, fundingNum);
    if (success) {
      setToast({ show: true, message: 'Pengaturan target & timeline berhasil disimpan!', type: 'success' });
      loadData();
    } else {
      setToast({ show: true, message: 'Gagal menyimpan pengaturan target.', type: 'error' });
    }
  };

  const handleSaveAlerts = (e) => {
    e.preventDefault();
    if (alertThreshold < 0 || alertThreshold > 100) {
      setToast({ show: true, message: 'Batas persentase alert harus antara 0% dan 100%!', type: 'error' });
      return;
    }
    const success = saveTargetAlertSettings(alertEnabled, alertThreshold);
    if (success) {
      setToast({ show: true, message: 'Pengaturan alert target berhasil disimpan!', type: 'success' });
      loadData();
    } else {
      setToast({ show: true, message: 'Gagal menyimpan pengaturan alert target.', type: 'error' });
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, []);

  return (
    <div className="main-content" style={{ paddingBottom: '90px' }}>
      <div className="flex justify-between items-center mb-4">
        <h2>Pengaturan</h2>
      </div>

      <div className="card" style={{ padding: '1.5rem', animation: 'fadeIn 0.25s ease-out' }}>
        <h3 className="card-title" style={{ fontSize: '1.05rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--bjb-blue-dark)' }}>
          <SettingsIcon size={20} style={{ color: 'var(--bjb-blue)' }} />
          Pengaturan Target Capaian & Periode Timeline
        </h3>
        <p className="text-muted text-xs" style={{ marginBottom: '1.25rem', lineHeight: 1.45 }}>
          Atur target volume transaksi (plafond Kredit dan nominal Funding) serta tentukan periode target aktif yang sedang berjalan.
        </p>
        <form onSubmit={handleSaveTargets}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Periode Aktif Target (Timeline)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Contoh: Juni 2026" 
              value={targetTimeline} 
              onChange={(e) => setTargetTimeline(e.target.value)} 
              style={{ height: '42px', fontSize: '0.88rem', boxSizing: 'border-box' }}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}>Target Kredit (Plafond)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Contoh: 500.000.000" 
                value={targetKreditInput} 
                onChange={(e) => setTargetKreditInput(formatNumberString(e.target.value))} 
                style={{ height: '42px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                required
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px', fontWeight: 600 }}>
                Setara: {formatRupiah(parseStringToNumber(targetKreditInput))}
              </span>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}>Target Funding (Dana)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Contoh: 1.500.000.000" 
                value={targetFundingInput} 
                onChange={(e) => setTargetFundingInput(formatNumberString(e.target.value))} 
                style={{ height: '42px', fontSize: '0.88rem', boxSizing: 'border-box' }}
                required
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px', fontWeight: 600 }}>
                Setara: {formatRupiah(parseStringToNumber(targetFundingInput))}
              </span>
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.75rem', fontSize: '0.88rem' }}>
            🎯 Simpan & Terapkan Target Baru
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginTop: '1.25rem', animation: 'fadeIn 0.25s ease-out' }}>
        <h3 className="card-title" style={{ fontSize: '1.05rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--bjb-blue-dark)' }}>
          <Target size={20} style={{ color: 'var(--bjb-blue)' }} />
          Pemberitahuan & Alert Target
        </h3>
        <p className="text-muted text-xs" style={{ marginBottom: '1.25rem', lineHeight: 1.45 }}>
          Konfigurasikan batas peringatan ketercapaian target bulanan. Jika pencapaian target sales berada di bawah batas ini, sistem akan menampilkan peringatan taktis di Dashboard sales marketing.
        </p>
        <form onSubmit={handleSaveAlerts}>
          <div className="form-group" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="checkbox" 
              id="alertEnabled" 
              checked={alertEnabled} 
              onChange={(e) => setAlertEnabled(e.target.checked)} 
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="alertEnabled" style={{ fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-dark)' }}>
              Aktifkan Peringatan Ketercapaian Target di Dashboard
            </label>
          </div>

          {alertEnabled && (
            <div className="form-group" style={{ marginBottom: '1.25rem', animation: 'fadeIn 0.2s ease-out' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                Batas Minimal Persentase Target (Threshold): {alertThreshold}%
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  step="5"
                  value={alertThreshold} 
                  onChange={(e) => setAlertThreshold(Number(e.target.value))} 
                  style={{ flex: 1, height: '6px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, minWidth: '40px', color: 'var(--bjb-blue-dark)' }}>
                  {alertThreshold}%
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px', fontWeight: 600 }}>
                Sistem akan menampilkan peringatan kuning jika pencapaian Kredit atau Funding sales di bawah {alertThreshold}%.
              </span>
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.75rem', fontSize: '0.88rem' }}>
            🔔 Simpan Pengaturan Alert
          </button>
        </form>
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

export default Settings;
