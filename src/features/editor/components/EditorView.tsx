import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { turndownService } from '~/features/editor/utils/markdown';
import { generateDiffHtml } from '~/features/editor/utils/diffRenderer';
import { LibraryNode } from '~/features/library/components/TreeNode';
import InspectorContent from '~/features/inspector/components/InspectorContent';
import AssemblerView from '~/features/assembler/components/AssemblerView';
import LibraryContent from '~/features/library/components/LibraryContent';
import DiffViewer from '~/features/inspector/components/DiffViewer';
import EditorSheet from '~/features/editor/components/EditorSheet';

interface EditorViewProps {
  activeBook: LibraryNode | null;
  activePath: string | null;
  onSelectPath: (path: string | null) => void;
  goHome: () => void;
  onOpenModal: (type: string, parentNode: LibraryNode | null) => void;
  editor: any;
  status: string;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
  reloadTree: () => void;
  onAutoCompile?: (path: string) => void;
}

export default function EditorView({
  activeBook, activePath, onSelectPath,
  goHome, onOpenModal, editor, status, setStatus, reloadTree, onAutoCompile
}: EditorViewProps) {
  const [diffContent, setDiffContent] = useState<{ html: string; hash: string; rawContent: string } | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // Generic Panel States
  const [layoutSwapped, setLayoutSwapped] = useState(false); // false: Left=Library, Right=Inspector. true: Left=Inspector, Right=Library
  
  const [showLibrary, setShowLibrary] = useState(true);
  const [showInspector, setShowInspector] = useState(false);

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
  
  const [leftPanelWidth, setLeftPanelWidth] = useState(288);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [isReadOnly, editor]);

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const handleTransaction = () => setTick(t => t + 1);
    editor.on('transaction', handleTransaction);
    return () => {
      editor.off('transaction', handleTransaction);
    };
  }, [editor]);

  const isFolderView = activePath && !activePath.endsWith('.md');
  const chapterName = isFolderView ? activePath.split('/').pop() : '';

  const handleSelectHistory = async (content: string, hash: string) => {
    const currentMarkdown = turndownService.turndown(editor.getHTML());
    const diffHtml = await generateDiffHtml(content, currentMarkdown);
    setDiffContent({ html: diffHtml, hash, rawContent: content });
  };

  // Drag Handlers
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

  const renderLibraryContent = (isRightSide: boolean, onCollapse: () => void) => (
    <LibraryContent
      activeBook={activeBook}
      activePath={activePath}
      onSelectPath={onSelectPath}
      goHome={goHome}
      isRightSide={isRightSide}
      onToggleSwap={() => setLayoutSwapped(s => !s)}
      onOpenModal={onOpenModal}
      setStatus={setStatus}
      reloadTree={reloadTree}
      setDiffContent={setDiffContent}
      onCollapse={onCollapse}
    />
  );

  const renderInspectorContent = (isRightSide: boolean, onCollapse: () => void) => (
    <InspectorContent 
      activePath={activePath || ''} 
      onClose={onCollapse}
      onContentSelect={handleSelectHistory}
      status={status}
      editor={editor}
      isRightSide={isRightSide}
      onToggleSwap={() => setLayoutSwapped(s => !s)}
    />
  );

  return (
    <div className="flex h-screen overflow-hidden flex-row bg-bg-main animate-in fade-in duration-300">
      
      {/* Left Panel */}
      {showLeftPanel && (!layoutSwapped || activePath) && (
        <div className="relative shrink-0 flex h-full bg-bg-card border-r border-border-main z-10" style={{ width: leftPanelWidth }}>
          {layoutSwapped ? renderInspectorContent(false, () => setShowLeftPanel(false)) : renderLibraryContent(false, () => setShowLeftPanel(false))}
          <div 
            onMouseDown={handleLeftDrag}
            className="absolute top-0 bottom-0 right-0 translate-x-1/2 w-2 cursor-col-resize hover:bg-accent/50 z-50"
          />
        </div>
      )}
      
      {/* Center Area */}
      <div className="flex-1 flex overflow-hidden bg-bg-main min-w-[300px]">
        
        {/* Editor Utama / Assembler */}
        <div className="flex-1 flex flex-col items-center overflow-y-auto border-r border-border-main relative bg-bg-card">
          
          {!activePath ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted py-16">
              <FileText size={32} className="mb-4 opacity-30 text-text-muted" />
              <p className="font-mono text-xs text-text-muted tracking-wider mb-2">Pilih lembar tulisan untuk mulai merangkai cerita.</p>
              
              {((!layoutSwapped && !showLeftPanel) || (layoutSwapped && !showRightPanel)) && (
                <button 
                  onClick={() => layoutSwapped ? setShowRightPanel(true) : setShowLeftPanel(true)}
                  className="mt-6 flex items-center gap-2 px-6 py-3 bg-bg-card border border-border-main text-text-muted hover:text-text-main hover:border-border-hover hover:bg-bg-input transition-colors font-mono text-xs font-bold rounded-none"
                >
                  Buka Library
                </button>
              )}
            </div>
          ) : isFolderView ? (
            <div className="w-full h-full flex flex-col">
              <AssemblerView 
                activeBook={activeBook}
                activePath={activePath} 
                chapterName={chapterName || ''} 
                reloadTree={reloadTree}
                onAutoCompile={onAutoCompile}
              />
            </div>
          ) : (
            <EditorSheet
              editor={editor}
              isReadOnly={isReadOnly}
              setIsReadOnly={setIsReadOnly}
              showRightPanel={showRightPanel}
              setShowRightPanel={setShowRightPanel}
              showLeftPanel={showLeftPanel}
              setShowLeftPanel={setShowLeftPanel}
              setDiffContent={setDiffContent}
              activePath={activePath}
              onSelectPath={onSelectPath}
              reloadTree={reloadTree}
              status={status}
            />
          )}
        </div>

        {/* Panel Diff Viewer (Versi Masa Lalu) */}
        {diffContent && activePath && (
          <DiffViewer
            diffContent={diffContent}
            setDiffContent={setDiffContent}
            activePath={activePath}
            isReadOnly={isReadOnly}
            reloadTree={reloadTree}
            editor={editor}
            setStatus={setStatus}
          />
        )}
      </div>
      
      {/* Right Panel */}
      {showRightPanel && (layoutSwapped || activePath) && (
        <div className="relative shrink-0 flex h-full bg-bg-card border-l border-border-main z-10" style={{ width: rightPanelWidth }}>
          <div 
            onMouseDown={handleRightDrag}
            className="absolute top-0 bottom-0 left-0 -translate-x-1/2 w-2 cursor-col-resize hover:bg-accent/50 z-50"
          />
          {layoutSwapped ? renderLibraryContent(true, () => setShowRightPanel(false)) : renderInspectorContent(true, () => setShowRightPanel(false))}
        </div>
      )}
    </div>
  );
}
