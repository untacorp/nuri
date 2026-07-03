import { Plus } from 'lucide-react';
import { EditorContent } from '@tiptap/react';
import { useEditorBlockDrag } from '../hooks/useEditorBlockDrag';
import EditorToolbar from './EditorToolbar';
import { showPrompt, showAlert } from '~/features/ui/components/GlobalDialog';
import { createVariation } from '~/features/editor/services/api';

interface EditorSheetProps {
  editor: any;
  isReadOnly: boolean;
  setIsReadOnly: React.Dispatch<React.SetStateAction<boolean>>;
  status: string;
  showRightPanel: boolean;
  setShowRightPanel: React.Dispatch<React.SetStateAction<boolean>>;
  showLeftPanel: boolean;
  setShowLeftPanel: React.Dispatch<React.SetStateAction<boolean>>;
  setDiffContent: React.Dispatch<React.SetStateAction<any>>;
  activePath: string;

  onSelectPath: (path: string | null) => void;
  reloadTree: () => void;
}

export default function EditorSheet({
  editor,
  isReadOnly,
  setIsReadOnly,
  status,
  showRightPanel,
  setShowRightPanel,
  showLeftPanel,
  setShowLeftPanel,
  setDiffContent,
  activePath,

  onSelectPath,
  reloadTree
}: EditorSheetProps) {

  const getTextStats = () => {
    if (!editor) return { words: 0, chars: 0 };
    const text = editor.getText();
    const cleanText = text.trim();
    const words = cleanText ? cleanText.split(/\s+/).length : 0;
    const chars = text.length;
    return { words, chars };
  };

  const { words, chars } = getTextStats();

  const handleCreateVariation = async () => {
    if (!activePath) return;
    const suffix = await showPrompt("Nama akhiran variasi (misal: v2, alt, revisi):", "v2");
    if (suffix && suffix.trim()) {
      createVariation(activePath, suffix.trim()).then((res) => {
        showAlert("Berhasil", "Variasi baru berhasil dibuat!");
        reloadTree();
        if (res.newPath) {
          onSelectPath(res.newPath);
        }
      });
    }
  };
  const {
    dragHandleY,
    setDragHandleY,
    dragHandleX,
    dropIndicator,
    containerRef,
    handleMouseMove,
    handlePointerDown
  } = useEditorBlockDrag(editor, isReadOnly);

  return (
    <div className="w-full flex-1 flex flex-col bg-bg-card overflow-hidden">
      <EditorToolbar
        editor={editor}
        isReadOnly={isReadOnly}
        setIsReadOnly={setIsReadOnly}
        showRightPanel={showRightPanel}
        setShowRightPanel={setShowRightPanel}
        showLeftPanel={showLeftPanel}
        setShowLeftPanel={setShowLeftPanel}
        setDiffContent={setDiffContent}
        activePath={activePath}
      />

      <div 
        ref={containerRef}
        className="flex-1 w-full bg-bg-card overflow-y-auto px-8 sm:px-16 md:px-24 py-12 cursor-text flex flex-col relative"
        onClick={() => editor?.commands.focus()}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setDragHandleY(null)}
      >
        {dragHandleY !== null && dragHandleX !== null && (
          <div 
            className="tiptap-drag-handle absolute z-50 cursor-grab active:cursor-grabbing text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-sm font-mono text-[14px] leading-none select-none touch-none"
            style={{ 
              top: `${dragHandleY}px`, 
              left: `${dragHandleX}px`, 
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'none'
            }}
            onPointerDown={handlePointerDown}
          >
            ⋮⋮
          </div>
        )}

        {dropIndicator && (
          <div 
            className="absolute bg-accent h-0.5 z-50 pointer-events-none transition-all duration-75 animate-pulse"
            style={{
              top: `${dropIndicator.top}px`,
              left: `${dropIndicator.left}px`,
              width: `${dropIndicator.width}px`
            }}
          />
        )}

        <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col">
          <div className="mb-6 border-b border-border-main pb-2 flex items-center justify-between text-[10px] font-bold text-text-muted select-none font-mono">
            <span className="h-[22px] flex items-center bg-bg-card px-2.5 py-0 border border-border-main truncate tracking-wider font-mono">
              {activePath.split('/').slice(-3, -1).join(' / ') || 'DOKUMEN'}
            </span>
            
            {!isReadOnly && (
              <button
                onClick={handleCreateVariation}
                className="h-[22px] flex items-center justify-center bg-bg-card border border-border-main px-2.5 py-0 text-text-muted hover:text-text-main hover:border-border-hover transition-colors font-mono text-[10px] font-bold cursor-pointer"
                title="Buat Variasi Baru dari File Ini"
              >
                <Plus size={10} />
              </button>
            )}
          </div>
          <EditorContent 
            editor={editor} 
            className="font-serif text-lg text-text-main flex-1 flex flex-col outline-none" 
          />
        </div>
      </div>

      <div className="w-full border-t border-border-main bg-bg-card px-6 py-2 flex items-center justify-end gap-2 text-[10px] font-bold text-text-muted select-none font-mono">
        <span className="h-[22px] flex items-center bg-bg-card px-2.5 py-0 border border-border-main tracking-wider font-mono">
          <span className="baseline-shift-xs">{words} kata</span>
        </span>
        <span className="h-[22px] flex items-center bg-bg-card px-2.5 py-0 border border-border-main tracking-wider font-mono">
          <span className="baseline-shift-xs">{chars} karakter</span>
        </span>
        {status !== 'Ready' && (
          <span className="h-[22px] flex items-center gap-1.5 bg-bg-card px-2.5 py-0 border border-border-main tracking-wider font-mono">
            <span className={`w-2 h-2 rounded-none border border-border-main ${status === 'Synced' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
            <span className="baseline-shift-xs">{status}</span>
          </span>
        )}
      </div>
    </div>
  );
}
