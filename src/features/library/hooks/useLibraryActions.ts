import { useState, useEffect } from 'react';
import { compileManuscript, renameNode, deleteNode } from '~/features/library/services/api';
import { showPrompt, showConfirm, showAlert } from '~/features/ui/components/GlobalDialog';
import { LibraryNode } from '~/types/library';

export function useLibraryActions(
  activeBook: LibraryNode | null,
  activePath: string | null,
  onSelectPath: (path: string | null) => void,
  reloadTree: () => void,
  setStatus: React.Dispatch<React.SetStateAction<string>>
) {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, node: LibraryNode } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, node: LibraryNode) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const handleRename = async (node: LibraryNode) => {
    const newName = await showPrompt(`Ubah nama "${node.name}" menjadi:`, node.name);
    if (newName && newName !== node.name) {
      const res = await renameNode(node.path, newName);
      if (res.success) {
        if (activePath === node.path) onSelectPath(null);
        reloadTree();
      } else {
        showAlert("Error", `Gagal mengubah nama: ${res.error}`);
      }
    }
  };

  const handleDelete = async (node: LibraryNode) => {
    const confirmed = await showConfirm("Hapus", `Apakah Anda yakin ingin menghapus ${node.name}?`);
    if (confirmed) {
      const res = await deleteNode(node.path);
      if (res.success) {
        if (activePath === node.path) onSelectPath(null);
        reloadTree();
      } else {
        showAlert("Error", `Gagal menghapus: ${res.error}`);
      }
    }
  };

  const handleCompileBook = async () => {
    if (!activeBook) return;
    setStatus('Compiling...');
    const res = await compileManuscript(activeBook.path);
    if (res.success) {
      showAlert("Kompilasi Sukses", `Dokumen berhasil dikompilasi!\nDisimpan di:\n${res.compiledPath}`);
      setStatus('Ready');
    } else {
      showAlert("Kompilasi Gagal", `Gagal kompilasi dokumen: ${res.error}`);
      setStatus('Error');
    }
  };

  return {
    contextMenu,
    setContextMenu,
    handleContextMenu,
    handleRename,
    handleDelete,
    handleCompileBook
  };
}
