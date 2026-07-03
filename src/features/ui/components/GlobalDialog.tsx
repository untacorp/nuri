import { X } from 'lucide-react';
import { useGlobalDialog } from '../hooks/useGlobalDialog';

export interface DialogDetail {
  type: 'prompt' | 'confirm' | 'alert' | 'mathPrompt';
  title: string;
  defaultValue?: string;
  message?: string;
  resolve: (value: any) => void;
}

declare global {
  interface WindowEventMap {
    'global-dialog': CustomEvent<DialogDetail>;
  }
}

export const showPrompt = (title: string, defaultValue = ''): Promise<string | null> => {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent<DialogDetail>('global-dialog', {
      detail: { type: 'prompt', title, defaultValue, resolve }
    }));
  });
};

export const showMathPrompt = (title: string, defaultValue = ''): Promise<{ latex: string; isBlock: boolean } | null> => {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent<DialogDetail>('global-dialog', {
      detail: { type: 'mathPrompt', title, defaultValue, resolve }
    }));
  });
};

export const showConfirm = (title: string, message = ''): Promise<boolean> => {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent<DialogDetail>('global-dialog', {
      detail: { type: 'confirm', title, message, resolve }
    }));
  });
};

export const showAlert = (title: string, message = ''): Promise<boolean> => {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent<DialogDetail>('global-dialog', {
      detail: { type: 'alert', title, message, resolve }
    }));
  });
};

export default function GlobalDialog() {
  const {
    dialog,
    inputValue,
    setInputValue,
    isBlockMath,
    setIsBlockMath,
    handleClose,
    handleConfirm
  } = useGlobalDialog();

  if (!dialog) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-bg-card rounded-none w-full max-w-md overflow-hidden border-2 border-border-main scale-100 transition-transform shadow-2xl">
        <div className="px-6 py-5 border-b border-border-main flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-text-main tracking-wider font-mono">
              {dialog.title}
            </h3>
          </div>
          <button onClick={handleClose} className="p-1.5 text-text-muted hover:text-text-main hover:bg-bg-input rounded-none border border-transparent hover:border-border-main transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-4">
          {dialog.message && (
            <p className="text-xs font-mono text-text-muted whitespace-pre-wrap">{dialog.message}</p>
          )}
          {dialog.type === 'prompt' && (
            <input 
              autoFocus
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
              className="w-full bg-bg-input border border-border-main rounded-none px-4 py-3 text-text-main focus:outline-none focus:border-text-main transition-colors font-mono text-sm"
            />
          )}
          {dialog.type === 'mathPrompt' && (
            <div className="flex flex-col gap-4">
              <input 
                autoFocus
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
                placeholder="Masukkan rumus LaTeX (contoh: E = mc^2)"
                className="w-full bg-bg-input border border-border-main rounded-none px-4 py-3 text-text-main focus:outline-none focus:border-text-main transition-colors font-mono text-sm"
              />
              <label className="flex items-center gap-2 text-xs font-mono text-text-muted cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={isBlockMath}
                  onChange={(e) => setIsBlockMath(e.target.checked)}
                  className="rounded-none border-border-main bg-bg-input focus:ring-0 cursor-pointer"
                />
                Tampilkan di baris baru (Block Math)
              </label>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 bg-bg-input flex justify-end gap-3 border-t border-border-main">
          {dialog.type !== 'alert' && (
            <button 
              onClick={handleClose} 
              className="px-4 py-2 text-xs font-bold tracking-wider text-text-muted hover:text-text-main border border-transparent hover:border-border-main rounded-none transition-colors font-mono"
            >
              Batal
            </button>
          )}
          <button 
            onClick={handleConfirm}
            className="px-5 py-2 text-xs font-bold tracking-wider bg-accent text-accent-foreground border border-accent hover:bg-accent-hover hover:border-accent-hover rounded-none transition-colors font-mono"
          >
            {dialog.type === 'alert' ? 'OK' : 'Konfirmasi'}
          </button>
        </div>
      </div>
    </div>
  );
}
