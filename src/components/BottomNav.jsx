import React, { useEffect, useState, useCallback } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Kanban, FilePlus2, BarChart3, Users, History, Folder, MoreHorizontal, X, Megaphone, Settings } from './Icons';
import { getAllProspects } from '../services/db';

const BottomNav = () => {
  const [role, setRole] = useState('Officer');
  const [username, setUsername] = useState('');
  const [offlineCount, setOfflineCount] = useState(0);    // Unsynced prospects
  const [urgentCount, setUrgentCount] = useState(0);      // Approval + Akad stage
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();

  const loadBadgeCounts = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const currentUser = JSON.parse(userStr);

      const allProspects = await getAllProspects();

      // Role-based filter: officer only sees own prospects
      const myProspects = (currentUser.role === 'Manager' || currentUser.role === 'Super Admin')
        ? allProspects
        : allProspects.filter(p => p.createdBy === currentUser.username);

      // Badge 1: Offline/unsynced count
      const offline = myProspects.filter(p => !p.synced).length;
      setOfflineCount(offline);

      // Badge 2: Urgent – Approval or Akad (needs action / closing)
      const urgent = myProspects.filter(p =>
        p.status === 'Approval' || p.status === 'Akad'
      ).length;
      setUrgentCount(urgent);
    } catch (err) {
      console.error('Badge count error:', err);
    }
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setRole(user.role || 'Officer');
      setUsername(user.username || '');
    }
    loadBadgeCounts();
  }, [location, loadBadgeCounts]);

  // Refresh badges when window regains focus or goes online
  useEffect(() => {
    window.addEventListener('focus', loadBadgeCounts);
    window.addEventListener('online', loadBadgeCounts);
    return () => {
      window.removeEventListener('focus', loadBadgeCounts);
      window.removeEventListener('online', loadBadgeCounts);
    };
  }, [loadBadgeCounts]);

  // Close drawer on navigation
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location]);

  // Check if any of the hidden drawer pages are currently active to highlight the "Lainnya" tab
  const isMoreActive = ['/directory', '/users', '/logs', '/broadcast', '/settings'].includes(location.pathname);

  return (
    <>
      <nav className="bottom-nav">
        {/* Dashboard */}
        <NavLink
          to="/"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          end
        >
          <div style={{ display: 'inline-flex' }}>
            <LayoutDashboard size={20} />
          </div>
          <span>Dashboard</span>
          {offlineCount > 0 && (
            <span className="nav-badge nav-badge-red" style={{ top: '4px', right: '4px' }}>
              {offlineCount > 9 ? '9+' : offlineCount}
            </span>
          )}
        </NavLink>

        {/* Pipeline */}
        <NavLink
          to="/pipeline"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <div style={{ display: 'inline-flex' }}>
            <Kanban size={20} />
          </div>
          <span>Pipeline</span>
          {urgentCount > 0 && (
            <span className="nav-badge nav-badge-blue" style={{ top: '4px', right: '4px' }}>
              {urgentCount > 9 ? '9+' : urgentCount}
            </span>
          )}
        </NavLink>

        {/* Operasional Utama Berdasarkan Peran */}
        {role === 'Officer' ? (
          <NavLink
            to="/input"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <FilePlus2 size={20} />
            </div>
            <span>Input Prospek</span>
          </NavLink>
        ) : (
          <NavLink
            to="/performance"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <BarChart3 size={20} />
            </div>
            <span>Kinerja Tim</span>
          </NavLink>
        )}

        {/* Tab Lainnya (More Tab) */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className={`nav-item ${isMoreActive ? 'active' : ''}`}
          style={{ border: 'none', outline: 'none' }}
        >
          <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
            <MoreHorizontal size={20} />
          </div>
          <span>Lainnya</span>
        </button>
      </nav>

      {/* Modern Slide-Up Bottom Sheet Drawer */}
      {isDrawerOpen && (
        <div className="more-sheet-overlay" onClick={() => setIsDrawerOpen(false)}>
          <div className="more-sheet-content" onClick={(e) => e.stopPropagation()}>
            <div className="more-sheet-header">
              <div className="more-sheet-drag-handle" />
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="more-sheet-title">Menu Lainnya</h3>
                <button 
                  type="button" 
                  onClick={() => setIsDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="more-sheet-grid">
              {/* Arsip & Klien - Accessible to all roles */}
              <Link to="/directory" className="more-sheet-item">
                <div className="more-sheet-item-icon">
                  <Folder size={20} />
                </div>
                <span className="more-sheet-item-label">Arsip & Klien</span>
                <span className="more-sheet-item-desc">Semua klien & prospek</span>
              </Link>

              {/* Kelola Anggota - Super Admin only */}
              {role === 'Super Admin' && (
                <Link to="/users" className="more-sheet-item">
                  <div className="more-sheet-item-icon">
                    <Users size={20} />
                  </div>
                  <span className="more-sheet-item-label">Kelola Anggota</span>
                  <span className="more-sheet-item-desc">Atur sales marketing</span>
                </Link>
              )}

              {/* Aktivitas - Manager & Super Admin */}
              {(role === 'Manager' || role === 'Super Admin') && (
                <Link to="/logs" className="more-sheet-item">
                  <div className="more-sheet-item-icon">
                    <History size={20} />
                  </div>
                  <span className="more-sheet-item-label">Aktivitas</span>
                  <span className="more-sheet-item-desc">Log riwayat sistem</span>
                </Link>
              )}

              {/* Broadcast - Manager & Super Admin */}
              {(role === 'Manager' || role === 'Super Admin') && (
                <Link to="/broadcast" className="more-sheet-item">
                  <div className="more-sheet-item-icon">
                    <Megaphone size={20} />
                  </div>
                  <span className="more-sheet-item-label">Broadcast</span>
                  <span className="more-sheet-item-desc">Kirim memo satu arah</span>
                </Link>
              )}

              {/* Settings - Manager & Super Admin */}
              {(role === 'Manager' || role === 'Super Admin') && (
                <Link to="/settings" className="more-sheet-item">
                  <div className="more-sheet-item-icon">
                    <Settings size={20} />
                  </div>
                  <span className="more-sheet-item-label">Settings</span>
                  <span className="more-sheet-item-desc">Atur target & timeline</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNav;
