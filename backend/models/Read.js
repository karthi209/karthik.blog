import pool from '../db.js';

export const Read = {
  // Initialize reads table
  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reads (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255),
        year INTEGER,
        genre VARCHAR(100),
        cover_image_url TEXT,
        rating INTEGER CHECK (rating >= 1 AND rating <= 10),
        status VARCHAR(50) DEFAULT 'completed',
        review TEXT,
        read_on DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  },

  async create(readData) {
    const { title, author, year, genre, cover_image_url, rating, status, review, read_on } = readData;
    const result = await pool.query(
      `INSERT INTO reads (title, author, year, genre, cover_image_url, rating, status, review, read_on) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [title, author, year, genre, cover_image_url, rating, status, review, read_on]
    );
    return result.rows[0];
  },

  async findAll() {
    const result = await pool.query('SELECT * FROM reads ORDER BY created_at DESC');
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM reads WHERE id = $1', [id]);
    return result.rows[0];
  },

  async update(id, readData) {
    const { title, author, year, genre, cover_image_url, rating, status, review, read_on } = readData;
    const result = await pool.query(
      `UPDATE reads 
       SET title = $1, author = $2, year = $3, genre = $4, 
           cover_image_url = $5, rating = $6, status = $7, review = $8, 
           read_on = $9, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $10 
       RETURNING *`,
      [title, author, year, genre, cover_image_url, rating, status, review, read_on, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await pool.query('DELETE FROM reads WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};
