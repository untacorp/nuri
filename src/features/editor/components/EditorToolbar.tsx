import { Eye, Pencil, Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, Undo, Redo, PanelRight, PanelLeft, Quote, Code, Minus, Sigma } from 'lucide-react';

interface EditorToolbarProps {
  editor: any;
  isReadOnly: boolean;
  setIsReadOnly: React.Dispatch<React.SetStateAction<boolean>>;
  showRightPanel: boolean;
  setShowRightPanel: React.Dispatch<React.SetStateAction<boolean>>;
  showLeftPanel: boolean;
  setShowLeftPanel: React.Dispatch<React.SetStateAction<boolean>>;
  setDiffContent: React.Dispatch<React.SetStateAction<any>>;
  activePath: string;
}

export default function EditorToolbar({
  editor,
  isReadOnly,
  setIsReadOnly,
  showRightPanel,
  setShowRightPanel,
  showLeftPanel,
  setShowLeftPanel,
  setDiffContent,
  activePath
}: EditorToolbarProps) {
  if (!editor) return null;

  const insertLatex = () => {
    const { from, to } = editor.state.selection;
    if (from === to) {
      editor.chain().focus().insertContent('$$  $$').run();
      const currentPos = editor.state.selection.from;
      editor.commands.setTextSelection(currentPos - 3);
    } else {
      const text = editor.state.doc.textBetween(from, to);
      editor.chain().focus().insertContent(`$$ ${text} $$`).run();
    }
  };

  return (
    <div className="w-full border-b border-border-main bg-bg-input px-6 py-3 flex flex-wrap items-center justify-between gap-4 select-none">
      {/* Mode Toggle & Formatting Tools */}
      <div className="flex items-center gap-1">
        {!showLeftPanel && (
          <>
            <button 
              onClick={() => setShowLeftPanel(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold tracking-wider transition-all border font-mono bg-bg-card text-text-muted border-border-main hover:border-text-main hover:text-text-main mr-2"
              title="Buka Panel Kiri"
            >
              <PanelLeft size={14} />
            </button>
            <div className="w-px h-6 bg-border-main mx-1"></div>
          </>
        )}

        <button
          onClick={() => setIsReadOnly(r => !r)}
          className={`flex items-center justify-center gap-1.5 w-20 py-1 text-xs font-bold font-mono border transition-colors cursor-pointer rounded-none bg-accent text-accent-foreground border-accent hover:bg-accent-hover hover:border-accent-hover shrink-0`}
          title={isReadOnly ? "Pindah ke Mode Tulis" : "Pindah ke Mode Baca"}
        >
          {isReadOnly ? <><Pencil size={14} /> Edit</> : <><Eye size={14} /> Baca</>}
        </button>

        <div className={`flex items-center transition-all duration-300 ease-out origin-left ${
          isReadOnly 
            ? 'max-w-0 opacity-0 pointer-events-none -translate-x-4' 
            : 'max-w-[500px] opacity-100 translate-x-0'
        } overflow-hidden`}>
          <div className="w-px h-6 bg-border-main mx-2 shrink-0"></div>
          
          {/* Inline Formatting */}
          <div className="flex gap-0.5 shrink-0">
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded-none border border-transparent hover:border-border-main transition-colors ${editor.isActive('bold') ? 'bg-bg-card text-text-main border-border-main' : 'text-text-muted hover:bg-bg-input'}`} title="Tebal (Ctrl+B)">
              <Bold size={14} />
            </button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded-none border border-transparent hover:border-border-main transition-colors ${editor.isActive('italic') ? 'bg-bg-card text-text-main border-border-main' : 'text-text-muted hover:bg-bg-input'}`} title="Miring (Ctrl+I)">
              <Italic size={14} />
            </button>
            <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-1.5 rounded-none border border-transparent hover:border-border-main transition-colors ${editor.isActive('strike') ? 'bg-bg-card text-text-main border-border-main' : 'text-text-muted hover:bg-bg-input'}`} title="Coret">
              <Strikethrough size={14} />
            </button>
          </div>

          <div className="w-px h-6 bg-border-main mx-2 shrink-0"></div>

          {/* Blocks */}
          <div className="flex gap-0.5 shrink-0">
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 rounded-none border border-transparent hover:border-border-main transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-bg-card text-text-main border-border-main' : 'text-text-muted hover:bg-bg-input'}`} title="Judul 1">
              <Heading1 size={14} />
            </button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded-none border border-transparent hover:border-border-main transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-bg-card text-text-main border-border-main' : 'text-text-muted hover:bg-bg-input'}`} title="Judul 2">
              <Heading2 size={14} />
            </button>
          </div>

          <div className="w-px h-6 bg-border-main mx-2 shrink-0"></div>

          {/* Lists */}
          <div className="flex gap-0.5 shrink-0">
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded-none border border-transparent hover:border-border-main transition-colors ${editor.isActive('bulletList') ? 'bg-bg-card text-text-main border-border-main' : 'text-text-muted hover:bg-bg-input'}`} title="Daftar Bullet">
              <List size={14} />
            </button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded-none border border-transparent hover:border-border-main transition-colors ${editor.isActive('orderedList') ? 'bg-bg-card text-text-main border-border-main' : 'text-text-muted hover:bg-bg-input'}`} title="Daftar Angka">
              <ListOrdered size={14} />
            </button>
          </div>

          <div className="w-px h-6 bg-border-main mx-2 shrink-0"></div>

          {/* Native Markdown / Structural Formatting */}
          <div className="flex gap-0.5 shrink-0">
            <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-1.5 rounded-none border border-transparent hover:border-border-main transition-colors ${editor.isActive('blockquote') ? 'bg-bg-card text-text-main border-border-main' : 'text-text-muted hover:bg-bg-input'}`} title="Kutipan (Blockquote)">
              <Quote size={14} />
            </button>
            <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`p-1.5 rounded-none border border-transparent hover:border-border-main transition-colors ${editor.isActive('codeBlock') ? 'bg-bg-card text-text-main border-border-main' : 'text-text-muted hover:bg-bg-input'}`} title="Blok Kode (Code Block)">
              <Code size={14} />
            </button>
            <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className="p-1.5 rounded-none border border-transparent hover:border-border-main hover:bg-bg-input transition-colors text-text-muted hover:text-text-main" title="Garis Pembatas (Horizontal Rule)">
              <Minus size={14} />
            </button>
            <button onClick={insertLatex} className="p-1.5 rounded-none border border-transparent hover:border-border-main hover:bg-bg-input transition-colors text-text-muted hover:text-text-main" title="Sisipkan Rumus LaTeX ($$)">
              <Sigma size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isReadOnly && (
          <>
            <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-1.5 text-text-muted hover:text-text-main disabled:opacity-30 rounded-none border border-transparent hover:border-border-main hover:bg-bg-input transition-colors" title="Batal (Ctrl+Z)">
              <Undo size={14} />
            </button>
            <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-1.5 text-text-muted hover:text-text-main disabled:opacity-30 rounded-none border border-transparent hover:border-border-main hover:bg-bg-input transition-colors mr-2" title="Ulangi (Ctrl+Y)">
              <Redo size={14} />
            </button>
          </>
        )}

        {!showRightPanel && (
          <button 
            onClick={() => {
              if (showRightPanel) setDiffContent(null);
              setShowRightPanel(!showRightPanel);
            }}
            disabled={!activePath}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold tracking-wider transition-all border font-mono bg-bg-card text-text-muted border-border-main hover:border-text-main hover:text-text-main disabled:opacity-30 ml-2`}
            title="Buka Panel Kanan"
          >
            <PanelRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
