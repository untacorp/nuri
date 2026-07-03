import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowLeftRight, Plus } from 'lucide-react';
import TreeNode, { LibraryNode } from '~/features/library/components/TreeNode';
import { compileManuscript, renameNode, deleteNode } from '~/features/library/services/api';
import { showPrompt, showConfirm, showAlert } from '~/features/ui/components/GlobalDialog';

interface LibrarySidebarProps {
  activeBook: LibraryNode | null;
  activePath: string | null;
  onSelectPath: (path: string | null) => void;
  goHome: () => void;
  sidebarPosition: 'left' | 'right';
  setSidebarPosition: React.Dispatch<React.SetStateAction<'left' | 'right'>>;
  onOpenModal: (type: string, parentNode: LibraryNode | null) => void;
  status: string;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
  reloadTree: () => void;
  setDiffContent: React.Dispatch<React.SetStateAction<any>>;
}

export default function LibrarySidebar({
  activeBook,
  activePath,
  onSelectPath,
  goHome,
  setSidebarPosition,
  onOpenModal,
  setStatus,
  reloadTree,
  setDiffContent
}: LibrarySidebarProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, node: LibraryNode } | null>(null);

  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, node: LibraryNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node
    });
  };

  const handleRename = async (node: LibraryNode) => {
    const oldName = node.name.replace('.md', '');
    const newName = await showPrompt(`Ubah nama "${oldName}" menjadi:`, oldName);
    if (newName && newName.trim() && newName.trim() !== oldName) {
      renameNode(node.path, newName.trim()).then((res) => {
        if (res.success) {
          reloadTree();
          if (activePath === node.path) {
            onSelectPath(res.newPath);
          }
        } else {
          showAlert("Gagal", `Gagal mengubah nama: ${res.error}`);
        }
      });
    }
  };

  const handleConfirmDelete = async (node: LibraryNode) => {
    const name = node.name.replace('.md', '');
    const isConfirmed = await showConfirm("Hapus Permanen?", `Apakah kamu yakin ingin menghapus "${name}" secara permanen?`);
    if (isConfirmed) {
      deleteNode(node.path).then((res) => {
        if (res.success) {
          reloadTree();
          if (activePath === node.path || activePath?.startsWith(node.path + '/')) {
            onSelectPath(null);
          }
        } else {
          showAlert("Gagal", `Gagal menghapus: ${res.error}`);
        }
      });
    }
  };

  const handleCompile = () => {
    if (!activeBook) return;
    setStatus('Compiling...');
    compileManuscript(activeBook.path).then((res) => {
      if(res.success) {
        showAlert("Kompilasi Sukses", `Naskah berhasil dikompilasi!\nDisimpan di:\n${res.compiledPath}`);
        setStatus('Compiled');
      } else {
        showAlert("Kompilasi Gagal", 'Gagal kompilasi: ' + res.error);
        setStatus('Ready');
      }
    });
  };

  return (
    <div className="w-72 bg-bg-card border-x border-border-main p-4 flex flex-col gap-4 z-10 overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border-main">
        <button onClick={goHome} className="p-1.5 rounded-none border border-transparent hover:border-border-main hover:bg-bg-input text-text-muted hover:text-text-main transition-colors" title="Kembali ke Koleksi">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-xs font-bold font-mono truncate tracking-wider text-text-main">{activeBook?.name}</h2>
      </div>

      <div className="flex justify-between items-center mb-1 px-2">
        <span className="text-[10px] font-bold tracking-widest text-text-muted font-mono">Draf Naskah</span>
        <div className="flex gap-1">
          <button onClick={() => onOpenModal('chapter', activeBook)} className="p-1 rounded-none border border-transparent hover:border-border-main hover:bg-bg-input text-text-muted hover:text-text-main transition-colors" title="Bab Baru">
            <Plus size={14} />
          </button>
          <button onClick={() => setSidebarPosition(p => p === 'left' ? 'right' : 'left')} className="p-1 rounded-none border border-transparent hover:border-border-main hover:bg-bg-input text-text-muted hover:text-text-main transition-colors" title="Pindah Sidebar">
            <ArrowLeftRight size={14} />
          </button>
        </div>
      </div>
      
      <div className="flex flex-col flex-1">
        {activeBook?.children?.map((node, idx) => (
          <TreeNode 
            key={idx} 
            node={node} 
            activePath={activePath} 
            onSelect={(p) => { 
              onSelectPath(p); 
              setDiffContent(null);
            }} 
            onOpenModal={onOpenModal} 
            onContextMenu={handleContextMenu}
          />
        ))}
        {(!activeBook?.children || activeBook.children.length === 0) && (
          <div className="text-xs text-text-muted text-center mt-6 p-4 border border-dashed border-border-main rounded-none font-mono">Belum ada draf.<br/>Klik tombol + untuk menambah Bab.</div>
        )}
        
        <div className="mt-auto pt-8 pb-2">
          <button 
            onClick={handleCompile}
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
            onClick={() => { handleConfirmDelete(contextMenu.node); setContextMenu(null); }}
            className="w-full text-left px-4 py-2 hover:bg-bg-input text-red-500 flex items-center gap-2 cursor-pointer font-bold rounded-none"
          >
            Hapus
          </button>
        </div>
      )}
    </div>
  );
}
