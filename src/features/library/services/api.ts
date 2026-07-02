import { invoke } from '@tauri-apps/api/core';
import { LibraryNode } from '../components/TreeNode';

export const fetchTree = async (): Promise<{ tree: LibraryNode[] }> => {
  return await invoke<{ tree: LibraryNode[] }>('fetch_tree');
};

export const createNode = async (type: string, name: string, parentPath: string, customPath?: string) => {
  await invoke('create_node', { nodeType: type, name, parentPath, customPath });
  return { success: true };
};

export const deleteBook = async (path: string) => {
  await invoke('delete_book_from_library', { absolutePath: path });
  return { success: true };
};

export const updateBookName = async (path: string, name: string) => {
  await invoke('update_book_in_library', { absolutePath: path, newName: name });
  return { success: true };
};

export const compileManuscript = async (path: string) => {
  try {
    const compiledPath = await invoke<string>('compile_manuscript', { path });
    return { success: true, compiledPath, type: 'book', error: null as string | null };
  } catch (err: any) {
    return { success: false, compiledPath: null, type: 'book', error: err.toString() as string };
  }
};

export const renameNode = async (path: string, newName: string) => {
  try {
    const actualNewName = path.endsWith('.md') && !newName.endsWith('.md') ? `${newName}.md` : newName;
    await invoke('rename_node', { path, newName: actualNewName });
    const parts = path.split('/');
    parts[parts.length - 1] = actualNewName;
    const newPath = parts.join('/');
    return { success: true, newPath, error: null as string | null };
  } catch (err: any) {
    return { success: false, newPath: null as string | null, error: err.toString() as string };
  }
};

export const deleteNode = async (path: string) => {
  try {
    await invoke('delete_node', { path });
    return { success: true, error: null as string | null };
  } catch (err: any) {
    return { success: false, error: err.toString() as string };
  }
};
