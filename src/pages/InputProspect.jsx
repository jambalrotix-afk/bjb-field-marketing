import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Camera, Save, X } from '../components/Icons';
import { saveProspect } from '../services/db';
import Toast from '../components/Toast';
import CustomSelect from '../components/CustomSelect';

// Helper to format number to Rupiah
const formatRupiah = (value) => {
  if (!value) return '';
  const numberString = value.toString().replace(/[^0-9]/g, '');
  const sisa = numberString.length % 3;
  let rupiah = numberString.substr(0, sisa);
  const ribuan = numberString.substr(sisa).match(/\d{3}/g);

  if (ribuan) {
    const separator = sisa ? '.' : '';
    rupiah += separator + ribuan.join('.');
  }
  return rupiah ? 'Rp ' + rupiah : '';
};

// Helper to parse Rupiah string to Number
const parseRupiahToNumber = (rupiahString) => {
  if (!rupiahString) return 0;
  return parseInt(rupiahString.replace(/[^0-9]/g, ''), 10) || 0;
};

const InputProspect = () => {
  const navigate = useNavigate();

  const categoryOptions = [
    { value: 'Kredit', label: 'Kredit' },
    { value: 'Funding', label: 'Funding' }
  ];

  const tujuanKreditOptions = [
    { value: 'Modal Kerja', label: 'Modal Kerja' },
    { value: 'Investasi', label: 'Investasi' },
    { value: 'Konsumtif', label: 'Konsumtif' }
  ];

  const produkFundingOptions = [
    { value: 'Giro', label: 'Giro' },
    { value: 'Deposito', label: 'Deposito' },
    { value: 'Tabungan Bisnis', label: 'Tabungan Bisnis' }
  ];

  const statusOptions = [
    { value: 'Sosialisasi', label: '1. Sosialisasi' },
    { value: 'Pemberkasan', label: '2. Pemberkasan' },
    { value: 'Analisa', label: '3. Analisa' },
    { value: 'Approval', label: '4. Approval' },
    { value: 'Akad', label: '5. Akad (Closing)' }
  ];

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    location: '',
    category: 'Kredit',
    tujuanKredit: '',
    plafond: '',
    omzet: '',
    agunan: '',
    produkFunding: '',
    penempatanDana: '',
    sumberDana: '',
    status: 'Sosialisasi',
    catatan: '',
    tanggalKunjungan: new Date().toISOString().split('T')[0]
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCurrencyChange = (e) => {
    const { name, value } = e.target;
    // Format input as Rupiah on typing
    const cleanValue = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, [name]: formatRupiah(cleanValue) }));
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({ 
            ...prev, 
            location: `${position.coords.latitude}, ${position.coords.longitude}` 
          }));
          setIsLocating(false);
          showToast('Lokasi GPS berhasil didapatkan!', 'success');
        },
        (_error) => {
          showToast('Gagal mendapatkan lokasi. Silakan aktifkan GPS dan izinkan akses lokasi.', 'error');
          setIsLocating(false);
        }
      );
    } else {
      showToast('Geolokasi tidak didukung di perangkat ini.', 'error');
      setIsLocating(false);
    }
  };


  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      // Create local preview URL
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const createdBy = storedUser.username || 'unknown';
    
    // Parse currency strings back to numeric values for database storage
    const prospect = { 
      ...formData, 
      plafond: parseRupiahToNumber(formData.plafond),
      omzet: parseRupiahToNumber(formData.omzet),
      penempatanDana: parseRupiahToNumber(formData.penempatanDana),
      photoBlob: photo || null, // Save the File/Blob directly into IndexedDB
      createdBy
    };
    
    await saveProspect(prospect);
    showToast('Data prospek berhasil disimpan!', 'success');
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };


  return (
    <div className="main-content">
      <h2 className="mb-4">Input Prospek Baru</h2>
      
      <form onSubmit={handleSubmit} className="card">
        <h3 className="card-title mb-4">Informasi Umum</h3>
        
        <div className="form-group">
          <label className="form-label">Nama Lengkap / Perusahaan</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" required />
        </div>
        
        <div className="form-group">
          <label className="form-label">No. Telepon / WhatsApp</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="form-input" placeholder="Contoh: 08123456789" required />
        </div>
        
        <div className="form-group">
          <label className="form-label">Alamat Lengkap</label>
          <textarea name="address" value={formData.address} onChange={handleChange} className="form-textarea" required></textarea>
        </div>
        
        <div className="form-group">
          <label className="form-label">Titik Lokasi (GPS)</label>
          <div className="flex gap-2">
            <input type="text" name="location" value={formData.location} onChange={handleChange} className="form-input" placeholder="-6.9175, 107.6191" />
            <button type="button" onClick={handleGetLocation} className="btn btn-outline" disabled={isLocating}>
              <MapPin size={20} />
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Tanggal Kunjungan / Pertemuan</label>
          <input 
            type="date" 
            name="tanggalKunjungan" 
            value={formData.tanggalKunjungan} 
            onChange={handleChange} 
            className="form-input" 
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Kategori Kebutuhan</label>
          <CustomSelect 
            name="category" 
            value={formData.category} 
            onChange={handleChange} 
            options={categoryOptions} 
          />
        </div>


        <hr style={{ border: 'none', borderTop: 'var(--border-width) solid var(--border)', margin: '1.5rem 0' }} />

        {formData.category === 'Kredit' && (
          <div className="conditional-fields">
            <h3 className="card-title mb-4">Detail Kredit</h3>
            <div className="form-group">
              <label className="form-label">Tujuan Kredit</label>
              <CustomSelect 
                name="tujuanKredit" 
                value={formData.tujuanKredit} 
                onChange={handleChange} 
                options={tujuanKreditOptions} 
                placeholder="Pilih Tujuan"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estimasi Plafond (IDR)</label>
              <input type="text" name="plafond" value={formData.plafond} onChange={handleCurrencyChange} className="form-input" placeholder="Rp 0" required />
            </div>
            <div className="form-group">
              <label className="form-label">Estimasi Omzet Bulanan (IDR)</label>
              <input type="text" name="omzet" value={formData.omzet} onChange={handleCurrencyChange} className="form-input" placeholder="Rp 0" required />
            </div>
            <div className="form-group">
              <label className="form-label">Potensi Agunan</label>
              <input type="text" name="agunan" value={formData.agunan} onChange={handleChange} className="form-input" placeholder="Contoh: SHM Rumah" required />
            </div>
          </div>
        )}

        {formData.category === 'Funding' && (
          <div className="conditional-fields">
            <h3 className="card-title mb-4">Detail Funding</h3>
            <div className="form-group">
              <label className="form-label">Produk Diminati</label>
              <CustomSelect 
                name="produkFunding" 
                value={formData.produkFunding} 
                onChange={handleChange} 
                options={produkFundingOptions} 
                placeholder="Pilih Produk"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estimasi Penempatan Dana (IDR)</label>
              <input type="text" name="penempatanDana" value={formData.penempatanDana} onChange={handleCurrencyChange} className="form-input" placeholder="Rp 0" required />
            </div>
            <div className="form-group">
              <label className="form-label">Sumber Dana</label>
              <input type="text" name="sumberDana" value={formData.sumberDana} onChange={handleChange} className="form-input" placeholder="Contoh: Hasil Usaha" required />
            </div>
          </div>
        )}

        <hr style={{ border: 'none', borderTop: 'var(--border-width) solid var(--border)', margin: '1.5rem 0' }} />
        
        <h3 className="card-title mb-4">Dokumen Pendukung</h3>
        <div className="form-group">
          <label className="form-label">Foto KTP / Lokasi (Opsional)</label>
          {photoPreview ? (
            <div className="relative mb-3" style={{ position: 'relative', width: '100%', maxHeight: '200px', overflow: 'hidden', borderRadius: 'var(--radius)' }}>
              <img src={photoPreview} alt="Preview KTP" style={{ width: '100%', height: 'auto', objectFit: 'cover' }} />
              <button 
                type="button" 
                onClick={handleRemovePhoto} 
                style={{ 
                  position: 'absolute', 
                  top: '10px', 
                  right: '10px', 
                  backgroundColor: 'rgba(0,0,0,0.6)', 
                  border: 'none', 
                  borderRadius: '50%', 
                  color: 'white', 
                  padding: '5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="file-upload-wrapper w-full">
              <button type="button" className="btn btn-outline w-full justify-center">
                <Camera size={20} />
                Ambil Foto dari Kamera
              </button>
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} />
            </div>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: 'var(--border-width) solid var(--border)', margin: '1.5rem 0' }} />

        <h3 className="card-title mb-4">Status & Tindak Lanjut</h3>
        <div className="form-group">
          <label className="form-label">Status Prospek</label>
          <CustomSelect 
            name="status" 
            value={formData.status} 
            onChange={handleChange} 
            options={statusOptions} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Catatan Kunjungan</label>
          <textarea name="catatan" value={formData.catatan} onChange={handleChange} className="form-textarea" required placeholder="Catatan singkat hasil pertemuan..."></textarea>
        </div>

        <button type="submit" className="btn btn-primary w-full mt-4">
          <Save size={20} />
          Simpan Prospek
        </button>
      </form>

      <Toast 
        isOpen={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
};


export default InputProspect;
