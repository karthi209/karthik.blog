import pool from '../db.js';

export const Screen = {
  // Initialize screens table
  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS screens (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('movie', 'series')),
        year INTEGER,
        director VARCHAR(255),
        genre VARCHAR(100),
        cover_image_url TEXT,
        rating INTEGER CHECK (rating >= 1 AND rating <= 10),
        status VARCHAR(50) DEFAULT 'completed',
        review TEXT,
        watched_on DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  },

  async create(screenData) {
    const { title, type, year, director, genre, cover_image_url, rating, status, review, watched_on } = screenData;
    const result = await pool.query(
      `INSERT INTO screens (title, type, year, director, genre, cover_image_url, rating, status, review, watched_on) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [title, type, year, director, genre, cover_image_url, rating, status, review, watched_on]
    );
    return result.rows[0];
  },

  async findAll(type = null) {
    let query = 'SELECT * FROM screens';
    const params = [];
    
    if (type) {
      query += ' WHERE type = $1';
      params.push(type);
    }
    
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM screens WHERE id = $1', [id]);
    return result.rows[0];
  },

  async update(id, screenData) {
    const { title, type, year, director, genre, cover_image_url, rating, status, review, watched_on } = screenData;
    const result = await pool.query(
      `UPDATE screens 
       SET title = $1, type = $2, year = $3, director = $4, 
           genre = $5, cover_image_url = $6, rating = $7, status = $8, 
           review = $9, watched_on = $10, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $11 
       RETURNING *`,
      [title, type, year, director, genre, cover_image_url, rating, status, review, watched_on, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await pool.query('DELETE FROM screens WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};
