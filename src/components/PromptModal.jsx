import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * PromptModal — pengganti window.prompt() yang custom & stylish.
 *
 * Props:
 *   isOpen        {boolean}   — tampilkan/sembunyikan modal
 *   title         {string}    — judul modal (misal: "Batalkan Prospek")
 *   label         {string}    — label di atas textarea/input
 *   placeholder   {string}    — placeholder teks
 *   icon          {string}    — emoji / karakter ikon di header (opsional)
 *   confirmText   {string}    — teks tombol konfirmasi (default: "Konfirmasi")
 *   cancelText    {string}    — teks tombol batal (default: "Batal")
 *   type          {string}    — 'danger' | 'warning' | 'default'
 *   onConfirm     {function}  — dipanggil dengan (value: string)
 *   onCancel      {function}  — dipanggil ketika dibatalkan
 */
const PromptModal = ({
  isOpen,
  title = 'Masukkan Alasan',
  label = 'Alasan (Opsional)',
  placeholder = 'Ketik alasan di sini...',
  icon = '📝',
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  type = 'default',
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue('');
      document.body.style.overflow = 'hidden';
      // Fokus ke textarea setelah animasi masuk
      setTimeout(() => textareaRef.current?.focus(), 80);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => { onConfirm?.(value.trim()); setValue(''); };
  const handleCancel = () => { onCancel?.(); setValue(''); };
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') handleCancel();
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleConfirm();
  };

  // Warna berdasarkan type
  const colors = {
    danger:  { accent: '#ef4444', bg: '#fee2e2', btnGrad: 'linear-gradient(135deg,#ef4444,#b91c1c)', shadow: 'rgba(239,68,68,0.28)' },
    warning: { accent: '#f97316', bg: '#fff7ed', btnGrad: 'linear-gradient(135deg,#f97316,#c2410c)', shadow: 'rgba(249,115,22,0.28)' },
    default: { accent: 'var(--bjb-blue)', bg: 'var(--surface-hover)', btnGrad: 'linear-gradient(135deg,var(--bjb-blue),var(--bjb-blue-dark))', shadow: 'rgba(var(--bjb-blue-rgb,30,90,180),0.22)' },
  };
  const c = colors[type] || colors.default;

  return createPortal(
    <div
      className="modal-overlay"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
    >
      <div
        className="modal-content"
        style={{ maxWidth: '420px', width: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem 1rem',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
        }}>
          <span style={{
            fontSize: '1.6rem',
            lineHeight: 1,
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))'
          }}>{icon}</span>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'Outfit, sans-serif', color: 'var(--bjb-blue-dark)', fontWeight: 700 }}>
            {title}
          </h3>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {label}
          </label>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            rows={3}
            style={{
              width: '100%',
              resize: 'none',
              padding: '0.65rem 0.85rem',
              fontSize: '0.88rem',
              color: 'var(--text-main)',
              backgroundColor: 'var(--surface)',
              border: `1.5px solid var(--border)`,
              borderRadius: '10px',
              fontFamily: 'inherit',
              lineHeight: 1.55,
              outline: 'none',
              transition: 'border-color 0.18s, box-shadow 0.18s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = c.accent;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${c.shadow}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
            Ctrl+Enter untuk konfirmasi · Esc untuk batal
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.875rem 1.5rem',
          borderTop: '1px solid var(--border-light)',
          backgroundColor: 'var(--surface-hover)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.65rem',
        }}>
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-outline"
            style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem', width: 'auto', minHeight: 'auto', margin: 0 }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-primary"
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.85rem',
              width: 'auto',
              minHeight: 'auto',
              margin: 0,
              background: c.btnGrad,
              boxShadow: `0 4px 12px ${c.shadow}`,
              fontWeight: 700,
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

export default PromptModal;
