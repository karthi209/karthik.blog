import pool from '../db.js';

export const NoteLike = {
  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS note_likes (
        id SERIAL PRIMARY KEY,
        note_id INTEGER NOT NULL,
        user_email TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(note_id, user_email)
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_note_likes_note_id ON note_likes(note_id);
    `);
  },

  async count(noteId) {
    const res = await pool.query(
      'SELECT COUNT(*)::int AS count FROM note_likes WHERE note_id = $1',
      [noteId]
    );
    return res.rows[0]?.count || 0;
  },

  async isLiked({ noteId, userEmail }) {
    const res = await pool.query(
      'SELECT 1 FROM note_likes WHERE note_id = $1 AND user_email = $2 LIMIT 1',
      [noteId, userEmail]
    );
    return res.rows.length > 0;
  },

  async toggle({ noteId, userEmail }) {
    // If exists -> delete, else insert
    const existing = await pool.query(
      'SELECT id FROM note_likes WHERE note_id = $1 AND user_email = $2 LIMIT 1',
      [noteId, userEmail]
    );

    let liked;
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM note_likes WHERE id = $1', [existing.rows[0].id]);
      liked = false;
    } else {
      await pool.query(
        'INSERT INTO note_likes (note_id, user_email) VALUES ($1, $2) ON CONFLICT (note_id, user_email) DO NOTHING',
        [noteId, userEmail]
      );
      liked = true;
    }

    const count = await this.count(noteId);
    return { noteId, liked, count };
  }
};

