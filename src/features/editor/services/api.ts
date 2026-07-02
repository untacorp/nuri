import { invoke } from '@tauri-apps/api/core';

export interface Commit {
  hash: string;
  message: string;
  date: string;
}

export interface ChapterConfig {
  config: string[];
  availableFiles: string[];
}

export const fetchFile = async (path: string): Promise<{ content: string }> => {
  const content = await invoke<string>('read_file', { path });
  return { content };
};

export const saveFile = async (path: string, content: string) => {
  await invoke('write_file', { path, content });
  return { success: true };
};

export const fetchHistory = async (path: string): Promise<{ history: Commit[] }> => {
  const history = await invoke<Commit[]>('get_file_history', { absolutePath: path }); 
  return { history };
};

export const fetchHistoryContent = async (path: string, hash: string): Promise<{ content: string }> => {
  const content = await invoke<string>('get_file_content_at_commit', { absolutePath: path, hash }); 
  return { content };
};

export const createVariation = async (path: string, suffix: string, hash: string | null = null) => {
  const newPath = await invoke<string>('create_variation', { path, suffix, hash });
  return { success: true, newPath };
};

export const fetchChapterConfig = async (path: string): Promise<ChapterConfig> => {
  const res = await invoke<{ config: string[]; available_files: string[] }>('fetch_chapter_config', { path });
  return {
    config: res.config,
    availableFiles: res.available_files,
  };
};

export const saveChapterConfig = async (path: string, config: any) => {
  await invoke('save_chapter_config', { path, config });
  return { success: true };
};
