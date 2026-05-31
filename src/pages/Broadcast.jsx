import React, { useEffect, useState } from 'react';
import { getActiveMemo, saveActiveMemo } from '../services/db';
import { Megaphone } from '../components/Icons';
import CustomSelect from '../components/CustomSelect';
import Toast from '../components/Toast';

const Broadcast = () => {
  const [user, setUser] = useState({ username: '', role: 'Officer', name: 'User' });
  const [officers, setOfficers] = useState([
    { username: 'officer', name: 'Asep Marketing' },
    { username: 'officer_siti', name: 'Siti Funding' },
    { username: 'officer_budi', name: 'Budi Kredit' }
  ]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [memoTitle, setMemoTitle] = useState('');
  const [memoContent, setMemoContent] = useState('');
  const [memoRecipient, setMemoRecipient] = useState('all');

  const recipientOptions = [
    { value: 'all', label: 'Semua Officer (Siaran / Broadcast)' },
    ...officers.map(off => ({ value: off.username, label: `${off.name} (${off.username})` }))
  ];

  const loadData = async (recipient = memoRecipient) => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Fetch registered officers for the memo recipient dropdown
    const usersStr = localStorage.getItem('bjb-users');
    if (usersStr) {
      const allUsers = JSON.parse(usersStr);
      const officerList = allUsers.filter(u => u.role === 'Officer');
      setOfficers(officerList);
    }

    // Fetch and populate active memo broadcast
    const memo = getActiveMemo(recipient);
    if (memo) {
      setMemoTitle(memo.title);
      setMemoContent(memo.content);
    } else {
      setMemoTitle('');
      setMemoContent('');
    }
  };

  const handleSaveMemo = (e) => {
    e.preventDefault();
    if (!memoTitle.trim() || !memoContent.trim()) {
      setToast({ show: true, message: 'Harap lengkapi judul dan isi memo!', type: 'error' });
      return;
    }
    const success = saveActiveMemo(memoTitle, memoContent, user.name || user.username, memoRecipient);
    if (success) {
      setToast({ show: true, message: `Memo berhasil dipublikasikan khusus untuk ${memoRecipient === 'all' ? 'Seluruh Sales' : memoRecipient}!`, type: 'success' });
      loadData(memoRecipient);
    } else {
      setToast({ show: true, message: 'Gagal mempublikasikan memo.', type: 'error' });
    }
  };

  useEffect(() => {
    loadData(memoRecipient);
    const onFocus = () => loadData(memoRecipient);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [memoRecipient]);

  return (
    <div className="main-content" style={{ paddingBottom: '90px' }}>
      <div className="flex justify-between items-center mb-4">
        <h2>Broadcast Memo</h2>
      </div>

      <div className="card" style={{ padding: '1.5rem', animation: 'fadeIn 0.25s ease-out' }}>
        <h3 className="card-title" style={{ fontSize: '1.05rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--bjb-blue-dark)' }}>
          <Megaphone size={20} style={{ color: 'var(--bjb-blue)' }} />
          Kirim Memo & Pesan Satu Arah
        </h3>
        <p className="text-muted text-xs" style={{ marginBottom: '1.25rem', lineHeight: 1.45 }}>
          Kirim pengumuman, instruksi taktis, atau pesan khusus satu arah yang akan disiarkan langsung di bagian atas Dashboard untuk **Semua Officer** atau **Officer terpilih**.
        </p>
        <form onSubmit={handleSaveMemo}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Pilih Penerima Memo</label>
            <CustomSelect 
              value={memoRecipient}
              onChange={(e) => setMemoRecipient(e.target.value)}
              options={recipientOptions}
              style={{ height: '42px', fontSize: '0.88rem' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Judul Pengumuman / Memo</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Contoh: PENGUMUMAN AKAD MASSAL JUNI" 
              value={memoTitle} 
              onChange={(e) => setMemoTitle(e.target.value)} 
              style={{ height: '42px', fontSize: '0.88rem', boxSizing: 'border-box' }}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Isi Memo / Pesan</label>
            <textarea 
              className="form-textarea" 
              placeholder="Tulis instruksi taktis atau pesan khusus untuk sales lapangan disini..." 
              value={memoContent} 
              onChange={(e) => setMemoContent(e.target.value)} 
              style={{ minHeight: '120px', fontSize: '0.88rem', boxSizing: 'border-box', padding: '0.6rem 0.8rem' }}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.75rem', fontSize: '0.88rem' }}>
            📢 Publikasikan Memo Sekarang
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

export default Broadcast;
