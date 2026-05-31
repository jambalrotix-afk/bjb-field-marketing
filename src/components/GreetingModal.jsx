import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Sun, Moon, CloudSun } from 'lucide-react';

const GreetingModal = ({ isOpen, onClose, userName, userRole }) => {
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

  if (!isOpen) return null;

  // Get current time of day for custom greeting
  const getGreetingTime = () => {
    const hours = new Date().getHours();
    if (hours < 11) return { text: 'Selamat Pagi', icon: <Sun size={32} color="var(--bjb-blue)" /> };
    if (hours < 15) return { text: 'Selamat Siang', icon: <CloudSun size={32} color="var(--bjb-blue)" /> };
    if (hours < 18) return { text: 'Selamat Sore', icon: <CloudSun size={32} color="var(--bjb-blue)" /> };
    return { text: 'Selamat Malam', icon: <Moon size={32} color="var(--bjb-blue)" /> };
  };

  const greeting = getGreetingTime();

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '420px', 
          border: '1.5px solid var(--border-light)',
          animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          background: 'linear-gradient(180deg, var(--surface) 0%, rgba(248, 250, 252, 0.95) 100%)',
          borderRadius: '24px'
        }}
      >
        <div style={{ padding: '2rem 1.5rem 1.5rem', textAlign: 'center', overflowY: 'auto', flex: 1 }}>
          {/* Greeting Icon Header */}
          <div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '72px', 
              height: '72px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, rgba(10, 46, 92, 0.05), rgba(252, 196, 25, 0.1))',
              marginBottom: '1.25rem',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)'
            }}
          >
            {greeting.icon}
          </div>

          <h3 
            style={{ 
              margin: '0 0 0.5rem', 
              fontSize: '1.4rem', 
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 700,
              color: 'var(--bjb-blue)'
            }}
          >
            {greeting.text}, {userName}!
          </h3>
          
          <div 
            style={{ 
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              backgroundColor: 'rgba(10, 46, 92, 0.06)',
              color: 'var(--bjb-blue)',
              fontSize: '0.8rem',
              fontWeight: 600,
              fontFamily: 'Outfit, sans-serif',
              marginBottom: '1rem'
            }}
          >
            Hak Akses: {userRole}
          </div>

          <p 
            style={{ 
              color: 'var(--text-muted)', 
              fontSize: '0.9rem', 
              lineHeight: 1.6,
              margin: '0 0 1.5rem',
              padding: '0 0.5rem'
            }}
          >
            Selamat beraktivitas di lapangan. Tetap jaga kesehatan, patuhi protokol, dan mari bersama-sama capai target kinerja terbaik hari ini bersama bank bjb!
          </p>

          <button 
            className="btn btn-primary w-full"
            onClick={onClose}
            style={{ 
              padding: '0.8rem', 
              fontSize: '0.95rem',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Sparkles size={18} />
            Mulai Aktivitas
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GreetingModal;
