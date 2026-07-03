import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { EditorContent } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
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
  const [dragHandleY, setDragHandleY] = useState<number | null>(null);
  const [dragHandleX, setDragHandleX] = useState<number | null>(null);
  const [dragHandleNodePos, setDragHandleNodePos] = useState<number | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ top: number; left: number; width: number; insertPos: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!editor || isReadOnly) return;
    const target = e.target as HTMLElement;

    // If hovering the drag handle itself, do nothing
    if (target.classList.contains('tiptap-drag-handle') || target.closest('.tiptap-drag-handle')) {
      return;
    }

    const view = editor.view;
    const tiptapContainer = view.dom;
    const containerRect = e.currentTarget.getBoundingClientRect();
    const clientY = e.clientY;
    
    // Find the block element at this vertical Y position
    const blocks = Array.from(tiptapContainer.children) as HTMLElement[];
    let activeBlock: HTMLElement | null = null;
    
    for (const block of blocks) {
      if (block.classList.contains('tiptap-drag-handle')) continue;
      const rect = block.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) {
        activeBlock = block;
        break;
      }
    }
    
    if (!activeBlock || activeBlock.nodeName === 'DIV') {
      setDragHandleY(null);
      return;
    }
    
    try {
      const posInside = view.posAtDOM(activeBlock, 0);
      const $pos = view.state.doc.resolve(posInside);
      const nodePos = $pos.before(1);
      const rect = activeBlock.getBoundingClientRect();
      
      const y = rect.top - containerRect.top + e.currentTarget.scrollTop;
      const x = rect.left - containerRect.left - 24; // 24px left of text
      
      setDragHandleY(y + (rect.height - 18) / 2);
      setDragHandleX(x);
      setDragHandleNodePos(nodePos);
    } catch (err) {
      // Ignore
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragHandleNodePos === null || !editor) return;
    if (e.button !== 0) return; // Only drag with left click
    
    // Prevent default selection / drag behaviors
    e.preventDefault();
    
    const view = editor.view;
    const { state, dispatch } = view;
    
    // 1. Select the node being dragged in ProseMirror
    const nodeSelection = NodeSelection.create(state.doc, dragHandleNodePos);
    dispatch(state.tr.setSelection(nodeSelection));
    
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    
    // Pre-calculate all block positions and rectangles at the start of drag
    const tiptapContainer = view.dom;
    const blocksDOM = Array.from(tiptapContainer.children) as HTMLElement[];
    
    const blockInfos = blocksDOM.map(blockDOM => {
      try {
        const posInside = view.posAtDOM(blockDOM, 0);
        const $pos = view.state.doc.resolve(posInside);
        const startPos = $pos.before(1);
        const node = view.state.doc.nodeAt(startPos);
        if (!node) return null;
        return {
          rect: blockDOM.getBoundingClientRect(),
          startPos,
          size: node.nodeSize
        };
      } catch (err) {
        return null;
      }
    }).filter((b): b is NonNullable<typeof b> => b !== null);
    
    if (blockInfos.length === 0) return;
    
    const N = blockInfos.length;
    // Midpoints of each block
    const midpoints = blockInfos.map(b => b.rect.top + b.rect.height / 2);
    
    let targetInsertPos: number | null = null;
    
    const onPointerMove = (moveEvent: PointerEvent) => {
      const clientY = moveEvent.clientY;
      
      let targetIdx = 0;
      let indicatorY = 0;
      let insertPos = 0;
      
      if (clientY < midpoints[0]) {
        // Target before first block
        targetIdx = 0;
        indicatorY = blockInfos[0].rect.top - containerRect.top + container.scrollTop;
        insertPos = blockInfos[0].startPos;
      } else if (clientY >= midpoints[N - 1]) {
        // Target after last block
        targetIdx = N;
        indicatorY = blockInfos[N - 1].rect.bottom - containerRect.top + container.scrollTop;
        insertPos = blockInfos[N - 1].startPos + blockInfos[N - 1].size;
      } else {
        // Target between blocks
        for (let i = 0; i < N - 1; i++) {
          if (clientY >= midpoints[i] && clientY < midpoints[i + 1]) {
            targetIdx = i + 1;
            // Draw line exactly in the middle of the gap
            indicatorY = ((blockInfos[i].rect.bottom + blockInfos[i + 1].rect.top) / 2) - containerRect.top + container.scrollTop;
            insertPos = blockInfos[i + 1].startPos;
            break;
          }
        }
      }
      
      // Get the corresponding left & width from the target area's block
      const activeRect = targetIdx < N ? blockInfos[targetIdx].rect : blockInfos[N - 1].rect;
      
      setDropIndicator({
        top: indicatorY,
        left: activeRect.left - containerRect.left,
        width: activeRect.width,
        insertPos: insertPos
      });
      targetInsertPos = insertPos;
    };
    
    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      
      setDropIndicator(null);
      
      if (targetInsertPos !== null) {
        const { state, dispatch } = view;
        const dragNode = state.doc.nodeAt(dragHandleNodePos);
        
        // Ensure we are dragging a valid node and not dropping inside itself
        if (dragNode && (targetInsertPos < dragHandleNodePos || targetInsertPos > dragHandleNodePos + dragNode.nodeSize)) {
          const tr = state.tr;
          
          let adjustedInsertPos = targetInsertPos;
          if (targetInsertPos > dragHandleNodePos) {
            adjustedInsertPos = targetInsertPos - dragNode.nodeSize;
          }
          
          // Delete original node first, then insert it at the adjusted position
          tr.delete(dragHandleNodePos, dragHandleNodePos + dragNode.nodeSize);
          tr.insert(adjustedInsertPos, dragNode);
          
          dispatch(tr);
          
          // Force reframing of the drag handle
          setDragHandleY(null);
        }
      }
    };
    
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

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
