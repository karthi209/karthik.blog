import pool from '../db.js';

export const Note = {
  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        edition VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add edition column if it doesn't exist (migration)
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'notes' AND column_name = 'edition'
        ) THEN
          ALTER TABLE notes ADD COLUMN edition VARCHAR(50);
        END IF;
      END $$;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
    `);
  },

  async create({ title, content = null, edition = null }) {
    const result = await pool.query(
      `INSERT INTO notes (title, content, edition)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, content, edition]
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

  async update(id, { title, content = null, edition = null }) {
    const result = await pool.query(
      `UPDATE notes
       SET title = $1, content = $2, edition = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [title, content, edition, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await pool.query('DELETE FROM notes WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};
