import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { LibraryNode } from './TreeNode';

interface CreateModalProps {
  isOpen: boolean;
  type: string;
  parentNode: LibraryNode | null;
  onClose: () => void;
  onSubmit: (name: string, type: string, parentNode: LibraryNode | null, customPath?: string) => void;
}

export default function CreateModal({ isOpen, type, parentNode, onClose, onSubmit }: CreateModalProps) {
  const [name, setName] = useState('');
  const [customPath, setCustomPath] = useState('');
  
  useEffect(() => { 
    if (isOpen) {
      setName('');
      setCustomPath('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-bg-card rounded-none w-full max-w-md overflow-hidden border-2 border-border-main scale-100 transition-transform">
        <div className="px-6 py-5 border-b border-border-main flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-text-main tracking-wider font-mono">
              Tambah {type === 'book' ? 'Buku' : type === 'chapter' ? 'Bab' : type === 'part' ? 'Bagian (Part)' : 'Versi/Variasi'} Baru
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-main hover:bg-bg-input rounded-none border border-transparent hover:border-border-main transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1.5 tracking-wider font-mono">
              Nama {type === 'book' ? 'Buku' : type === 'chapter' ? 'Bab' : type === 'part' ? 'Part' : 'Versi/Variasi'}
            </label>
            <input 
              autoFocus
              type="text" 
              placeholder={`Contoh: ${type === 'book' ? 'Buku Harianku' : type === 'chapter' ? 'Bab 1: Awal Mula' : type === 'part' ? 'Bagian 1' : 'v2'}`} 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-bg-input border border-border-main rounded-none px-4 py-3 text-text-main focus:outline-none focus:border-text-main transition-colors placeholder:text-text-muted font-mono text-sm"
            />
          </div>
          
          {type === 'book' && (
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1.5 tracking-wider font-mono">Lokasi Folder (Absolute Path)</label>
              <input 
                type="text" 
                placeholder="Misal: /home/auttomus/Documents/Obsidian/BukuKu" 
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                className="w-full bg-bg-input border border-border-main rounded-none px-4 py-3 text-text-main focus:outline-none focus:border-text-main transition-colors placeholder:text-text-muted font-mono text-sm"
              />
              <p className="text-[11px] text-text-muted font-mono mt-2 leading-relaxed">
                Aplikasi akan membaca dan menyimpan file Markdown di folder ini secara lokal di komputermu.
              </p>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 bg-bg-input flex justify-end gap-3 border-t border-border-main">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-xs font-bold tracking-wider text-text-muted hover:text-text-main border border-transparent hover:border-border-main rounded-none transition-colors font-mono"
          >
            Batal
          </button>
          <button 
            onClick={() => {
              if (name.trim() && (type !== 'book' || customPath.trim())) {
                onSubmit(name.trim(), type, parentNode, customPath.trim());
                onClose();
              }
            }}
            disabled={!name.trim() || (type === 'book' && !customPath.trim())}
            className="px-5 py-2 text-xs font-bold tracking-wider bg-accent text-accent-foreground border border-accent hover:bg-accent-hover hover:border-accent-hover disabled:opacity-50 disabled:bg-bg-input disabled:text-text-muted disabled:border-border-main rounded-none transition-colors font-mono"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

