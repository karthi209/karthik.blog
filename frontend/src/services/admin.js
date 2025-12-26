const BASE = import.meta.env.VITE_API_URL || '/api';
const API = BASE;

export const getStoredAdminToken = () => {
  return localStorage.getItem('auth_token') || '';
};

export const setStoredAdminToken = (token) => {
  try { localStorage.setItem('auth_token', token || ''); } catch { /* ignore */ }
};

export const clearStoredAdminToken = () => {
  try { localStorage.removeItem('auth_token'); } catch { /* ignore */ }
};

const authHeaders = () => {
  const token = getStoredAdminToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const adminUploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API}/upload/image`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const adminListBlogs = async () => {
  const res = await fetch(`${API}/blogs/admin/list`, {
    method: 'GET',
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const result = await res.json();
  // Backend returns {success: true, data: [...]}
  return result.data || result;
};

export const adminUpdateBlog = async (id, { title, content, category, edition, tags, is_draft }) => {
  // Backend accepts title, content, category, and edition
  // Validate required fields before sending
  if (!title || !content || !category) {
    throw new Error(`Missing required fields: ${!title ? 'title' : ''} ${!content ? 'content' : ''} ${!category ? 'category' : ''}`.trim());
  }
  
  const res = await fetch(`${API}/blogs/admin/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ title, content, category, edition: edition || null }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    const errorMessage = error.errors?.length ? error.errors.join(', ') : (error.message || `HTTP ${res.status}`);
    throw new Error(errorMessage);
  }
  return res.json();
};

export const adminDeleteBlog = async (id) => {
  const res = await fetch(`${API}/blogs/admin/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const adminCreateBlog = async ({ title, content, category, edition, tags }) => {
  const res = await fetch(`${API}/blogs/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ title, content, category, edition: edition || null, tags }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const adminCreateGame = async ({
  title,
  platform,
  genre,
  release_year,
  cover_image_url,
  rating,
  hours_played,
  status,
  review,
  played_on
}) => {
  const res = await fetch(`${API}/games/admin/create-with-log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      title,
      platform,
      genre,
      release_year,
      cover_image_url,
      rating,
      hours_played,
      status,
      review,
      played_on
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const adminCreateLog = async ({ title, type, content, rating }) => {
  let endpoint;
  let body;

  if (type === 'movies' || type === 'series') {
    endpoint = `${API}/screens/admin/create-with-log`;
    body = {
      title,
      type: type === 'movies' ? 'movie' : 'series',
      rating,
      content
    };
  } else if (type === 'books') {
    endpoint = `${API}/reads/admin/create-with-log`;
    body = {
      title,
      rating,
      content
    };
  } else {
    throw new Error(`Unsupported log type: ${type}`);
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const adminCreatePlaylist = async ({ name, description, spotify_url, youtube_music_url }) => {
  const res = await fetch(`${API}/playlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, description, spotify_url, youtube_music_url }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const adminUpdatePlaylist = async (id, { name, description, spotify_url, youtube_music_url }) => {
  const res = await fetch(`${API}/playlists/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, description, spotify_url, youtube_music_url }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const adminDeletePlaylist = async (id) => {
  const res = await fetch(`${API}/playlists/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const adminAddSong = async (playlistId, { title, album, artist, year }) => {
  const res = await fetch(`${API}/playlists/${playlistId}/songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ title, album, artist, year }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const adminAddSongsBulk = async (playlistId, songs) => {
  const res = await fetch(`${API}/playlists/${playlistId}/songs/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ songs }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const adminDeleteSong = async (playlistId, songId) => {
  const res = await fetch(`${API}/playlists/${playlistId}/songs/${songId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

