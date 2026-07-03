import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowLeftRight, Plus, PanelLeftClose, PanelRightClose } from 'lucide-react';
import TreeNode, { LibraryNode } from '~/features/library/components/TreeNode';
import { compileManuscript, renameNode, deleteNode } from '~/features/library/services/api';
import { showPrompt, showConfirm, showAlert } from '~/features/ui/components/GlobalDialog';

interface LibraryContentProps {
  activeBook: LibraryNode | null;
  activePath: string | null;
  onSelectPath: (path: string | null) => void;
  goHome: () => void;
  isRightSide: boolean;
  onToggleSwap: () => void;
  onOpenModal: (type: string, parentNode: LibraryNode | null) => void;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
  reloadTree: () => void;
  setDiffContent: React.Dispatch<React.SetStateAction<any>>;
  onCollapse: () => void;
}

export default function LibraryContent({
  activeBook,
  activePath,
  onSelectPath,
  goHome,
  isRightSide,
  onToggleSwap,
  onOpenModal,
  setStatus,
  reloadTree,
  setDiffContent,
  onCollapse
}: LibraryContentProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, node: LibraryNode } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, node: LibraryNode) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const handleRename = async (node: LibraryNode) => {
    const newName = await showPrompt(`Ubah nama "${node.name}" menjadi:`, node.name);
    if (newName && newName !== node.name) {
      const res = await renameNode(node.path, newName);
      if (res.success) {
        if (activePath === node.path) onSelectPath(null);
        reloadTree();
      } else {
        showAlert("Error", `Gagal mengubah nama: ${res.error}`);
      }
    }
  };

  const handleDelete = async (node: LibraryNode) => {
    const confirmed = await showConfirm("Hapus", `Apakah Anda yakin ingin menghapus ${node.name}?`);
    if (confirmed) {
      const res = await deleteNode(node.path);
      if (res.success) {
        if (activePath === node.path) onSelectPath(null);
        reloadTree();
      } else {
        showAlert("Error", `Gagal menghapus: ${res.error}`);
      }
    }
  };

  const handleCompileBook = async () => {
    if (!activeBook) return;
    setStatus('Compiling...');
    const res = await compileManuscript(activeBook.path);
    if (res.success) {
      showAlert("Kompilasi Sukses", `Buku berhasil dikompilasi!\nDisimpan di:\n${res.compiledPath}`);
      setStatus('Ready');
    } else {
      showAlert("Kompilasi Gagal", `Gagal kompilasi buku: ${res.error}`);
      setStatus('Error');
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-main shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <button onClick={goHome} className="p-1.5 shrink-0 rounded-none border border-transparent hover:border-border-main hover:bg-bg-input text-text-muted hover:text-text-main transition-colors" title="Kembali ke Koleksi">
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-xs font-bold font-mono truncate tracking-wider text-text-main" title={activeBook?.name}>{activeBook?.name}</h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onToggleSwap} className="p-1.5 rounded-none border border-transparent hover:border-border-main hover:bg-bg-input text-text-muted hover:text-text-main transition-colors" title="Tukar Posisi Panel">
            <ArrowLeftRight size={14} />
          </button>
          <button onClick={onCollapse} className="p-1.5 rounded-none border border-transparent hover:border-border-main hover:bg-bg-input text-text-muted hover:text-text-main transition-colors" title="Sembunyikan Panel">
            {isRightSide ? <PanelRightClose size={14} /> : <PanelLeftClose size={14} />}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        <div className="flex justify-between items-center p-3 shrink-0">
          <span className="text-[10px] font-bold tracking-widest text-text-muted font-mono uppercase">Draf Naskah</span>
          <button onClick={() => onOpenModal('chapter', activeBook)} className="p-1 rounded-none border border-transparent hover:border-border-main hover:bg-bg-input text-text-muted hover:text-text-main transition-colors" title="Bab Baru">
            <Plus size={14} />
          </button>
        </div>
        
        <div className="flex-1 px-3 pb-3">
          {activeBook?.children?.map((child, i) => (
            <TreeNode 
              key={i} 
              node={child} 
              activePath={activePath} 
              onSelect={(p) => { 
                onSelectPath(p); 
                setDiffContent(null);
              }} 
              onContextMenu={handleContextMenu}
              onOpenModal={onOpenModal}
            />
          ))}
          {(!activeBook?.children || activeBook.children.length === 0) && (
            <div className="text-xs text-text-muted text-center mt-6 p-4 border border-dashed border-border-main rounded-none font-mono">Belum ada draf.<br/>Klik tombol + untuk menambah Bab.</div>
          )}
        </div>
        
        <div className="mt-auto p-4 border-t border-border-main shrink-0 bg-bg-card">
          <button 
            onClick={handleCompileBook}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent text-accent-foreground border border-accent rounded-none text-xs font-bold tracking-wider hover:bg-accent-hover hover:border-accent-hover transition-colors font-mono"
          >
            Compile Manuscript
          </button>
        </div>
      </div>

      {contextMenu && (
        <div 
          className="fixed bg-bg-card border border-border-main shadow-lg z-50 py-1 w-48 animate-in fade-in duration-75 font-mono text-xs rounded-none"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => { handleRename(contextMenu.node); setContextMenu(null); }}
            className="w-full text-left px-4 py-2 hover:bg-bg-input text-text-main flex items-center gap-2 cursor-pointer font-bold rounded-none"
          >
            Ubah Nama
          </button>
          <div className="h-px bg-border-main mx-2 my-1"></div>
          <button 
            onClick={() => { handleDelete(contextMenu.node); setContextMenu(null); }}
            className="w-full text-left px-4 py-2 hover:bg-bg-input text-red-500 flex items-center gap-2 cursor-pointer font-bold rounded-none"
          >
            Hapus
          </button>
        </div>
      )}
    </div>
  );
}
