import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { turndownService } from '~/features/editor/utils/markdown';
import { generateDiffHtml } from '~/features/editor/utils/diffRenderer';
import { LibraryNode } from '~/features/library/components/TreeNode';
import InspectorPanel from '~/features/inspector/components/InspectorPanel';
import AssemblerView from '~/features/assembler/components/AssemblerView';
import LibrarySidebar from '~/features/library/components/LibrarySidebar';
import DiffViewer from '~/features/inspector/components/DiffViewer';
import EditorSheet from '~/features/editor/components/EditorSheet';

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
  const [showInspector, setShowInspector] = useState(false);
  const [diffContent, setDiffContent] = useState<{ html: string; hash: string; rawContent: string } | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

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

  return (
    <div className={`flex h-screen overflow-hidden ${sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in duration-300`}>
      
      {/* Sidebar */}
      <LibrarySidebar
        activeBook={activeBook}
        activePath={activePath}
        onSelectPath={onSelectPath}
        goHome={goHome}
        sidebarPosition={sidebarPosition}
        setSidebarPosition={setSidebarPosition}
        onOpenModal={onOpenModal}
        status={status}
        setStatus={setStatus}
        reloadTree={reloadTree}
        setDiffContent={setDiffContent}
      />
      
      {/* Editor Area (Bisa Terbelah Dua jika Diff Aktif) */}
      <div className="flex-1 flex overflow-hidden bg-bg-main">
        
        {/* Editor Utama / Assembler */}
        <div className="flex-1 flex flex-col items-center overflow-y-auto border-r border-border-main relative bg-bg-card">
          
          {!activePath ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted py-16">
              <FileText size={32} className="mb-4 opacity-30 text-text-muted" />
              <p className="font-mono text-xs text-text-muted tracking-wider">Pilih lembar tulisan di sidebar untuk mulai merangkai cerita.</p>
            </div>
          ) : isFolderView ? (
            <div className="w-full h-full flex flex-col">
              <AssemblerView activePath={activePath} chapterName={chapterName || ''} />
            </div>
          ) : (
            <EditorSheet
              editor={editor}
              isReadOnly={isReadOnly}
              setIsReadOnly={setIsReadOnly}
              status={status}
              showInspector={showInspector}
              setShowInspector={setShowInspector}
              setDiffContent={setDiffContent}
              activePath={activePath}

              onSelectPath={onSelectPath}
              reloadTree={reloadTree}
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
      
      {/* Panel Inspector Sidebar (Kanan) */}
      {showInspector && activePath && (
        <InspectorPanel 
          activePath={activePath} 
          onClose={() => {
            setShowInspector(false);
            setDiffContent(null);
          }}
          onContentSelect={handleSelectHistory}
          status={status}
          editor={editor}
        />
      )}
      
      {/* Status Bar */}
      {(isFolderView || !activePath) && status !== 'Ready' && (
        <div className="fixed bottom-6 right-6 bg-bg-card px-4 py-2 rounded-none border border-border-main text-xs font-bold font-mono text-text-main flex items-center gap-2.5 z-50 animate-in fade-in duration-300">
          <div className={`w-2.5 h-2.5 rounded-none border border-border-main ${status === 'Synced' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
          {status}
        </div>
      )}
    </div>
  );
}
