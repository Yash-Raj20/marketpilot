import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface Option {
  value: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  icon?: any;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  icon?: any;
  className?: string;
  style?: React.CSSProperties;
  minWidth?: number | string;
  disabled?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  label,
  icon: Icon,
  className = '',
  style,
  minWidth,
  disabled = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div 
      className={`custom-select-container ${className} ${disabled ? 'disabled' : ''}`} 
      ref={containerRef}
      style={{ minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth, ...style }}
    >
      {label && <label className="custom-select-label">{label}</label>}
      
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <div className="trigger-left">
          {Icon && <Icon size={14} className="trigger-icon" />}
          <span className="trigger-text">
            {selectedOption ? selectedOption.label : (value ? value : placeholder)}
          </span>
          {selectedOption?.badge && (
            <span 
              className="trigger-badge"
              style={selectedOption.badgeColor ? { color: selectedOption.badgeColor, borderColor: selectedOption.badgeColor } : undefined}
            >
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown size={14} className={`trigger-chevron ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="custom-select-dropdown">
          <div className="custom-select-options">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              const OptIcon = opt.icon;
              return (
                <div
                  key={opt.value}
                  className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  <div className="option-content">
                    {OptIcon && <OptIcon size={14} className="option-icon" />}
                    <span className="option-label">{opt.label}</span>
                    {opt.badge && (
                      <span 
                        className="option-badge"
                        style={opt.badgeColor ? { color: opt.badgeColor, borderColor: opt.badgeColor } : undefined}
                      >
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={14} className="option-check" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
