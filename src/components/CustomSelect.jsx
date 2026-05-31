import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({ name, options, value, onChange, placeholder = 'Pilih...', _required = false, style = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (val) => {
    onChange({ 
      target: { 
        name, 
        value: val 
      } 
    });
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div 
      className="custom-select-container" 
      ref={containerRef}
      style={{ position: 'relative', width: '100%', zIndex: isOpen ? 9999 : 1, ...style }}
    >
      {/* Trigger Box */}
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          padding: style.padding || '0 1.05rem',
          backgroundColor: 'var(--surface)',
          border: '1.5px solid var(--border)',
          borderRadius: style.borderRadius || '12px',
          fontFamily: 'Outfit, sans-serif',
          fontSize: style.fontSize || '0.9rem',
          fontWeight: 500,
          color: value ? 'var(--text-dark)' : 'var(--text-muted)',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(10, 46, 92, 0.15)' : 'none',
          borderColor: isOpen ? 'var(--bjb-blue)' : 'var(--border)',
          height: style.height || '46px',
          boxSizing: 'border-box'
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown 
          size={16} 
          style={{ 
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--text-muted)'
          }} 
        />
      </div>

      {/* Options Dropdown Card */}
      {isOpen && (
        <div 
          className="custom-select-options-list"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: '100%',
            width: 'max-content',
            zIndex: 999,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-light)',
            borderRadius: '14px',
            boxShadow: 'var(--shadow-lg), 0 10px 25px -5px rgba(0,0,0,0.05)',
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '6px',
            animation: 'slideUp 0.15s ease-out'
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleOptionClick(opt.value)}
                style={{
                  padding: '0.6rem 0.85rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: isSelected ? 600 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: isSelected ? 'var(--bjb-blue)' : 'var(--text-dark)',
                  backgroundColor: isSelected ? 'rgba(10, 46, 92, 0.05)' : 'transparent',
                  transition: 'background-color 0.15s ease',
                  marginBottom: '2px',
                  whiteSpace: 'nowrap',
                  gap: '12px'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} color="var(--bjb-blue)" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
