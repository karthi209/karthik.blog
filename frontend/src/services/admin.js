const BASE = import.meta.env.VITE_API_URL || '/api';
const API = BASE;

export const getStoredApiKey = () => {
  // Get from localStorage (set during login)
  return localStorage.getItem('admin_api_key') || '';
};

export const setStoredApiKey = (key) => {
  try { localStorage.setItem('admin_api_key', key || ''); } catch { /* ignore */ }
};

const authHeaders = () => {
  const key = getStoredApiKey();
  return key ? { 'x-api-key': key } : {};
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
  return res.json();
};

export const adminUpdateBlog = async (id, { title, content, category, tags, is_draft }) => {
  const res = await fetch(`${API}/blogs/admin/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ title, content, category, tags, is_draft }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
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

export const adminCreateBlog = async ({ title, content, category, tags }) => {
  const res = await fetch(`${API}/blogs/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ title, content, category, tags }),
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

