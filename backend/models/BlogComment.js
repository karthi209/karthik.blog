import pool from '../db.js';

export const BlogComment = {
  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_comments (
        id SERIAL PRIMARY KEY,
        blog_id INTEGER NOT NULL,
        user_email TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_comments_blog_id_created_at ON blog_comments(blog_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_blog_comments_user_email ON blog_comments(user_email);
    `);
  },

  async listByBlogId(blogId) {
    const res = await pool.query(
      `SELECT id, blog_id, user_email, content, created_at
       FROM blog_comments
       WHERE blog_id = $1
       ORDER BY created_at ASC`,
      [blogId]
    );
    return res.rows;
  },

  async create({ blogId, userEmail, content }) {
    const res = await pool.query(
      `INSERT INTO blog_comments (blog_id, user_email, content)
       VALUES ($1, $2, $3)
       RETURNING id, blog_id, user_email, content, created_at`,
      [blogId, userEmail, content]
    );
    return res.rows[0];
  },

  async delete({ id }) {
    const res = await pool.query(
      `DELETE FROM blog_comments WHERE id = $1 RETURNING id`,
      [id]
    );
    return res.rows[0] || null;
  }
};
