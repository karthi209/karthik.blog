import pool from '../db.js';

export const PlaylistSong = {
  // Initialize playlist_songs table
  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS playlist_songs (
        id SERIAL PRIMARY KEY,
        playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255),
        album VARCHAR(255),
        year INTEGER,
        preview_url TEXT,
        position INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist_id ON playlist_songs(playlist_id);
      CREATE INDEX IF NOT EXISTS idx_playlist_songs_position ON playlist_songs(playlist_id, position);
    `);
  },

  // Add song to playlist
  async create(songData) {
    const { playlist_id, title, artist, album, year, preview_url, position } = songData;
    const result = await pool.query(
      `INSERT INTO playlist_songs (playlist_id, title, artist, album, year, position) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [playlist_id, title, artist, album, year, preview_url, position]
    );
    return result.rows[0];
  },

  // Find all songs for a playlist
  async findByPlaylistId(playlistId) {
    const result = await pool.query(
      'SELECT * FROM playlist_songs WHERE playlist_id = $1 ORDER BY position',
      [playlistId]
    );
    return result.rows;
  },

  // Update song
  async update(id, songData) {
    const { title, artist, album, year, preview_url, position } = songData;
    const result = await pool.query(
      `UPDATE playlist_songs 
       SET title = $1, artist = $2, album = $3, year = $4, position = $5, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6 
       RETURNING *`,
      [title, artist, album, year, position, id]
    );
    return result.rows[0];
  },

  // Delete song
  async delete(id) {
    const result = await pool.query('DELETE FROM playlist_songs WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  },

  // Delete all songs from a playlist
  async deleteByPlaylistId(playlistId) {
    const result = await pool.query(
      'DELETE FROM playlist_songs WHERE playlist_id = $1 RETURNING *',
      [playlistId]
    );
    return result.rows;
  }
};
