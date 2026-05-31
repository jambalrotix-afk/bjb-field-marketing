import React, { useEffect, useState } from 'react';
import { getAllLogs, clearLogs } from '../services/db';
import { Filter, History, Trash2 } from '../components/Icons';
import ConfirmModal from '../components/ConfirmModal';
import CustomSelect from '../components/CustomSelect';

const actionOptions = [
  { value: 'All', label: 'Semua Aksi' },
  { value: 'LOGIN', label: 'LOGIN' },
  { value: 'LOGOUT', label: 'LOGOUT' },
  { value: 'CREATE_PROSPECT', label: 'CREATE_PROSPECT' },
  { value: 'CREATE_USER', label: 'CREATE_USER' },
  { value: 'DELETE_USER', label: 'DELETE_USER' },
  { value: 'SYNC_DATA', label: 'SYNC_DATA' }
];


const ActionBadge = ({ action }) => {
// ... badge logic ...
  let style;
  switch (action) {
    case 'LOGIN':
      style = { backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe' }; // Blue
      break;
    case 'LOGOUT':
      style = { backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }; // Slate
      break;
    case 'CREATE_PROSPECT':
      style = { backgroundColor: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }; // Green
      break;
    case 'CREATE_USER':
      style = { backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }; // Amber
      break;
    case 'DELETE_USER':
      style = { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }; // Red
      break;
    case 'SYNC_DATA':
      style = { backgroundColor: '#f3e8ff', color: '#6b21a8', borderColor: '#e9d5ff' }; // Purple
      break;
    default:
      style = { backgroundColor: '#f1f5f9', color: '#0f172a', borderColor: '#cbd5e1' };
  }

  return (
    <span className="badge" style={{ ...style, fontSize: '0.7rem', padding: '0.15rem 0.35rem', textTransform: 'none' }}>
      {action}
    </span>
  );
};

const ActivityLogs = () => {
  const [currentUser, setCurrentUser] = useState({ role: 'Officer' });
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }

    const data = await getAllLogs();
    setLogs(data);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, []);

  // Filter logs & Reset page
  useEffect(() => {
    let result = logs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(log => 
        (log.name && log.name.toLowerCase().includes(query)) ||
        (log.username && log.username.toLowerCase().includes(query)) ||
        (log.details && log.details.toLowerCase().includes(query))
      );
    }

    if (actionFilter !== 'All') {
      result = result.filter(log => log.action === actionFilter);
    }

    setFilteredLogs(result);
    setCurrentPage(1);
  }, [logs, searchQuery, actionFilter]);

  const handleClearLogsClick = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmClear = async () => {
    setIsConfirmOpen(false);
    await clearLogs();
    loadData();
  };

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const reversedLogs = [...filteredLogs].reverse();
  const currentLogs = reversedLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  return (
    <div className="main-content">
      <div className="flex justify-between items-center mb-4">
        <h2>Riwayat & Log Aktivitas</h2>
        {currentUser.role === 'Super Admin' && (
          <button 
            onClick={handleClearLogsClick} 
            className="btn btn-outline flex items-center gap-2" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--status-cold)', borderColor: 'var(--status-cold)', width: 'auto', marginBottom: 0 }}
          >
            <Trash2 size={16} />
            <span>Hapus Log</span>
          </button>
        )}
      </div>

      {/* Filter panel */}
      <div className="card card-filter" style={{ padding: '1rem' }}>
        <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} />
          Pencarian Log
        </h3>
        <div className="flex gap-2">
          <div style={{ flex: 2 }}>
            <input 
              type="text" 
              placeholder="Cari nama, username, detail..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.9rem', height: '46px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <CustomSelect 
              value={actionFilter} 
              onChange={(e) => setActionFilter(e.target.value)} 
              options={actionOptions}
            />
          </div>

        </div>
      </div>

      {/* Log list */}
      <div className="card" style={{ padding: '0.75rem 1rem' }}>
        <h3 className="card-title" style={{ fontSize: '1rem', borderBottom: 'none', paddingBottom: 0, marginBottom: '0.75rem' }}>
          <History size={18} />
          Catatan Aktivitas ({filteredLogs.length})
        </h3>
        
        {filteredLogs.length === 0 ? (
          <div className="text-center text-muted text-sm" style={{ padding: '2rem 0' }}>Tidak ada log aktivitas terdeteksi.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            {currentLogs.map((log, index) => {
              const formattedTime = log.timestamp ? new Date(log.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-';
              
              return (
                <div 
                  key={log.id} 
                  style={{ 
                    padding: '0.35rem 0.6rem', 
                    borderBottom: index < currentLogs.length - 1 ? '1px solid var(--border-light)' : 'none', 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    fontSize: '0.74rem',
                    flexWrap: 'wrap',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Left part: Time, User & Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', whiteSpace: 'nowrap', minWidth: '85px' }}>
                      {formattedTime}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--bjb-blue-dark)', whiteSpace: 'nowrap' }}>
                      {log.username}
                    </span>
                    <ActionBadge action={log.action} />
                    <span style={{ color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: '150px', flex: 1 }}>
                      {log.details}
                    </span>
                  </div>

                  {/* Right part: Display User's full name compactly */}
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {log.name}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination controls */}
        {filteredLogs.length > itemsPerPage && (
          <div className="flex justify-between items-center" style={{ marginTop: '1rem', padding: '0.5rem 0', borderTop: 'var(--border-width) solid var(--border)' }}>
            <button 
              type="button" 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn btn-outline"
              style={{ width: 'auto', padding: '0.35rem 0.7rem', fontSize: '0.8rem', marginBottom: 0 }}
            >
              Sebelumnya
            </button>
            <span className="text-sm font-semibold" style={{ fontSize: '0.8rem' }}>
              Halaman {currentPage} dari {totalPages || 1}
            </span>
            <button 
              type="button" 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="btn btn-outline"
              style={{ width: 'auto', padding: '0.35rem 0.7rem', fontSize: '0.8rem', marginBottom: 0 }}
            >
              Berikutnya
            </button>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        title="Hapus Seluruh Log?"
        message="Apakah Anda yakin ingin menghapus seluruh riwayat log aktivitas? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus Log"
        cancelText="Batal"
        type="warning"
        onConfirm={handleConfirmClear}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};

export default ActivityLogs;
