import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { LibraryNode } from './TreeNode';

interface CreateModalProps {
  isOpen: boolean;
  type: string; // 'book' | 'chapter' | 'part' | 'version' | 'edit-book'
  parentNode: LibraryNode | null;
  onClose: () => void;
  onSubmit: (name: string, type: string, parentNode: LibraryNode | null, customPath?: string, description?: string, coverImage?: string, autoCompile?: boolean | null) => void;
  editNode?: LibraryNode | null;
}

export default function CreateModal({ isOpen, type, parentNode, onClose, onSubmit, editNode }: CreateModalProps) {
  const [name, setName] = useState('');
  const [customPath, setCustomPath] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [createSubfolder, setCreateSubfolder] = useState(true);
  const [autoCompile, setAutoCompile] = useState<'inherit' | 'active' | 'inactive'>('inherit');
  
  useEffect(() => { 
    if (isOpen) {
      if (type === 'edit-book' && editNode) {
        setName(editNode.name);
        setCustomPath(editNode.path);
        setDescription(editNode.description || '');
        setCoverImage(editNode.cover_image || '');
        setCreateSubfolder(false);
        if (editNode.auto_compile === true) {
          setAutoCompile('active');
        } else if (editNode.auto_compile === false) {
          setAutoCompile('inactive');
        } else {
          setAutoCompile('inherit');
        }
      } else {
        setName('');
        setCustomPath('');
        setDescription('');
        setCoverImage('');
        setCreateSubfolder(true);
        setAutoCompile('inherit');
      }
    }
  }, [isOpen, type, editNode]);

  const getFinalPath = () => {
    let path = customPath.trim();
    if (!path) return '';
    if (createSubfolder && name.trim()) {
      // Normalize slashes based on what's used in the path
      const separator = path.includes('\\') ? '\\' : '/';
      // Remove trailing slash if present
      if (path.endsWith('/') || path.endsWith('\\')) {
        path = path.slice(0, -1);
      }
      return `${path}${separator}${name.trim()}`;
    }
    return path;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Standard cover card ratio in our UI is aspect-3/4.
          // 240px width and 320px height is ideal resolution for small display card.
          const maxW = 240;
          const maxH = 320;
          
          canvas.width = maxW;
          canvas.height = maxH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Draw and crop image to fit 3:4 aspect ratio center
            const imgRatio = img.width / img.height;
            const targetRatio = maxW / maxH;
            let sx = 0, sy = 0, sw = img.width, sh = img.height;
            
            if (imgRatio > targetRatio) {
              // Image is wider than 3:4, crop horizontal sides
              sw = img.height * targetRatio;
              sx = (img.width - sw) / 2;
            } else {
              // Image is taller than 3:4, crop vertical sides
              sh = img.width / targetRatio;
              sy = (img.height - sh) / 2;
            }
            
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, maxW, maxH);
            // Convert to JPEG with 70% quality for tiny file size (~15KB) but good looking
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setCoverImage(compressedBase64);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && ((type !== 'book' && type !== 'edit-book') || customPath.trim())) {
      onSubmit(
        name.trim(), 
        type, 
        parentNode, 
        (type === 'book' || type === 'edit-book') ? getFinalPath() : undefined,
        (type === 'book' || type === 'edit-book') ? description.trim() : undefined,
        (type === 'book' || type === 'edit-book') ? coverImage : undefined,
        (type === 'book' || type === 'edit-book') ? (autoCompile === 'active' ? true : autoCompile === 'inactive' ? false : null) : undefined
      );
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <form onSubmit={handleSubmit} className="bg-bg-card rounded-none w-full max-w-md overflow-hidden border-2 border-border-main scale-100 transition-transform">
        <div className="px-6 py-5 border-b border-border-main flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-text-main tracking-wider font-mono">
              {type === 'edit-book' ? 'Edit Detail Proyek' : `Tambah ${type === 'book' ? 'Proyek' : type === 'chapter' ? 'Grup' : type === 'part' ? 'Bagian' : 'Versi/Variasi'} Baru`}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-text-muted hover:text-text-main hover:bg-bg-input rounded-none border border-transparent hover:border-border-main transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1.5 tracking-wider font-mono">
              Nama {type === 'edit-book' ? 'Proyek' : type === 'chapter' ? 'Grup' : type === 'part' ? 'Bagian' : 'Versi/Variasi'}
            </label>
            <input 
              autoFocus
              type="text" 
              placeholder={`Contoh: ${type === 'book' ? 'Proyek Dokumentasi' : type === 'chapter' ? 'Grup 1: Pengantar' : type === 'part' ? 'Bagian 1' : 'v2'}`} 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-bg-input border border-border-main rounded-none px-4 py-3 text-text-main focus:outline-none focus:border-text-main transition-colors placeholder:text-text-muted font-mono text-sm"
            />
          </div>
          
          {(type === 'book' || type === 'edit-book') && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5 tracking-wider font-mono">Lokasi Folder (Absolute Path)</label>
                <input 
                  type="text" 
                  disabled={type === 'edit-book'}
                  placeholder="Misal: /home/user/Documents/Novel" 
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  className={`w-full bg-bg-input border border-border-main rounded-none px-4 py-3 text-text-main focus:outline-none focus:border-text-main transition-colors placeholder:text-text-muted font-mono text-sm ${
                    type === 'edit-book' ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                />
                
                {type !== 'edit-book' && (
                  <>
                    <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={createSubfolder} 
                        onChange={(e) => setCreateSubfolder(e.target.checked)}
                        className="rounded-none border-border-main text-accent focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-text-muted font-mono tracking-wider">
                        Buat sub-folder baru dengan nama buku
                      </span>
                    </label>

                    {customPath.trim() && (
                      <p className="text-[11px] text-text-muted font-mono mt-3 leading-relaxed bg-bg-input p-2.5 border border-border-main">
                        Target Lokasi: <span className="text-text-main font-bold break-all">{getFinalPath()}</span>
                      </p>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5 tracking-wider font-mono">Deskripsi Proyek (Opsional)</label>
                <textarea 
                  placeholder="Deskripsi singkat mengenai proyek ini..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-bg-input border border-border-main rounded-none px-4 py-3 text-text-main focus:outline-none focus:border-text-main transition-colors placeholder:text-text-muted font-mono text-sm min-h-[70px] resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5 tracking-wider font-mono">Gambar Sampul Proyek (Opsional)</label>
                <div className="flex gap-4 items-start">
                  {coverImage ? (
                    <div className="relative w-20 aspect-3/4 border border-border-main overflow-hidden bg-bg-input shrink-0">
                      <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setCoverImage('')}
                        className="absolute top-1 right-1 p-0.5 bg-black/70 hover:bg-black text-white transition-colors cursor-pointer"
                        title="Hapus Cover"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 aspect-3/4 border border-dashed border-border-main flex items-center justify-center text-text-muted bg-bg-input font-mono text-[9px] text-center px-1 shrink-0">
                      No Cover
                    </div>
                  )}
                  <div className="flex-1 flex flex-col gap-2">
                    <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold border border-border-main hover:border-text-main bg-bg-card hover:text-text-main text-text-muted transition-colors cursor-pointer w-fit">
                      Pilih Gambar...
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange}
                        className="hidden" 
                      />
                    </label>
                    <p className="text-[10px] text-text-muted font-mono leading-tight">
                      Mendukung format gambar apa saja. Gambar akan dikompres otomatis agar hemat ruang penyimpanan.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1.5 tracking-wider font-mono">Auto-Compile Proyek</label>
                <select
                  value={autoCompile}
                  onChange={(e) => setAutoCompile(e.target.value as any)}
                  className="w-full bg-bg-input border border-border-main rounded-none px-4 py-2.5 text-text-main focus:outline-none focus:border-text-main transition-colors font-mono text-xs cursor-pointer"
                >
                  <option value="inherit">Inherit (Gunakan Pengaturan Global)</option>
                  <option value="active">Selalu Aktif</option>
                  <option value="inactive">Selalu Nonaktif</option>
                </select>
                <p className="text-[9px] text-text-muted font-mono mt-1 leading-normal">
                  Jika 'Inherit', proyek ini akan mengikuti pengaturan global sistem. Jika diatur manual, pengaturan ini akan mengesampingkan setelan global.
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 bg-bg-input flex justify-end gap-3 border-t border-border-main">
          <button 
            type="button"
            onClick={onClose} 
            className="px-4 py-2 text-xs font-bold tracking-wider text-text-muted hover:text-text-main border border-transparent hover:border-border-main rounded-none transition-colors font-mono cursor-pointer"
          >
            Batal
          </button>
          <button 
            type="submit"
            disabled={!name.trim() || ((type === 'book' || type === 'edit-book') && !customPath.trim())}
            className="px-5 py-2 text-xs font-bold tracking-wider bg-accent text-accent-foreground border border-accent hover:bg-accent-hover hover:border-accent-hover disabled:opacity-50 disabled:bg-bg-input disabled:text-text-muted disabled:border-border-main rounded-none transition-colors font-mono cursor-pointer"
          >
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
