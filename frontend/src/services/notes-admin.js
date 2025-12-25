import { getStoredAdminToken } from './admin';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const authHeaders = () => {
  const token = getStoredAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const adminListNotes = async () => {
  const res = await fetch(`${API_URL}/notes/admin/list`, {
    method: 'GET',
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const result = await res.json();
  // Backend returns {success: true, data: [...]}
  return result.data || result;
};

export const adminCreateNote = async ({ title, content, tags }) => {
  const res = await fetch(`${API_URL}/notes/admin/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ title, content, tags })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
};

export const adminUpdateNote = async (id, { title, content, tags }) => {
  const res = await fetch(`${API_URL}/notes/admin/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ title, content, tags })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
};

export const adminDeleteNote = async (id) => {
  const res = await fetch(`${API_URL}/notes/admin/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
};
