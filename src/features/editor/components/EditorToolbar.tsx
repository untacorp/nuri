import { Eye, Pencil, Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, Undo, Redo, PanelRight } from 'lucide-react';

interface EditorToolbarProps {
  editor: any;
  isReadOnly: boolean;
  setIsReadOnly: React.Dispatch<React.SetStateAction<boolean>>;
  status: string;
  showInspector: boolean;
  setShowInspector: React.Dispatch<React.SetStateAction<boolean>>;
  setDiffContent: React.Dispatch<React.SetStateAction<any>>;
  activePath: string;
}

export default function EditorToolbar({
  editor,
  isReadOnly,
  setIsReadOnly,
  status,
  showInspector,
  setShowInspector,
  setDiffContent,
  activePath
}: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className="w-full border-b border-border-main bg-bg-input px-6 py-3 flex flex-wrap items-center justify-between gap-4 select-none">
      {/* Mode Toggle & Formatting Tools */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsReadOnly(r => !r)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold font-mono border transition-colors cursor-pointer rounded-none ${
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
          onClick={() => editor.chain().focus().undo().run()}
          disabled={isReadOnly || !editor.can().undo()}
          className="p-1.5 rounded-none border border-transparent text-text-muted hover:text-text-main hover:bg-bg-card hover:border-border-main disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors"
          title="Batal (Undo) (Ctrl+Z)"
        >
          <Undo size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={isReadOnly || !editor.can().redo()}
          className="p-1.5 rounded-none border border-transparent text-text-muted hover:text-text-main hover:bg-bg-card hover:border-border-main disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors"
          title="Ulangi (Redo) (Ctrl+Y)"
        >
          <Redo size={16} />
        </button>

        <div className="w-px h-4 bg-border-main mx-2"></div>

        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={isReadOnly}
          className={`p-1.5 rounded-none border border-transparent text-text-muted hover:text-text-main hover:bg-bg-card hover:border-border-main disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors ${editor.isActive('bold') ? 'bg-bg-card text-text-main border-border-main font-bold' : ''}`}
          title="Tebal (Ctrl+B)"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={isReadOnly}
          className={`p-1.5 rounded-none border border-transparent text-text-muted hover:text-text-main hover:bg-bg-card hover:border-border-main disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors ${editor.isActive('italic') ? 'bg-bg-card text-text-main border-border-main font-bold' : ''}`}
          title="Miring (Ctrl+I)"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={isReadOnly}
          className={`p-1.5 rounded-none border border-transparent text-text-muted hover:text-text-main hover:bg-bg-card hover:border-border-main disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors ${editor.isActive('strike') ? 'bg-bg-card text-text-main border-border-main font-bold' : ''}`}
          title="Coret (Ctrl+Shift+X)"
        >
          <Strikethrough size={16} />
        </button>
        
        <div className="w-px h-4 bg-border-main mx-1"></div>
        
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          disabled={isReadOnly}
          className={`p-1.5 rounded-none border border-transparent text-text-muted hover:text-text-main hover:bg-bg-card hover:border-border-main disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-bg-card text-text-main border-border-main font-bold' : ''}`}
          title="Judul 1 (Ctrl+Alt+1)"
        >
          <Heading1 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={isReadOnly}
          className={`p-1.5 rounded-none border border-transparent text-text-muted hover:text-text-main hover:bg-bg-card hover:border-border-main disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-bg-card text-text-main border-border-main font-bold' : ''}`}
          title="Judul 2 (Ctrl+Alt+2)"
        >
          <Heading2 size={16} />
        </button>
        
        <div className="w-px h-4 bg-border-main mx-1"></div>
        
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={isReadOnly}
          className={`p-1.5 rounded-none border border-transparent text-text-muted hover:text-text-main hover:bg-bg-card hover:border-border-main disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors ${editor.isActive('bulletList') ? 'bg-bg-card text-text-main border-border-main font-bold' : ''}`}
          title="Daftar Bulat (Ctrl+Shift+8)"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={isReadOnly}
          className={`p-1.5 rounded-none border border-transparent text-text-muted hover:text-text-main hover:bg-bg-card hover:border-border-main disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors ${editor.isActive('orderedList') ? 'bg-bg-card text-text-main border-border-main font-bold' : ''}`}
          title="Daftar Urutan (Ctrl+Shift+9)"
        >
          <ListOrdered size={16} />
        </button>
      </div>

      {/* Sync status and Time Machine */}
      <div className="flex items-center gap-3">
        {status !== 'Ready' && (
          <>
            <span className="text-xs font-mono text-text-muted flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-none border border-border-main ${status === 'Synced' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
              {status}
            </span>
            <div className="w-px h-4 bg-border-main mx-1"></div>
          </>
        )}

        <button 
          onClick={() => {
            if (showInspector) setDiffContent(null);
            setShowInspector(!showInspector);
          }}
          disabled={!activePath}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold tracking-wider transition-all border font-mono ${
            showInspector 
              ? 'bg-accent text-accent-foreground border-accent' 
              : 'bg-bg-card text-text-muted border-border-main hover:border-text-main hover:text-text-main'
          } disabled:opacity-30`}
        >
          <PanelRight size={14} />
          Inspector
        </button>
      </div>
    </div>
  );
}
