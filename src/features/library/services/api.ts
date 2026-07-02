import { invoke } from '@tauri-apps/api/core';

export const fetchTree = async () => {
  return await invoke('fetch_tree');
};

export const createNode = async (type: string, name: string, parentPath: string, customPath?: string) => {
  await invoke('create_node', { nodeType: type, name, parentPath, customPath });
  return { success: true };
};

export const deleteBook = async (path: string) => {
  return await invoke('delete_book_from_library', { absolutePath: path });
};

export const updateBookName = async (path: string, name: string) => {
  return await invoke('update_book_in_library', { absolutePath: path, newName: name });
};

export const compileManuscript = async (path: string) => {
  const compiledPath = await invoke('compile_manuscript', { path });
  return { success: true, compiledPath, type: 'book' };
};

export const renameNode = async (path: string, newName: string) => {
  await invoke('rename_node', { path, newName });
  return { success: true };
};

export const deleteNode = async (path: string) => {
  await invoke('delete_node', { path });
  return { success: true };
};
