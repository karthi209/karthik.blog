import pool from '../db.js';

export const BlogLike = {
  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_likes (
        id SERIAL PRIMARY KEY,
        blog_id INTEGER NOT NULL,
        user_email TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(blog_id, user_email)
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_likes_blog_id ON blog_likes(blog_id);
    `);
  },

  async count(blogId) {
    const res = await pool.query(
      'SELECT COUNT(*)::int AS count FROM blog_likes WHERE blog_id = $1',
      [blogId]
    );
    return res.rows[0]?.count || 0;
  },

  async isLiked({ blogId, userEmail }) {
    const res = await pool.query(
      'SELECT 1 FROM blog_likes WHERE blog_id = $1 AND user_email = $2 LIMIT 1',
      [blogId, userEmail]
    );
    return res.rows.length > 0;
  },

  async toggle({ blogId, userEmail }) {
    // If exists -> delete, else insert
    const existing = await pool.query(
      'SELECT id FROM blog_likes WHERE blog_id = $1 AND user_email = $2 LIMIT 1',
      [blogId, userEmail]
    );

    let liked;
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM blog_likes WHERE id = $1', [existing.rows[0].id]);
      liked = false;
    } else {
      await pool.query(
        'INSERT INTO blog_likes (blog_id, user_email) VALUES ($1, $2) ON CONFLICT (blog_id, user_email) DO NOTHING',
        [blogId, userEmail]
      );
      liked = true;
    }

    const count = await this.count(blogId);
    return { blogId, liked, count };
  }
};
