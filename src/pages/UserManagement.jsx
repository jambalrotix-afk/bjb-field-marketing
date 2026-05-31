import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Trash2 } from '../components/Icons';
import { writeLog } from '../services/db';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import CustomSelect from '../components/CustomSelect';


const UserManagement = () => {
  const roleOptions = [
    { value: 'Officer', label: 'Officer (Sales Lapangan)' },
    { value: 'Manager', label: 'Manager (Pimpinan/Admin)' }
  ];

  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    role: 'Officer',
    password: 'bjb'
  });
  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });


  const loadUsers = () => {
    const storedUsers = localStorage.getItem('bjb-users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedUsername = formData.username.trim().toLowerCase();
    
    if (!trimmedUsername || !formData.name.trim()) {
      setError('Semua bidang wajib diisi!');
      return;
    }

    // Check if username already exists
    const exists = users.some(u => u.username === trimmedUsername);
    if (exists) {
      setError(`Username "${trimmedUsername}" sudah terdaftar!`);
      return;
    }

    const newUser = {
      username: trimmedUsername,
      name: formData.name.trim(),
      role: formData.role,
      password: formData.password
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('bjb-users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setSuccess(`Anggota baru "${newUser.name}" sebagai ${newUser.role} berhasil ditambahkan!`);
    
    // Write log
    await writeLog('CREATE_USER', `Mendaftarkan anggota baru: ${newUser.username} (${newUser.role} - ${newUser.name})`);

    // Reset form
    setFormData({
      username: '',
      name: '',
      role: 'Officer',
      password: 'bjb'
    });
  };

  const handleDeleteClick = (usernameToDelete) => {
    if (usernameToDelete === 'admin') {
      setToast({ show: true, message: 'Akun Super Admin Utama tidak dapat dihapus!', type: 'error' });
      return;
    }
    setUserToDelete(usernameToDelete);
    setIsDeleteModalOpen(true);
  };


  const handleConfirmDelete = async () => {
    if (userToDelete) {
      const updatedUsers = users.filter(u => u.username !== userToDelete);
      localStorage.setItem('bjb-users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      
      // Write log
      await writeLog('DELETE_USER', `Menghapus anggota: ${userToDelete}`);
      
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="main-content">
      <h2 style={{ marginBottom: 'var(--space-y)' }}>Kelola Anggota</h2>

      {/* Form Tambah User */}
      <div className="card">
        <h3 className="card-title">
          <UserPlus size={18} />
          Tambah Anggota Tim (Sales/Manager)
        </h3>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-cold)', padding: '0.75rem', borderRadius: 'var(--radius)', fontSize: '0.85rem', marginBottom: '1rem', border: '1.5px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)', color: 'var(--status-hot)', padding: '0.75rem', borderRadius: 'var(--radius)', fontSize: '0.85rem', marginBottom: '1rem', border: '1.5px solid rgba(22, 163, 74, 0.2)' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              name="username" 
              value={formData.username} 
              onChange={handleChange} 
              className="form-input" 
              placeholder="Contoh: officer_doni" 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              className="form-input" 
              placeholder="Contoh: Doni Setiawan" 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hak Akses / Peran</label>
            <CustomSelect 
              name="role" 
              value={formData.role} 
              onChange={handleChange} 
              options={roleOptions} 
            />
          </div>


          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              className="form-input" 
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary w-full mt-2">
            Tambah Anggota Baru
          </button>
        </form>
      </div>

      {/* Daftar Anggota */}
      <div className="card">
        <h3 className="card-title">
          <Users size={18} />
          Daftar Anggota Aktif ({users.length})
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: 'var(--border-width) solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Nama Lengkap</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Username</th>
                <th style={{ textAlign: 'center', padding: '0.5rem' }}>Role</th>
                <th style={{ textAlign: 'center', padding: '0.5rem' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.username} style={{ borderBottom: 'var(--border-width) solid var(--border)' }}>
                  <td style={{ padding: '0.5rem', fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{u.username}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <span className={`badge ${u.role === 'Super Admin' ? 'badge-hot' : u.role === 'Manager' ? 'badge-warm' : 'badge-cold'}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.35rem' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    {u.role !== 'Super Admin' ? (
                      <button 
                        onClick={() => handleDeleteClick(u.username)}
                        style={{ background: 'none', border: 'none', color: 'var(--status-cold)', cursor: 'pointer' }}
                        title="Hapus Anggota"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>Protected</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        title="Hapus Anggota?"
        message={`Apakah Anda yakin ingin menghapus user "${userToDelete}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        type="warning"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
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

export default UserManagement;
