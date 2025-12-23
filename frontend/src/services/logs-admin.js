import { getStoredAdminToken } from './admin';

const BASE = import.meta.env.VITE_API_URL || '/api';
const API = BASE;

const authHeaders = () => {
  const token = getStoredAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const adminCreateLog = async ({ title, type, director, genre, year, cover_image_url, author, rating, content }) => {
  let endpoint;
  let body;

  if (type === 'movies' || type === 'series') {
    endpoint = `${API}/screens/admin/create-with-log`;
    body = {
      title,
      type: type === 'movies' ? 'movie' : 'series',
      director,
      genre,
      year,
      cover_image_url,
      rating,
      content
    };
  } else if (type === 'books') {
    endpoint = `${API}/reads/admin/create-with-log`;
    body = {
      title,
      author,
      genre,
      year,
      cover_image_url,
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
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${res.status}`);
  }
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
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${res.status}`);
  }
  return res.json();
};


