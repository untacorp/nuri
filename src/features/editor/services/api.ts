import { invoke } from '@tauri-apps/api/core';

export const fetchFile = async (path: string) => {
  const content = await invoke('read_file', { path });
  return { content };
};

export const saveFile = async (path: string, content: string) => {
  await invoke('write_file', { path, content });
  return { success: true };
};

export const fetchHistory = async (path: string) => {
  const history = await invoke('get_file_history', { absolutePath: path }); 
  return { history };
};

export const fetchHistoryContent = async (path: string, hash: string) => {
  const content = await invoke('get_file_content_at_commit', { absolutePath: path, hash }); 
  return { content };
};

export const createVariation = async (path: string, suffix: string, hash: string | null = null) => {
  const newPath = await invoke('create_variation', { path, suffix, hash });
  return { success: true, newPath };
};

export const fetchChapterConfig = async (path: string) => {
  return await invoke('fetch_chapter_config', { path });
};

export const saveChapterConfig = async (path: string, config: any) => {
  await invoke('save_chapter_config', { path, config });
  return { success: true };
};
