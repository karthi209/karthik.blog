import { getStoredAuthToken } from './auth';

const API = import.meta.env.VITE_API_URL || '/api';

const authHeaders = () => {
  const token = getStoredAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchBlogComments = async (blogId) => {
  const res = await fetch(`${API}/blogs/${blogId}/comments`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.rows) ? data.rows : [];
};

export const postBlogComment = async (blogId, content) => {
  const res = await fetch(`${API}/blogs/${blogId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ content })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || err?.message || `HTTP ${res.status}`);
  }
  return res.json();
};

export const deleteBlogComment = async (blogId, commentId) => {
  const res = await fetch(`${API}/blogs/${blogId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || err?.message || `HTTP ${res.status}`);
  }
  return res.json();
};

export const fetchBlogLikes = async (blogId) => {
  const res = await fetch(`${API}/blogs/${blogId}/likes`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const toggleBlogLike = async (blogId) => {
  const res = await fetch(`${API}/blogs/${blogId}/likes/toggle`, {
    method: 'POST',
    headers: { ...authHeaders() }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || err?.message || `HTTP ${res.status}`);
  }
  return res.json();
};

export const fetchNoteLikes = async (noteId) => {
  const res = await fetch(`${API}/notes/${noteId}/likes`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const toggleNoteLike = async (noteId) => {
  const res = await fetch(`${API}/notes/${noteId}/likes/toggle`, {
    method: 'POST',
    headers: { ...authHeaders() }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || err?.message || `HTTP ${res.status}`);
  }
  return res.json();
};
