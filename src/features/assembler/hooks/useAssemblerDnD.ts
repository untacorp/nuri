import { useState } from 'react';

export function useAssemblerDnD(
  config: string[], 
  setConfig: React.Dispatch<React.SetStateAction<string[]>>,
  handleSave: (config: string[]) => void
) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newConfig = [...config];
    const item = newConfig.splice(index, 1)[0];
    newConfig.splice(index - 1, 0, item);
    handleSave(newConfig);
  };

  const moveDown = (index: number) => {
    if (index === config.length - 1) return;
    const newConfig = [...config];
    const item = newConfig.splice(index, 1)[0];
    newConfig.splice(index + 1, 0, item);
    handleSave(newConfig);
  };

  const startDrag = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
    if (e.button !== 0) return; // Only drag with left click
    
    // Prevent default text selection or dragging behavior
    e.preventDefault();
    
    const gripElement = e.currentTarget;
    const itemElement = gripElement.closest('[data-drag-index]');
    if (!itemElement) return;
    
    const listContainer = itemElement.parentElement;
    if (!listContainer) return;
    
    setDraggedIdx(index);
    
    // Collect coordinates of all items
    const childElements = Array.from(listContainer.querySelectorAll('[data-drag-index]')) as HTMLElement[];
    const rects = childElements.map(el => el.getBoundingClientRect());
    
    let currentIdx = index;
    let currentConfig = [...config];
    
    const onPointerMove = (moveEvent: PointerEvent) => {
      const clientY = moveEvent.clientY;
      let targetIdx = currentIdx;
      
      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        const middleY = rect.top + rect.height / 2;
        
        if (i === 0 && clientY < middleY) {
          targetIdx = 0;
          break;
        } else if (i === rects.length - 1 && clientY > middleY) {
          targetIdx = rects.length - 1;
          break;
        } else if (clientY >= rect.top && clientY <= rect.bottom) {
          targetIdx = i;
          break;
        }
      }
      
      if (targetIdx !== currentIdx) {
        const nextConfig = [...currentConfig];
        const item = nextConfig.splice(currentIdx, 1)[0];
        nextConfig.splice(targetIdx, 0, item);
        
        // Update local state for immediate visual feedback
        setConfig(nextConfig);
        
        // Keep track of the current active position and configuration
        currentConfig = nextConfig;
        currentIdx = targetIdx;
        setDraggedIdx(targetIdx);
      }
    };
    
    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      
      setDraggedIdx(null);
      handleSave(currentConfig);
    };
    
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  return { draggedIdx, moveUp, moveDown, startDrag };
}
