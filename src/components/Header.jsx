import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, WifiOff, LogOut, UserCheck } from './Icons';
import { syncData } from '../services/syncService';
import { writeLog } from '../services/db';
import ConfirmModal from './ConfirmModal';

const Header = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [userData, setUserData] = useState({ name: 'User', role: 'Officer' });

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    // Get logged in user details
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }

    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      await syncData();
      setIsSyncing(false);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    // Write log before clearing session
    await writeLog('LOGOUT', 'Melakukan logout dari aplikasi.');
    localStorage.removeItem('user');
    sessionStorage.removeItem('has_greeted');
    navigate('/login');
  };


  return (
    <header className="header" style={{ padding: '0.6rem 1rem' }}>
      <div className="flex flex-col">
        <h1 className="header-title" style={{ fontSize: '1.15rem', lineHeight: 1.1 }}>
          <span style={{ color: 'var(--bjb-gold)', fontWeight: 800 }}>bjb</span> Field
        </h1>
        <div className="header-user-badge" title={`${userData.name} (${userData.role})`}>
          <UserCheck size={11} style={{ flexShrink: 0 }} />
          <span>{userData.name} ({userData.role})</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="header-status-badge">
          {isSyncing ? (
            <span style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>Syncing...</span>
          ) : isOnline ? (
            <>
              <Wifi size={14} color="var(--status-hot)" style={{ flexShrink: 0 }} />
              <span className="header-status-text" style={{ color: 'var(--status-hot)' }}>Online</span>
            </>
          ) : (
            <>
              <WifiOff size={14} color="var(--status-cold)" style={{ flexShrink: 0 }} />
              <span className="header-status-text" style={{ color: 'var(--status-cold)' }}>Offline</span>
            </>
          )}
        </div>

        <button 
          onClick={handleLogoutClick} 
          style={{ 
            background: 'rgba(255, 255, 255, 0.08)', 
            border: '1px solid rgba(255, 255, 255, 0.05)', 
            color: 'white', 
            cursor: 'pointer',
            padding: '0.35rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Keluar"
        >
          <LogOut size={15} />
        </button>
      </div>

      <ConfirmModal 
        isOpen={isLogoutModalOpen}
        title="Konfirmasi Logout"
        message="Apakah Anda yakin ingin keluar dari sesi ini? Anda harus login kembali untuk masuk."
        confirmText="Keluar"
        cancelText="Batal"
        type="warning"
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </header>
  );
};

export default Header;
