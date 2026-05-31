import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Batal', type = 'warning' }) => {
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

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          {type === 'warning' && <AlertTriangle size={24} color="var(--status-cold)" />}
          {type === 'info' && <AlertTriangle size={24} color="var(--bjb-blue)" />}
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Outfit, sans-serif' }}>{title}</h3>
        </div>
        
        <div className="modal-body">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>
        
        <div className="modal-actions">
          <button 
            className="btn btn-outline" 
            onClick={onCancel}
            style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem' }}
          >
            {cancelText}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={onConfirm}
            style={{ 
              flex: 1, 
              padding: '0.6rem', 
              fontSize: '0.9rem',
              background: type === 'warning' ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : '',
              color: type === 'warning' ? 'white' : '',
              boxShadow: type === 'warning' ? '0 4px 12px rgba(239, 68, 68, 0.25)' : ''
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;

