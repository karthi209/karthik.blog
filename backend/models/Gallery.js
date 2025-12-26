import pool from '../db.js';

export const Gallery = {
  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gallery (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        caption TEXT,
        image_url VARCHAR(500) NOT NULL,
        image_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery(created_at DESC);
    `);
  },

  async create({ title = null, caption = null, image_url, image_path = null }) {
    const result = await pool.query(
      `INSERT INTO gallery (title, caption, image_url, image_path)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, caption, image_url, image_path]
    );
    return result.rows[0];
  },

  async findAll({ sortBy = 'created_at', order = 'DESC', limit, offset } = {}) {
    const safeSort = sortBy === 'created_at' || sortBy === 'updated_at' ? sortBy : 'created_at';
    const safeOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    let query = `SELECT * FROM gallery ORDER BY ${safeSort} ${safeOrder}`;
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
    const result = await pool.query('SELECT COUNT(*) as total FROM gallery');
    return parseInt(result.rows[0].total, 10);
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM gallery WHERE id = $1', [id]);
    return result.rows[0];
  },

  async update(id, { title = null, caption = null, image_url = null, image_path = null }) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== null) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (caption !== null) {
      updates.push(`caption = $${paramCount++}`);
      values.push(caption);
    }
    if (image_url !== null) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(image_url);
    }
    if (image_path !== null) {
      updates.push(`image_path = $${paramCount++}`);
      values.push(image_path);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const result = await pool.query(
      `UPDATE gallery
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await pool.query('DELETE FROM gallery WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};

