import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor } from '@tiptap/react';
import { Extension, textInputRule } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Mathematics } from '@tiptap/extension-mathematics';
import 'katex/dist/katex.min.css';

import { fetchTree, createNode, deleteBook, updateBook, compileManuscript } from '~/features/library/services/api';
import { fetchFile, saveFile } from '~/features/editor/services/api';
import { turndownService, parseMarkdown } from '~/features/editor/utils/markdown';

import CreateModal from '~/features/library/components/CreateModal';
import HomeView from '~/features/library/components/HomeView';
import EditorView from '~/features/editor/components/EditorView';
import SettingsModal from '~/features/library/components/SettingsModal';
import GlobalDialog, { showConfirm, showPrompt } from '~/features/ui/components/GlobalDialog';
import { LibraryNode } from '~/features/library/components/TreeNode';
import { listen } from '@tauri-apps/api/event';
import './index.css';

const EmDash = Extension.create({
  name: 'emDash',
  addInputRules() {
    return [
      textInputRule({
        find: /---$/,
        replace: '—',
      }),
    ];
  },
});

export default function App() {
  const [status, setStatus] = useState('Ready');
  const [tree, setTree] = useState<LibraryNode[]>([]);
  
  const [view, setView] = useState<'home' | 'editor'>('home');
  const [activeBook, setActiveBook] = useState<LibraryNode | null>(null);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [modalConfig, setModalConfig] = useState<{ 
    isOpen: boolean, 
    type: string, 
    parentNode: LibraryNode | null,
    editNode?: LibraryNode | null 
  }>({ isOpen: false, type: 'book', parentNode: null, editNode: null });
  
  const isUpdatingFromWs = useRef(false);
  const lastSentMarkdown = useRef('');
  const activePathRef = useRef<string | null>(null);
  const activeBookRef = useRef<LibraryNode | null>(null);

  useEffect(() => { activePathRef.current = activePath; }, [activePath]);
  useEffect(() => { activeBookRef.current = activeBook; }, [activeBook]);

  const loadTree = useCallback(() => {
    fetchTree().then(data => {
      setTree(data.tree || []);
      const currentBook = activeBookRef.current;
      if (currentBook) {
        const updatedBook = data.tree.find((b: LibraryNode) => b.path === currentBook.path);
        if (updatedBook) setActiveBook(updatedBook);
      }
    });
  }, []);

  const loadFile = (path: string | null) => {
    if (!path || !path.endsWith('.md')) {
      setStatus('Ready');
      return;
    }
    setStatus('Loading...');
    fetchFile(path).then(data => {
      if (data.content !== undefined && editor) {
        isUpdatingFromWs.current = true;
        editor.commands.setContent(parseMarkdown(data.content));
        lastSentMarkdown.current = turndownService.turndown(editor.getHTML());
        setTimeout(() => isUpdatingFromWs.current = false, 100);
        setStatus('Synced');
      }
    });
  };

  const autoCompileIfEnabled = (filePath: string) => {
    const book = activeBookRef.current;
    if (!book) return;

    const globalDefault = localStorage.getItem('nuri_auto_compile_default') === 'true';
    const bookSetting = book.auto_compile;
    const isAutoCompileEnabled = bookSetting !== undefined && bookSetting !== null ? bookSetting : globalDefault;

    if (!isAutoCompileEnabled) return;

    const bookPath = book.path.replace(/\/+$/, ''); // Remove trailing slash
    const normalizedFilePath = filePath.replace(/\\/g, '/');
    const normalizedBookPath = bookPath.replace(/\\/g, '/');

    if (!normalizedFilePath.startsWith(normalizedBookPath)) return;
    const relative = normalizedFilePath.slice(normalizedBookPath.length);
    const parts = relative.split('/').filter(Boolean);
    if (parts.length === 0) return;

    const chapterPath = `${normalizedBookPath}/${parts[0]}`;
    
    const normalizedChapterPath = chapterPath.replace(/\/+/g, '/');
    const normalizedDisabledList = (book.disabled_chapters || []).map(p => p.replace(/\\/g, '/').replace(/\/+/g, '/'));

    const isDisabled = normalizedDisabledList.includes(normalizedChapterPath);

    if (!isDisabled) {
      console.log(`Auto-compiling chapter: ${normalizedChapterPath} and book: ${normalizedBookPath}`);
      compileManuscript(normalizedChapterPath)
        .then(res => {
          if (!res.success) console.error("Auto-compile chapter failed:", res.error);
        })
        .catch(err => console.error("Auto-compile chapter error:", err));

      compileManuscript(normalizedBookPath)
        .then(res => {
          if (!res.success) console.error("Auto-compile book failed:", res.error);
        })
        .catch(err => console.error("Auto-compile book error:", err));
    }
  };

  const saveTimeout = useRef<any>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      EmDash,
      Mathematics.configure({
        inlineOptions: {
          onClick: (node, pos) => {
            const currentLatex = node.attrs.latex;
            showPrompt("Edit Rumus LaTeX (Inline)", currentLatex).then((newLatex) => {
              if (newLatex !== null) {
                if (newLatex.trim() === '') {
                  editor?.commands.deleteInlineMath({ pos });
                } else {
                  editor?.commands.updateInlineMath({ latex: newLatex.trim(), pos });
                }
              }
            });
          }
        },
        blockOptions: {
          onClick: (node, pos) => {
            const currentLatex = node.attrs.latex;
            showPrompt("Edit Rumus LaTeX (Block)", currentLatex).then((newLatex) => {
              if (newLatex !== null) {
                if (newLatex.trim() === '') {
                  editor?.commands.deleteBlockMath({ pos });
                } else {
                  editor?.commands.updateBlockMath({ latex: newLatex.trim(), pos });
                }
              }
            });
          }
        }
      })
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const currentPath = activePathRef.current;
      if (isUpdatingFromWs.current || !currentPath || !currentPath.endsWith('.md')) return;
      
      setStatus('Editing...');
      
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        setStatus('Saving...');
        const html = editor.getHTML();
        const markdown = turndownService.turndown(html);
        
        if (markdown === lastSentMarkdown.current) {
          setStatus('Synced');
          return;
        }
        
        lastSentMarkdown.current = markdown;
        saveFile(currentPath, markdown)
          .then(() => {
            setStatus('Synced');
            autoCompileIfEnabled(currentPath);
          })
          .catch((err) => {
            console.error(err);
            setStatus('Error');
          });
      }, 1500);
    }
  });

  useEffect(() => {
    loadTree();
    
    let unlistenTree: () => void;
    let unlistenFile: () => void;

    const setupListeners = async () => {
      unlistenTree = await listen('tree_update', () => {
        loadTree();
      });
      unlistenFile = await listen('file_update', (event: any) => {
        const data = event.payload;
        if (editor && activePathRef.current === data.path) {
          if (data.content.trim() !== lastSentMarkdown.current.trim()) {
            const currentMarkdown = turndownService.turndown(editor.getHTML());
            if (data.content.trim() !== currentMarkdown.trim()) {
              isUpdatingFromWs.current = true;
              editor.commands.setContent(parseMarkdown(data.content));
              setTimeout(() => { isUpdatingFromWs.current = false; setStatus('Synced'); }, 100);
            } else {
              setStatus('Synced');
            }
          } else {
            setStatus('Synced');
          }
        }
      });
    };
    
    setupListeners();

    return () => {
      if (unlistenTree) unlistenTree();
      if (unlistenFile) unlistenFile();
    };
  }, [editor, loadTree]);

  // Unified select handler to flush pending edits before switching files/views
  const handleSelectPath = (newPath: string | null) => {
    if (saveTimeout.current && activePath && activePath.endsWith('.md')) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
      
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);
      
      if (markdown !== lastSentMarkdown.current) {
        setStatus('Saving...');
        lastSentMarkdown.current = markdown;
        saveFile(activePath, markdown)
          .then(() => {
            setStatus('Synced');
            autoCompileIfEnabled(activePath);
            setActivePath(newPath);
            loadFile(newPath);
          })
          .catch((err) => {
            console.error(err);
            setStatus('Error');
            setActivePath(newPath);
            loadFile(newPath);
          });
        return;
      }
    }
    setActivePath(newPath);
    loadFile(newPath);
  };

  const handleCreateNode = (name: string, type: string, parentNode: LibraryNode | null, customPath?: string, description?: string, coverImage?: string, autoCompile?: boolean | null) => {
    if (type === 'edit-book' && modalConfig.editNode) {
      updateBook(modalConfig.editNode.path, name, description, coverImage, autoCompile, modalConfig.editNode.disabled_chapters).then(() => loadTree());
    } else {
      createNode(type, name, parentNode?.path || '', customPath, description, coverImage, autoCompile).then(() => loadTree());
    }
  };

  const handleDeleteBook = async (book: LibraryNode) => {
    const confirmed = await showConfirm(
      "Hapus Buku?", 
      `Hapus buku "${book.name}" dari indeks perpustakaan?\n\n(Tenang, file fisik Markdown-nya TIDAK akan dihapus dari komputermu, hanya dihilangkan dari daftar ini)`
    );
    if (confirmed) {
      deleteBook(book.path).then(() => loadTree());
    }
  };

  const handleEditBook = (book: LibraryNode) => {
    setModalConfig({
      isOpen: true,
      type: 'edit-book',
      parentNode: null,
      editNode: book
    });
  };

  const openBook = (book: LibraryNode) => {
    setActiveBook(book);
    setView('editor');
    setActivePath(null);
    if (editor) editor.commands.setContent('');
  };

  const goHome = () => {
    if (saveTimeout.current && activePath && activePath.endsWith('.md')) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
      
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);
      
      if (markdown !== lastSentMarkdown.current) {
        setStatus('Saving...');
        lastSentMarkdown.current = markdown;
        saveFile(activePath, markdown)
          .then(() => {
            setStatus('Synced');
            autoCompileIfEnabled(activePath);
          })
          .catch(() => setStatus('Error'));
      }
    }
    setView('home');
    setActiveBook(null);
    setActivePath(null);
  };

  const handleOpenModal = (type: string, parentNode: LibraryNode | null) => setModalConfig({ isOpen: true, type, parentNode });

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen transition-colors duration-300 font-sans">
      <GlobalDialog />
      <CreateModal 
        isOpen={modalConfig.isOpen} 
        type={modalConfig.type} 
        parentNode={modalConfig.parentNode} 
        editNode={modalConfig.editNode}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onSubmit={handleCreateNode}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {view === 'home' && (
        <HomeView 
          tree={tree} 
          openBook={openBook} 
          onOpenModal={handleOpenModal} 
          onEditBook={handleEditBook}
          onDeleteBook={handleDeleteBook}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {view === 'editor' && (
        <EditorView 
          activeBook={activeBook}
          activePath={activePath}
          onSelectPath={handleSelectPath}
          goHome={goHome}
          onOpenModal={handleOpenModal}
          editor={editor}
          status={status}
          setStatus={setStatus}
          reloadTree={loadTree}
          onAutoCompile={autoCompileIfEnabled}
        />
      )}
    </div>
  );
}
