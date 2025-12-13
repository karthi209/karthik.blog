import express from 'express';
import { Playlist } from '../models/Playlist.js';
import { PlaylistSong } from '../models/PlaylistSong.js';
import { authenticateApiKey } from '../middleware/auth.js';

const router = express.Router();

// Get all playlists with songs (public)
router.get('/', async (req, res) => {
  try {
    const playlists = await Playlist.findAll();
    
    const playlistsWithSongs = await Promise.all(
      playlists.map(async (playlist) => {
        const songs = await PlaylistSong.findByPlaylistId(playlist.id);
        return { ...playlist, songs };
      })
    );

    res.json(playlistsWithSongs);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

// Get single playlist (public)
router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const songs = await PlaylistSong.findByPlaylistId(req.params.id);
    res.json({ ...playlist, songs });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

// Create playlist (admin)
router.post('/', authenticateApiKey, async (req, res) => {
  const { name, description, spotify_url, youtube_music_url } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Playlist name is required' });
  }

  try {
    const playlist = await Playlist.create({
      name: name.trim(),
      description: (description || '').trim(),
      spotify_url: spotify_url || null,
      youtube_music_url: youtube_music_url || null
    });
    res.status(201).json(playlist);
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// Update playlist (admin)
router.put('/:id', authenticateApiKey, async (req, res) => {
  try {
    const { name, description, spotify_url, youtube_music_url } = req.body;
    const playlist = await Playlist.update(req.params.id, {
      name,
      description,
      spotify_url: spotify_url || null,
      youtube_music_url: youtube_music_url || null
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json(playlist);
  } catch (error) {
    console.error('Error updating playlist:', error);
    res.status(500).json({ error: 'Failed to update playlist' });
  }
});

// Delete playlist (authenticated)
router.delete('/:id', authenticateApiKey, async (req, res) => {
  try {
    const playlist = await Playlist.delete(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json({ message: 'Playlist deleted' });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

// Add song to playlist (authenticated)
router.post('/:id/songs', authenticateApiKey, async (req, res) => {
  const { title, album, artist, year, preview_url } = req.body;
  
  if (!title || !title.trim() || !artist || !artist.trim()) {
    return res.status(400).json({ error: 'Song title and artist are required' });
  }

  try {
    // Get max position
    const existingSongs = await PlaylistSong.findByPlaylistId(req.params.id);
    const position = existingSongs.length > 0 
      ? Math.max(...existingSongs.map(s => s.position)) + 1 
      : 0;

    const song = await PlaylistSong.create({
      preview_url: preview_url || null,
      playlist_id: req.params.id,
      title: title.trim(),
      album: (album || '').trim(),
      artist: artist.trim(),
      year: year || null,
      position
    });
    res.status(201).json(song);
  } catch (error) {
    console.error('Error adding song:', error);
    res.status(500).json({ error: 'Failed to add song' });
  }
});

// Add multiple songs to playlist (authenticated)
router.post('/:id/songs/bulk', authenticateApiKey, async (req, res) => {
  const { songs } = req.body;
  
  if (!Array.isArray(songs) || songs.length === 0) {
    return res.status(400).json({ error: 'Songs array is required' });
  }

  try {
    // Get max position
    const existingSongs = await PlaylistSong.findByPlaylistId(req.params.id);
    let position = existingSongs.length > 0 
      ? Math.max(...existingSongs.map(s => s.position)) + 1 
      : 0;

    const insertedSongs = [];
    for (const song of songs) {
      const { title, album, artist, year } = song;
      if (!title || !title.trim() || !artist || !artist.trim()) {
        continue; // Skip invalid songs
      }
      
      const newSong = await PlaylistSong.create({
        playlist_id: req.params.id,
        title: title.trim(),
        album: (album || '').trim(),
        artist: artist.trim(),
        year: year || null,
        position
      });
      insertedSongs.push(newSong);
      position++;
    }

    res.status(201).json({ count: insertedSongs.length, songs: insertedSongs });
  } catch (error) {
    console.error('Error adding songs:', error);
    res.status(500).json({ error: 'Failed to add songs' });
  }
});

// Delete song (authenticated)
router.delete('/:playlistId/songs/:songId', authenticateApiKey, async (req, res) => {
  try {
    const song = await PlaylistSong.delete(req.params.songId);

    if (!song || song.playlist_id !== parseInt(req.params.playlistId)) {
      return res.status(404).json({ error: 'Song not found' });
    }

    res.json({ message: 'Song deleted' });
  } catch (error) {
    console.error('Error deleting song:', error);
    res.status(500).json({ error: 'Failed to delete song' });
  }
});

export default router;
