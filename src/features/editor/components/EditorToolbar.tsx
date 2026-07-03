import { Eye, Pencil, Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered, Undo, Redo, PanelRight, PanelLeft, Quote, Code, Minus, Sigma } from 'lucide-react';
import { showMathPrompt } from '../../ui/components/GlobalDialog';

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
    const text = from !== to ? editor.state.doc.textBetween(from, to) : '';
    
    showMathPrompt("Sisipkan Rumus LaTeX", text).then((res) => {
      if (res) {
        const { latex, isBlock } = res;
        if (latex.trim()) {
          let chain = editor.chain().focus();
          if (from !== to) {
            chain = chain.deleteSelection();
          }
          if (isBlock) {
            chain.insertBlockMath({ latex: latex.trim() }).run();
          } else {
            chain.insertInlineMath({ latex: latex.trim() }).run();
          }
        }
      }
    });
  };

  return (
    <div className="w-full border-b border-border-main bg-bg-card px-6 py-3 flex items-center justify-between gap-2 select-none">
      {/* Left Panel Button (Fixed, no wrap) */}
      {!showLeftPanel && (
        <div className="flex items-center flex-shrink-0 mr-1">
          <button 
            onClick={() => setShowLeftPanel(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold tracking-wider transition-all border font-mono bg-bg-card text-text-muted border-border-main hover:border-text-main hover:text-text-main mr-2"
            title="Buka Panel Kiri"
          >
            <PanelLeft size={14} />
          </button>
          <div className="w-px h-6 bg-border-main mx-1"></div>
        </div>
      )}

      {/* Main Formatting & Navigation Tools (Can wrap) */}
      <div className="flex-1 flex flex-wrap items-center justify-between gap-4 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setIsReadOnly(r => !r)}
            className="flex items-center justify-center gap-1.5 w-20 py-1.5 text-xs font-bold font-mono border transition-colors cursor-pointer rounded-none bg-bg-card text-text-muted border-border-main hover:border-text-main hover:text-text-main shrink-0"
            title={isReadOnly ? "Pindah ke Mode Tulis" : "Pindah ke Mode Baca"}
          >
            {isReadOnly ? <><Pencil size={14} /> <span className="baseline-shift-sm">Edit</span></> : <><Eye size={14} /> <span className="baseline-shift-sm">Baca</span></>}
          </button>

          <div className={`flex items-center flex-wrap gap-y-2 transition-all duration-300 ease-in-out ${
            isReadOnly 
              ? 'max-h-0 opacity-0 pointer-events-none' 
              : 'max-h-32 opacity-100'
          } overflow-hidden`}>
            
            {/* Inline Formatting */}
            <div className="flex gap-0.5 shrink-0 pr-2 mr-1 border-r border-border-main">
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

            {/* Blocks */}
            <div className="flex gap-0.5 shrink-0 pr-2 mr-1 border-r border-border-main">
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 rounded-none border border-transparent hover:border-border-main transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-bg-card text-text-main border-border-main' : 'text-text-muted hover:bg-bg-input'}`} title="Judul 1">
                <Heading1 size={14} />
              </button>
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded-none border border-transparent hover:border-border-main transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-bg-card text-text-main border-border-main' : 'text-text-muted hover:bg-bg-input'}`} title="Judul 2">
                <Heading2 size={14} />
              </button>
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-1.5 rounded-none border border-transparent hover:border-border-main transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-bg-card text-text-main border-border-main' : 'text-text-muted hover:bg-bg-input'}`} title="Judul 3">
                <Heading3 size={14} />
              </button>
            </div>

            {/* Lists */}
            <div className="flex gap-0.5 shrink-0 pr-2 mr-1 border-r border-border-main">
              <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded-none border border-transparent hover:border-border-main transition-colors ${editor.isActive('bulletList') ? 'bg-bg-card text-text-main border-border-main' : 'text-text-muted hover:bg-bg-input'}`} title="Daftar Bullet">
                <List size={14} />
              </button>
              <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded-none border border-transparent hover:border-border-main transition-colors ${editor.isActive('orderedList') ? 'bg-bg-card text-text-main border-border-main' : 'text-text-muted hover:bg-bg-input'}`} title="Daftar Angka">
                <ListOrdered size={14} />
              </button>
            </div>

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
              <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-1.5 text-text-muted hover:text-text-main disabled:opacity-30 rounded-none border border-transparent hover:border-border-main hover:bg-bg-input transition-colors" title="Ulangi (Ctrl+Y)">
                <Redo size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right Panel Button (Fixed, no wrap) */}
      {!showRightPanel && (
        <div className="flex items-center flex-shrink-0 ml-1">
          <div className="w-px h-6 bg-border-main mx-1 mr-2"></div>
          <button 
            onClick={() => {
              if (showRightPanel) setDiffContent(null);
              setShowRightPanel(!showRightPanel);
            }}
            disabled={!activePath}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold tracking-wider transition-all border font-mono bg-bg-card text-text-muted border-border-main hover:border-text-main hover:text-text-main disabled:opacity-30"
            title="Buka Panel Kanan"
          >
            <PanelRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
