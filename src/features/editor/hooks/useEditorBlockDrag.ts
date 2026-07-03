import { useState, useRef } from 'react';
import { NodeSelection } from '@tiptap/pm/state';

export function useEditorBlockDrag(editor: any, isReadOnly: boolean) {
  const [dragHandleY, setDragHandleY] = useState<number | null>(null);
  const [dragHandleX, setDragHandleX] = useState<number | null>(null);
  const [dragHandleNodePos, setDragHandleNodePos] = useState<number | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ top: number; left: number; width: number; insertPos: number } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

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

  return {
    dragHandleY,
    setDragHandleY,
    dragHandleX,
    dropIndicator,
    containerRef,
    handleMouseMove,
    handlePointerDown
  };
}
