import pool from '../db.js';

export const Note = {
  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        tags TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN (tags);
    `);
  },

  async create({ title, content = null, tags = null }) {
    const result = await pool.query(
      `INSERT INTO notes (title, content, tags)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, content, tags]
    );
    return result.rows[0];
  },

  async findAll({ sortBy = 'created_at', order = 'DESC' } = {}) {
    const safeSort = sortBy === 'created_at' || sortBy === 'updated_at' ? sortBy : 'created_at';
    const safeOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const result = await pool.query(`SELECT * FROM notes ORDER BY ${safeSort} ${safeOrder}`);
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM notes WHERE id = $1', [id]);
    return result.rows[0];
  },

  async update(id, { title, content = null, tags = null }) {
    const result = await pool.query(
      `UPDATE notes
       SET title = $1, content = $2, tags = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [title, content, tags, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await pool.query('DELETE FROM notes WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};
