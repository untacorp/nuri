import { API_URL } from '../../../config/env';

export const fetchTree = async () => {
  const res = await fetch(`${API_URL}/api/tree`);
  return res.json();
};

export const createNode = async (type: string, name: string, parentPath: string, customPath?: string) => {
  const res = await fetch(`${API_URL}/api/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, name, parentPath, customPath })
  });
  return res.json();
};

export const deleteBook = async (path: string) => {
  const res = await fetch(`${API_URL}/api/library`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path })
  });
  return res.json();
};

export const updateBookName = async (path: string, name: string) => {
  const res = await fetch(`${API_URL}/api/library`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, name })
  });
  return res.json();
};

export const compileManuscript = async (path: string) => {
  const res = await fetch(`${API_URL}/api/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path })
  });
  return res.json();
};

export const renameNode = async (path: string, newName: string) => {
  const res = await fetch(`${API_URL}/api/rename`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, newName })
  });
  return res.json();
};

export const deleteNode = async (path: string) => {
  const res = await fetch(`${API_URL}/api/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path })
  });
  return res.json();
};
