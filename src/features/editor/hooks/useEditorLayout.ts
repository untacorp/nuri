import { useState } from 'react';

export function useEditorLayout() {
  const [layoutSwapped, setLayoutSwapped] = useState(false);
  const [showLibrary, setShowLibrary] = useState(true);
  const [showInspector, setShowInspector] = useState(false);
  
  const [leftPanelWidth, setLeftPanelWidth] = useState(288);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);

  const showLeftPanel = layoutSwapped ? showInspector : showLibrary;
  const showRightPanel = layoutSwapped ? showLibrary : showInspector;

  const setShowLeftPanel = (val: boolean | ((prev: boolean) => boolean)) => {
    if (layoutSwapped) {
      setShowInspector(prev => typeof val === 'function' ? val(prev) : val);
    } else {
      setShowLibrary(prev => typeof val === 'function' ? val(prev) : val);
    }
  };

  const setShowRightPanel = (val: boolean | ((prev: boolean) => boolean)) => {
    if (layoutSwapped) {
      setShowLibrary(prev => typeof val === 'function' ? val(prev) : val);
    } else {
      setShowInspector(prev => typeof val === 'function' ? val(prev) : val);
    }
  };

  const handleLeftDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftPanelWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      setLeftPanelWidth(Math.max(200, Math.min(startWidth + delta, 800)));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleRightDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightPanelWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      setRightPanelWidth(Math.max(250, Math.min(startWidth - delta, 600)));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return {
    layoutSwapped,
    setLayoutSwapped,
    showLeftPanel,
    setShowLeftPanel,
    showRightPanel,
    setShowRightPanel,
    leftPanelWidth,
    rightPanelWidth,
    handleLeftDrag,
    handleRightDrag
  };
}
