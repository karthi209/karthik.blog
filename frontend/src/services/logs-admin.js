import { getStoredAdminToken } from './admin';

const BASE = import.meta.env.VITE_API_URL || '/api';
const API = BASE;

const authHeaders = () => {
  const token = getStoredAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const adminCreateLog = async ({ title, type, director, genre, year, cover_image_url, author, rating, content, tech, url, github_url, status }) => {
  const body = {
    title,
    category: type,
    cover_image_url,
    rating: rating ? String(rating) : null,
    content,
    content,
    // Pass other fields at top level, backend will merge into details
    director,
    genre,
    year,
    author,
    // Project fields
    tech,
    url,
    github_url,
    status
  };

  const res = await fetch(`${API}/logs`, {
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
  const res = await fetch(`${API}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      title,
      category: 'games',
      platform,
      genre,
      release_year,
      cover_image_url,
      rating: rating ? String(rating) : null,
      hours_played,
      status,
      content: review, // map review to content
      played_on
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${res.status}`);
  }
  return res.json();
};


