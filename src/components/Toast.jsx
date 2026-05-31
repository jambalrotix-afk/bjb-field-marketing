import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertOctagon, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', isOpen, onClose, duration = 3000 }) => {
  const [isHiding, setIsHiding] = useState(false);

  const handleClose = useCallback(() => {
    setIsHiding(true);
    setTimeout(() => {
      onClose();
      setIsHiding(false);
    }, 300); // matches the slideOut animation duration
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    setIsHiding(false);
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [isOpen, duration, handleClose]);

  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle2 size={18} />,
    error: <AlertOctagon size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />
  };

  return createPortal(
    <div className="toast-container">
      <div className={`toast toast-${type} ${isHiding ? 'hide' : ''}`}>
        <div className="toast-icon">{icons[type]}</div>
        <div style={{ flex: 1, paddingRight: '0.5rem', lineHeight: 1.4 }}>
          {message}
        </div>
        <button 
          onClick={handleClose} 
          className="toast-close-btn"
        >
          <X size={14} />
        </button>
      </div>
    </div>,
    document.body
  );
};

export default Toast;
