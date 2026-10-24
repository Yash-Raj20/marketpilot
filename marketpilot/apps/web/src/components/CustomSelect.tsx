import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps<T extends string> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (val: T) => void;
  icon?: React.ReactNode;
  minWidth?: string | number;
}

export function CustomSelect<T extends string>({
  value,
  options,
  onChange,
  icon,
  minWidth = 160
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div 
      className="custom-dropdown-container" 
      ref={containerRef}
      style={{ minWidth }}
    >
      <button
        type="button"
        className={`custom-dropdown-trigger ${isOpen ? 'active-open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {icon && <span className="dropdown-trigger-icon">{icon}</span>}
        <span className="dropdown-trigger-label">{selectedOption?.label || value}</span>
        <ChevronDown 
          size={14} 
          className={`dropdown-trigger-chevron ${isOpen ? 'rotated' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="custom-dropdown-menu" role="listbox">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                className={`custom-dropdown-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.icon && (
                  <span className="dropdown-item-icon">{option.icon}</span>
                )}
                <span className="dropdown-item-text">{option.label}</span>
                {option.badge && (
                  <span className="dropdown-item-badge">{option.badge}</span>
                )}
                {isSelected && (
                  <Check size={14} className="dropdown-check-icon" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
