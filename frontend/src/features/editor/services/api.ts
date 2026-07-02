import { API_URL } from '../../../config/env';

export const fetchFile = async (path) => {
  const res = await fetch(`${API_URL}/api/file?path=${encodeURIComponent(path)}`);
  return res.json();
};

export const saveFile = async (path, content) => {
  const res = await fetch(`${API_URL}/api/file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content })
  });
  return res.json();
};

export const fetchHistory = async (path) => {
  const res = await fetch(`${API_URL}/api/history?path=${encodeURIComponent(path)}`);
  return res.json();
};

export const fetchHistoryContent = async (path, hash) => {
  const res = await fetch(`${API_URL}/api/history/content?path=${encodeURIComponent(path)}&hash=${encodeURIComponent(hash)}`);
  return res.json();
};

export const createVariation = async (path, suffix, hash = null) => {
  const res = await fetch(`${API_URL}/api/variation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, suffix, hash })
  });
  return res.json();
};


export const fetchChapterConfig = async (path) => {
  const res = await fetch(`${API_URL}/api/assembler/chapter?path=${encodeURIComponent(path)}`);
  return res.json();
};

export const saveChapterConfig = async (path, config) => {
  const res = await fetch(`${API_URL}/api/assembler/chapter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, config })
  });
  return res.json();
};
