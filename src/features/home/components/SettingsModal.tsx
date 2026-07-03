import { useState, useEffect } from 'react';
import { X, Settings } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [autoCompileDefault, setAutoCompileDefault] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('nuri_auto_compile_default');
      setAutoCompileDefault(saved === 'true');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('nuri_auto_compile_default', String(autoCompileDefault));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs font-mono">
      <div 
        className="w-full max-w-md bg-bg-card border border-border-main p-6 text-text-main flex flex-col gap-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-main pb-4">
          <div className="flex items-center gap-2">
            <Settings className="text-text-main" size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider">Pengaturan Global</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-text-muted hover:text-text-main transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4 p-3 bg-bg-main border border-border-main">
            <div className="flex flex-col gap-1">
              <label htmlFor="auto-compile-toggle" className="text-xs font-bold uppercase tracking-wider text-text-main cursor-pointer">
                Auto-Compile Global
              </label>
              <p className="text-[10px] text-text-muted leading-relaxed">
                Jika diaktifkan, setiap kali Anda menyimpan draf, sistem akan otomatis melakukan kompilasi file & dokumen utama.
              </p>
            </div>
            <div className="flex items-center pt-1">
              <input
                id="auto-compile-toggle"
                type="checkbox"
                checked={autoCompileDefault}
                onChange={(e) => setAutoCompileDefault(e.target.checked)}
                className="w-4 h-4 accent-accent bg-bg-input border-border-main rounded-none cursor-pointer focus:ring-0 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-border-main">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs uppercase tracking-wider border border-border-main hover:bg-bg-input transition-colors rounded-none cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs uppercase tracking-wider bg-accent text-accent-foreground border border-accent hover:bg-accent-hover transition-colors rounded-none font-bold cursor-pointer"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
