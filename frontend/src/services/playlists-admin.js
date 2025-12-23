import { getStoredAdminToken } from './admin';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const BASE_URL = API_URL;

// Create playlist
export async function adminCreatePlaylist(playlist) {
  const token = getStoredAdminToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${BASE_URL}/playlists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(playlist)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create playlist');
  }

  return response.json();
}

// Update playlist
export async function adminUpdatePlaylist(id, playlist) {
  const token = getStoredAdminToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${BASE_URL}/playlists/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(playlist)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update playlist');
  }

  return response.json();
}

// Delete playlist
export async function adminDeletePlaylist(id) {
  const token = getStoredAdminToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${BASE_URL}/playlists/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete playlist');
  }

  return response.json();
}

// Add song to playlist
export async function adminAddSong(playlistId, song) {
  const token = getStoredAdminToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${BASE_URL}/playlists/${playlistId}/songs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(song)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add song');
  }

  return response.json();
}

// Add multiple songs to playlist (bulk)
export async function adminAddSongsBulk(playlistId, songs) {
  const token = getStoredAdminToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${BASE_URL}/playlists/${playlistId}/songs/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ songs })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add songs');
  }

  return response.json();
}

// Delete song
export async function adminDeleteSong(playlistId, songId) {
  const token = getStoredAdminToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${BASE_URL}/playlists/${playlistId}/songs/${songId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete song');
  }

  return response.json();
}

// Fetch playlists (public endpoint, for refresh)
export async function fetchPlaylists() {
  const response = await fetch(`${BASE_URL}/playlists`);
  if (!response.ok) throw new Error('Failed to fetch playlists');
  return response.json();
}
