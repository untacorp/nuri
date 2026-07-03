import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string | null;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
}

export default function CustomDropdown({ value, options, onChange, className = '' }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-[22px] bg-bg-card border border-border-main px-2.5 py-0 text-text-main hover:border-border-hover transition-colors font-mono text-[10px] font-bold flex items-center gap-1.5 cursor-pointer rounded-none select-none"
      >
        <span>{selectedOption ? selectedOption.label : 'Pilih...'}</span>
        <ChevronDown size={10} className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1 min-w-full bg-bg-card border border-border-main shadow-lg z-50 py-0.5 font-mono text-[10px] rounded-none max-h-48 overflow-y-auto">
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 hover:bg-bg-input transition-colors cursor-pointer rounded-none block ${
                option.value === value ? 'text-text-main font-bold bg-bg-input' : 'text-text-muted hover:text-text-main'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
