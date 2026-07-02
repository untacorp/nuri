import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { fetchTree, createNode, deleteBook, updateBookName } from './features/library/services/api';
import { fetchFile, saveFile } from './features/editor/services/api';
import { createWebSocketConnection } from './features/editor/services/ws';
import { turndownService, parseMarkdown } from './features/editor/utils/markdown';

import CreateModal from './features/library/components/CreateModal';
import HomeView from './features/library/components/HomeView';
import EditorView from './features/editor/components/EditorView';
import GlobalDialog, { showConfirm, showPrompt } from './features/ui/components/GlobalDialog';
import './index.css';

export default function App() {
  const [status, setStatus] = useState('Ready');
  const [sidebarPosition, setSidebarPosition] = useState('left');
  const [tree, setTree] = useState([]);
  
  const [view, setView] = useState('home');
  const [activeBook, setActiveBook] = useState(null);
  const [activePath, setActivePath] = useState(null);
  
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'book', parentNode: null });
  
  const ws = useRef(null);
  const isUpdatingFromWs = useRef(false);
  const lastSentMarkdown = useRef('');
  const activePathRef = useRef(null);
  const activeBookRef = useRef(null);

  useEffect(() => { activePathRef.current = activePath; }, [activePath]);
  useEffect(() => { activeBookRef.current = activeBook; }, [activeBook]);

  const loadTree = useCallback(() => {
    fetchTree().then(data => {
      setTree(data.tree || []);
      const currentBook = activeBookRef.current;
      if (currentBook) {
        const updatedBook = data.tree.find(b => b.path === currentBook.path);
        if (updatedBook) setActiveBook(updatedBook);
      }
    });
  }, []);

  const loadFile = (path) => {
    if (!path || !path.endsWith('.md')) {
      setStatus('Ready');
      return;
    }
    setStatus('Loading...');
    fetchFile(path).then(data => {
      if (data.content !== undefined && editor) {
        isUpdatingFromWs.current = true;
        editor.commands.setContent(parseMarkdown(data.content), false);
        lastSentMarkdown.current = turndownService.turndown(editor.getHTML());
        setTimeout(() => isUpdatingFromWs.current = false, 100);
        setStatus('Synced');
      }
    });
  };

  const saveTimeout = useRef(null);

  const editor = useEditor({
    extensions: [StarterKit],
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
          .then(() => setStatus('Synced'))
          .catch((err) => {
            console.error(err);
            setStatus('Error');
          });
      }, 1500);
    }
  });

  useEffect(() => {
    loadTree();
    ws.current = createWebSocketConnection((data) => {
      if (data.type === 'tree_update') {
        loadTree();
      } else if (data.type === 'file_update' && editor && activePathRef.current === data.path) {
        if (data.content.trim() !== lastSentMarkdown.current.trim()) {
          const currentMarkdown = turndownService.turndown(editor.getHTML());
          if (data.content.trim() !== currentMarkdown.trim()) {
            isUpdatingFromWs.current = true;
            editor.commands.setContent(parseMarkdown(data.content), false);
            setTimeout(() => { isUpdatingFromWs.current = false; setStatus('Synced'); }, 100);
          } else {
            setStatus('Synced');
          }
        } else {
          setStatus('Synced');
        }
      }
    });
    return () => ws.current?.close();
  }, [editor, loadTree]);

  // Unified select handler to flush pending edits before switching files/views
  const handleSelectPath = (newPath) => {
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

  const handleCreateNode = (name, type, parentNode, customPath) => {
    createNode(type, name, parentNode?.path || '', customPath).then(() => loadTree());
  };

  const handleDeleteBook = async (book) => {
    const confirmed = await showConfirm(
      "Hapus Buku?", 
      `Hapus buku "${book.name}" dari indeks perpustakaan?\n\n(Tenang, file fisik Markdown-nya TIDAK akan dihapus dari komputermu, hanya dihilangkan dari daftar ini)`
    );
    if (confirmed) {
      deleteBook(book.path).then(() => loadTree());
    }
  };

  const handleEditBook = async (book) => {
    const newName = await showPrompt('Ubah Judul Buku:', book.name);
    if (newName && newName.trim() && newName !== book.name) {
      updateBookName(book.path, newName.trim()).then(() => loadTree());
    }
  };

  const openBook = (book) => {
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
          .then(() => setStatus('Synced'))
          .catch(() => setStatus('Error'));
      }
    }
    setView('home');
    setActiveBook(null);
    setActivePath(null);
  };

  const handleOpenModal = (type, parentNode) => setModalConfig({ isOpen: true, type, parentNode });

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen transition-colors duration-300 font-sans">
      <GlobalDialog />
      <CreateModal 
        isOpen={modalConfig.isOpen} 
        type={modalConfig.type} 
        parentNode={modalConfig.parentNode} 
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onSubmit={handleCreateNode}
      />

      {view === 'home' && (
        <HomeView 
          tree={tree} 
          openBook={openBook} 
          onOpenModal={handleOpenModal} 
          onEditBook={handleEditBook}
          onDeleteBook={handleDeleteBook}
        />
      )}

      {view === 'editor' && (
        <EditorView 
          activeBook={activeBook}
          activePath={activePath}
          onSelectPath={handleSelectPath}
          goHome={goHome}
          sidebarPosition={sidebarPosition}
          setSidebarPosition={setSidebarPosition}
          onOpenModal={handleOpenModal}
          editor={editor}
          status={status}
          reloadTree={loadTree}
        />
      )}
    </div>
  );
}
