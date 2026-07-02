import { useState, useEffect } from 'react';
import { FileText, ArrowLeft, ArrowLeftRight, Plus, History, X, Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, Eye, Pencil, Copy } from 'lucide-react';
import { EditorContent } from '@tiptap/react';
import { turndownService } from '../utils/markdown';
import { generateDiffHtml } from '../utils/diffRenderer';
import { compileManuscript, renameNode, deleteNode } from '../../library/services/api';
import { createVariation } from '../services/api';
import TreeNode, { LibraryNode } from '../../library/components/TreeNode';
import HistoryPanel from './HistoryPanel';
import AssemblerView from '../../assembler/components/AssemblerView';
import { showPrompt, showConfirm, showAlert } from '../../ui/components/GlobalDialog';

interface EditorViewProps {
  activeBook: LibraryNode | null;
  activePath: string | null;
  onSelectPath: (path: string | null) => void;
  goHome: () => void;
  sidebarPosition: 'left' | 'right';
  setSidebarPosition: React.Dispatch<React.SetStateAction<'left' | 'right'>>;
  onOpenModal: (type: string, parentNode: LibraryNode | null) => void;
  editor: any;
  status: string;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
  reloadTree: () => void;
}

export default function EditorView({
  activeBook, activePath, onSelectPath,
  goHome, sidebarPosition, setSidebarPosition,
  onOpenModal, editor, status, setStatus, reloadTree
}: EditorViewProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [diffContent, setDiffContent] = useState<{ html: string; hash: string } | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
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
  
  // Set editable state in TipTap editor when isReadOnly toggles
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [isReadOnly, editor]);

  
  // Force re-render on Editor transactions to update formatting button states instantly
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const handleTransaction = () => setTick(t => t + 1);
    editor.on('transaction', handleTransaction);
    return () => {
      editor.off('transaction', handleTransaction);
    };
  }, [editor]);

  // Custom logic to check if path is a folder (chapter). 
  // We deduce this if the path doesn't end with .md
  const isFolderView = activePath && !activePath.endsWith('.md');
  const chapterName = isFolderView ? activePath.split('/').pop() : '';

  const handleSelectHistory = async (content: string, hash: string) => {
    const currentMarkdown = turndownService.turndown(editor.getHTML());
    const diffHtml = await generateDiffHtml(content, currentMarkdown);
    setDiffContent({ html: diffHtml, hash });
  };

  const handleCreateVariationFromDiff = async () => {
    if (!diffContent || !diffContent.hash || !activePath) return;
    const suffix = await showPrompt("Nama akhiran variasi (misal: v2, alt, revisi):", "v2");
    if (suffix) {
      createVariation(activePath, suffix, diffContent.hash).then(() => {
        showAlert("Berhasil", "Variasi baru berhasil dibuat dari versi riwayat ini! Silakan lihat di Sidebar.");
        reloadTree();
        setDiffContent(null);
      });
    }
  };


  return (
    <div className={`flex h-screen overflow-hidden ${sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in duration-300`}>
      
      {/* Sidebar */}
      <div className="w-72 bg-bg-card border-x border-border-main p-4 flex flex-col gap-4 z-10 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border-main">
          <button onClick={goHome} className="p-1.5 rounded-none border border-transparent hover:border-border-main hover:bg-bg-input text-text-muted hover:text-text-main transition-colors" title="Kembali ke Koleksi">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-xs font-bold font-mono truncate uppercase tracking-wider text-text-main">{activeBook?.name}</h2>
        </div>

        <div className="flex justify-between items-center mb-1 px-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted font-mono">Draf Naskah</span>
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
                setDiffContent(null); // Reset diff view
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
              onClick={() => {
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
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent text-accent-foreground border border-accent rounded-none text-xs font-bold uppercase tracking-wider hover:bg-accent-hover hover:border-accent-hover transition-colors font-mono"
            >
              Compile Manuscript
            </button>
          </div>
        </div>
      </div>
      
      {/* Editor Area (Bisa Terbelah Dua jika Diff Aktif) */}
      <div className="flex-1 flex overflow-hidden bg-bg-main">
        
        {/* Editor Utama / Assembler */}
        <div className="flex-1 flex flex-col items-center overflow-y-auto border-r border-border-main relative bg-bg-card">
          
          {!activePath ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted py-16">
              <FileText size={32} className="mb-4 opacity-30 text-text-muted" />
              <p className="font-mono text-xs text-text-muted uppercase tracking-wider">Pilih lembar tulisan di sidebar untuk mulai merangkai cerita.</p>
            </div>
          ) : isFolderView ? (
            <div className="w-full h-full flex flex-col">
              <AssemblerView activePath={activePath} chapterName={chapterName || ''} />
            </div>
          ) : (
            <div className="w-full flex-1 flex flex-col bg-bg-card overflow-hidden">
              {/* Tooling Bar */}
              <div className="w-full border-b border-border-main bg-bg-input px-6 py-3 flex flex-wrap items-center justify-between gap-4 select-none">
                {/* Mode Toggle & Formatting Tools */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsReadOnly(r => !r)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold font-mono uppercase border transition-colors cursor-pointer rounded-none ${
                      isReadOnly 
                        ? 'bg-accent text-accent-foreground border-accent hover:bg-accent-hover hover:border-accent-hover' 
                        : 'bg-bg-card text-text-muted border-border-main hover:text-text-main hover:border-border-hover'
                    }`}
                    title={isReadOnly ? "Pindah ke Mode Edit" : "Pindah ke Mode Baca (Read-Only)"}
                  >
                    {isReadOnly ? <Eye size={12} /> : <Pencil size={12} />}
                    <span>{isReadOnly ? 'View Mode' : 'Edit Mode'}</span>
                  </button>

                  <div className="w-px h-4 bg-border-main mx-2"></div>

                  <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={isReadOnly}
                    className={`p-1.5 rounded-none border border-transparent text-text-muted hover:text-text-main hover:bg-bg-card hover:border-border-main disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors ${editor?.isActive('bold') ? 'bg-bg-card text-text-main border-border-main font-bold' : ''}`}
                    title="Tebal (Ctrl+B)"
                  >
                    <Bold size={16} />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={isReadOnly}
                    className={`p-1.5 rounded-none border border-transparent text-text-muted hover:text-text-main hover:bg-bg-card hover:border-border-main disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors ${editor?.isActive('italic') ? 'bg-bg-card text-text-main border-border-main font-bold' : ''}`}
                    title="Miring (Ctrl+I)"
                  >
                    <Italic size={16} />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    disabled={isReadOnly}
                    className={`p-1.5 rounded-none border border-transparent text-text-muted hover:text-text-main hover:bg-bg-card hover:border-border-main disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors ${editor?.isActive('strike') ? 'bg-bg-card text-text-main border-border-main font-bold' : ''}`}
                    title="Coret (Ctrl+Shift+X)"
                  >
                    <Strikethrough size={16} />
                  </button>
                  
                  <div className="w-px h-4 bg-border-main mx-1"></div>
                  
                  <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    disabled={isReadOnly}
                    className={`p-1.5 rounded-none border border-transparent text-text-muted hover:text-text-main hover:bg-bg-card hover:border-border-main disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors ${editor?.isActive('heading', { level: 1 }) ? 'bg-bg-card text-text-main border-border-main font-bold' : ''}`}
                    title="Judul 1 (Ctrl+Alt+1)"
                  >
                    <Heading1 size={16} />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    disabled={isReadOnly}
                    className={`p-1.5 rounded-none border border-transparent text-text-muted hover:text-text-main hover:bg-bg-card hover:border-border-main disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors ${editor?.isActive('heading', { level: 2 }) ? 'bg-bg-card text-text-main border-border-main font-bold' : ''}`}
                    title="Judul 2 (Ctrl+Alt+2)"
                  >
                    <Heading2 size={16} />
                  </button>
                  
                  <div className="w-px h-4 bg-border-main mx-1"></div>
                  
                  <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    disabled={isReadOnly}
                    className={`p-1.5 rounded-none border border-transparent text-text-muted hover:text-text-main hover:bg-bg-card hover:border-border-main disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors ${editor?.isActive('bulletList') ? 'bg-bg-card text-text-main border-border-main font-bold' : ''}`}
                    title="Daftar Bulat (Ctrl+Shift+8)"
                  >
                    <List size={16} />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    disabled={isReadOnly}
                    className={`p-1.5 rounded-none border border-transparent text-text-muted hover:text-text-main hover:bg-bg-card hover:border-border-main disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors ${editor?.isActive('orderedList') ? 'bg-bg-card text-text-main border-border-main font-bold' : ''}`}
                    title="Daftar Urutan (Ctrl+Shift+9)"
                  >
                    <ListOrdered size={16} />
                  </button>
                </div>

                {/* Sync status and Time Machine */}
                <div className="flex items-center gap-3">
                  {status !== 'Ready' && (
                    <>
                      <span className="text-xs font-mono uppercase text-text-muted flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-none border border-border-main ${status === 'Synced' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                        {status}
                      </span>
                      <div className="w-px h-4 bg-border-main mx-1"></div>
                    </>
                  )}

                  <button 
                    onClick={() => {
                      if (showHistory) setDiffContent(null);
                      setShowHistory(!showHistory);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider transition-all border font-mono ${
                      showHistory 
                        ? 'bg-accent text-accent-foreground border-accent' 
                        : 'bg-bg-card text-text-muted border-border-main hover:border-text-main hover:text-text-main'
                    }`}
                  >
                    <History size={14} />
                    Time Machine
                  </button>
                </div>
              </div>

              {/* Full Width Paper Area */}
              <div 
                className="flex-1 w-full bg-bg-card overflow-y-auto px-8 sm:px-16 md:px-24 py-12 cursor-text flex flex-col"
                onClick={() => editor?.commands.focus()}
              >
                <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col">
                  <div className="mb-6 border-b border-border-main pb-2 flex items-center justify-between text-[10px] font-bold text-text-muted select-none font-mono">
                    <span className="bg-bg-input px-2.5 py-1 rounded-none border border-border-main truncate uppercase tracking-wider font-mono">
                      {activePath.split('/').slice(-3).join(' / ').replace('.md', '')}
                    </span>
                  </div>
                  <EditorContent 
                    editor={editor} 
                    className="font-serif text-lg text-text-main flex-1 flex flex-col outline-none" 
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel Diff Viewer (Versi Masa Lalu) */}
        {diffContent && activePath && (
          <div className="flex-1 flex flex-col overflow-hidden bg-bg-card border-l border-border-main relative">
            {/* Header / Info Bar (Symmetric with Live Editor toolbar) */}
            <div className="w-full border-b border-border-main bg-bg-input px-6 py-3 flex items-center justify-between select-none">
              <span className="text-xs font-mono uppercase text-text-muted flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-none border border-border-main bg-amber-500"></span>
                Perbedaan Versi (Diff Viewer)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateVariationFromDiff}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold font-mono uppercase border border-border-main bg-bg-card hover:border-border-hover text-text-main rounded-none transition-colors cursor-pointer"
                  title="Buat Variasi Baru dari Versi Ini"
                >
                  <Copy size={12} />
                  <span>Buat Variasi</span>
                </button>
                <button 
                  onClick={() => setDiffContent(null)}
                  className="p-1.5 bg-bg-card border border-border-main rounded-none text-text-muted hover:text-red-500 hover:border-red-500 transition-colors cursor-pointer"
                  title="Tutup Perbandingan"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Paper Area (Padding & Background matched exactly to Live Editor) */}
            <div className="flex-1 w-full bg-bg-card overflow-y-auto px-8 sm:px-16 md:px-24 py-12 flex flex-col">
              <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col">
                <div className="mb-6 border-b border-border-main pb-2 flex items-center justify-between text-[10px] font-bold text-text-muted select-none font-mono">
                  <span className="bg-bg-input px-2.5 py-1 rounded-none border border-border-main truncate uppercase tracking-wider font-mono">
                    {diffContent.hash.substring(0, 7)} VS LIVE
                  </span>
                </div>
                {/* Content - with matched font-serif and text-lg */}
                <div 
                  className="font-serif text-lg text-text-main leading-relaxed flex-1 outline-none prose prose-zinc dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:font-sans prose-h2:font-sans"
                  dangerouslySetInnerHTML={{ __html: diffContent.html }}
                />
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* Panel History Sidebar (Kanan) */}
      {showHistory && activePath && (
        <HistoryPanel 
          activePath={activePath} 
          onClose={() => {
            setShowHistory(false);
            setDiffContent(null);
          }}
          onContentSelect={handleSelectHistory}
        />
      )}
      
      {/* Status Bar */}
      {(isFolderView || !activePath) && status !== 'Ready' && (
        <div className="fixed bottom-6 right-6 bg-bg-card px-4 py-2 rounded-none border border-border-main text-xs font-bold font-mono uppercase text-text-main flex items-center gap-2.5 z-50 animate-in fade-in duration-300">
          <div className={`w-2.5 h-2.5 rounded-none border border-border-main ${status === 'Synced' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
          {status}
        </div>
      )}

      {/* Custom Context Menu */}
      {contextMenu && (
        <div 
          className="fixed bg-bg-card border border-border-main shadow-lg z-50 py-1 w-48 animate-in fade-in duration-75 font-mono text-xs uppercase rounded-none"
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
