import { getStoredAdminToken } from './admin';

const API = import.meta.env.VITE_API_URL || '/api';

const authHeaders = () => {
  const token = getStoredAdminToken();
  if (!token) throw new Error('Not authenticated');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const adminListGallery = async () => {
  const res = await fetch(`${API}/gallery/admin/list`, {
    headers: authHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || err?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
};

export const adminCreateGallery = async ({ title, caption, image_url, image_path }) => {
  const res = await fetch(`${API}/gallery/admin/create`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ title, caption, image_url, image_path })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || err?.message || `HTTP ${res.status}`);
  }
  return res.json();
};

export const adminUpdateGallery = async (id, { title, caption, image_url, image_path }) => {
  const res = await fetch(`${API}/gallery/admin/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ title, caption, image_url, image_path })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || err?.message || `HTTP ${res.status}`);
  }
  return res.json();
};

export const adminDeleteGallery = async (id) => {
  const res = await fetch(`${API}/gallery/admin/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || err?.message || `HTTP ${res.status}`);
  }
  return res.json();
};

