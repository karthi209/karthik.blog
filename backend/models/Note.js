import pool from '../db.js';

export const Note = {
  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
    `);
  },

  async create({ title, content = null }) {
    const result = await pool.query(
      `INSERT INTO notes (title, content)
       VALUES ($1, $2)
       RETURNING *`,
      [title, content]
    );
    return result.rows[0];
  },

  async findAll({ sortBy = 'created_at', order = 'DESC', limit, offset } = {}) {
    const safeSort = sortBy === 'created_at' || sortBy === 'updated_at' ? sortBy : 'created_at';
    const safeOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    let query = `SELECT * FROM notes ORDER BY ${safeSort} ${safeOrder}`;
    const params = [];
    
    if (limit) {
      query += ` LIMIT $1`;
      params.push(limit);
      if (offset) {
        query += ` OFFSET $2`;
        params.push(offset);
      }
    }
    
    const result = await pool.query(query, params);
    return result.rows;
  },

  async count() {
    const result = await pool.query('SELECT COUNT(*) as total FROM notes');
    return parseInt(result.rows[0].total, 10);
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM notes WHERE id = $1', [id]);
    return result.rows[0];
  },

  async update(id, { title, content = null }) {
    const result = await pool.query(
      `UPDATE notes
       SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [title, content, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await pool.query('DELETE FROM notes WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};
