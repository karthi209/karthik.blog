const BASE = import.meta.env.VITE_API_URL || '/api';
const API = BASE;

// Reuse token logic from admin.js or duplicate for independence
const getStoredAdminToken = () => {
    return localStorage.getItem('auth_token') || '';
};

const authHeaders = () => {
    const token = getStoredAdminToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// List all anthologies
export const adminListAnthologies = async (isPublic) => {
    let url = `${API}/anthologies`;
    if (isPublic !== undefined) {
        url += `?is_public=${isPublic}`;
    }
    const res = await fetch(url, {
        method: 'GET',
        headers: { ...authHeaders() },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    // Backend may return array directly or {success: true, data: [...]}
    return Array.isArray(result) ? result : (result.data || []);
};

// Get single anthology by Slug (Public/Private depending on token)
export const getAnthologyBySlug = async (slug) => {
    const res = await fetch(`${API}/anthologies/${slug}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
};

// Create Anthology
export const adminCreateAnthology = async ({ title, description, slug, blogs, is_public }) => {
    const res = await fetch(`${API}/anthologies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ title, description, slug, blogs, is_public }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
};

// Update Anthology
export const adminUpdateAnthology = async (id, { title, description, slug, blogs, is_public }) => {
    const res = await fetch(`${API}/anthologies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ title, description, slug, blogs, is_public }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
};

// Delete Anthology
export const adminDeleteAnthology = async (id) => {
    const res = await fetch(`${API}/anthologies/${id}`, {
        method: 'DELETE',
        headers: { ...authHeaders() },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
};
