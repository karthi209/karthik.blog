import { getStoredAdminToken } from './admin';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const BASE_URL = API_URL;

// Create playlist (Music Log)
export async function adminCreatePlaylist(playlist) {
  const token = getStoredAdminToken();
  if (!token) throw new Error('Not authenticated');

  const { name, description, cover_image_url } = playlist;

  const response = await fetch(`${BASE_URL}/logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      category: 'music',
      title: name,
      content: description,
      cover_image_url,
      details: { songs: [] }
    })
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

  const { name, description, spotify_url, youtube_music_url, cover_image_url } = playlist;

  // We need to fetch existing details to preserve songs if we are just updating metadata
  // Or current `playlist` object from AdminPanel already contains all info? 
  // AdminPanel usually sends only fields to update.
  // We'll trust the PUT endpoint merges if we don't send details, OR we need to fetch first.
  // My backend PUT replaces details if sent. If not sent, it keeps old? 
  // Backend code: `const finalDetails = { ...details };` -> if details={}, it replaces details with {} + fields?
  // Backend: `const updatedContent = await LogContent.update(...)`
  // `LogContent.update`: `SET details = $2` -> REPLACES JSON.
  // So we MUST send full details or fetch-merge-put.

  // Fetch current log first
  const currentRes = await fetch(`${BASE_URL}/logs/music/${id}`);
  if (!currentRes.ok) throw new Error('Failed to fetch playlist for update');
  const current = await currentRes.json();

  const newDetails = {
    ...current, // spread current details (songs etc)
    spotify_url: spotify_url || current.spotify_url,
    youtube_music_url: youtube_music_url || current.youtube_music_url
  };

  const response = await fetch(`${BASE_URL}/logs/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      category: 'music',
      title: name,
      content: description,
      cover_image_url: cover_image_url || current.image,
      details: newDetails
    })
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

  const response = await fetch(`${BASE_URL}/logs/${id}`, {
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

  // Fetch current log
  const currentRes = await fetch(`${BASE_URL}/logs/music/${playlistId}`);
  if (!currentRes.ok) throw new Error('Failed to fetch playlist');
  const current = await currentRes.json();

  const songs = current.songs || [];
  songs.push({ ...song, id: Date.now().toString() }); // Auto-generate ID if needed

  const response = await fetch(`${BASE_URL}/logs/${playlistId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      category: 'music',
      title: current.title,
      // Pass other fields to avoid clearing them
      cover_image: current.image,
      content: current.content,
      details: { ...current, songs } // merge songs into details
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add song');
  }

  return response.json();
}

// Add multiple songs
export async function adminAddSongsBulk(playlistId, songsToAdd) {
  const token = getStoredAdminToken();
  if (!token) throw new Error('Not authenticated');

  const currentRes = await fetch(`${BASE_URL}/logs/music/${playlistId}`);
  if (!currentRes.ok) throw new Error('Failed to fetch playlist');
  const current = await currentRes.json();

  const songs = current.songs || [];
  const newSongs = songsToAdd.map(s => ({ ...s, id: Date.now().toString() + Math.random() }));
  const updatedSongs = [...songs, ...newSongs];

  const response = await fetch(`${BASE_URL}/logs/${playlistId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      category: 'music',
      title: current.title,
      cover_image: current.image,
      content: current.content,
      details: { ...current, songs: updatedSongs }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add songs');
  }

  return { count: newSongs.length };
}

// Delete song
export async function adminDeleteSong(playlistId, songId) {
  const token = getStoredAdminToken();
  if (!token) throw new Error('Not authenticated');

  const currentRes = await fetch(`${BASE_URL}/logs/music/${playlistId}`);
  if (!currentRes.ok) throw new Error('Failed to fetch playlist');
  const current = await currentRes.json();

  const songs = current.songs || [];
  const updatedSongs = songs.filter(s => s.id !== songId);

  const response = await fetch(`${BASE_URL}/logs/${playlistId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      category: 'music',
      title: current.title,
      cover_image: current.image,
      content: current.content,
      details: { ...current, songs: updatedSongs }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete song');
  }

  return response.json();
}

// Fetch playlists
export async function fetchPlaylists() {
  const response = await fetch(`${BASE_URL}/logs/music`);
  if (!response.ok) throw new Error('Failed to fetch playlists');
  const data = await response.json();
  // Map fields if necessary to match old Playlist component expectations?
  // Old: id, name, description. 
  // New: id, title, content
  // AdminPanel expects: id, name, description.
  return data.map(d => ({
    ...d,
    name: d.title,
    description: d.content
  }));
}
