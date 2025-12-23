import pool from '../db.js';

export const Game = {
  // Initialize games table
  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        platform VARCHAR(100),
        genre VARCHAR(100),
        release_year INTEGER,
        cover_image_url TEXT,
        rating INTEGER CHECK (rating >= 1 AND rating <= 10),
        hours_played DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'completed',
        review TEXT,
        played_on DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_games_title ON games(title);
      CREATE INDEX IF NOT EXISTS idx_games_platform ON games(platform);
      CREATE INDEX IF NOT EXISTS idx_games_genre ON games(genre);
      CREATE INDEX IF NOT EXISTS idx_games_release_year ON games(release_year);
      CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
      CREATE INDEX IF NOT EXISTS idx_games_rating ON games(rating);
      CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
    `);
  },

  async create(gameData) {
    const { title, platform, genre, release_year, cover_image_url, rating, hours_played, status, review, played_on } = gameData;
    const result = await pool.query(
      `INSERT INTO games (title, platform, genre, release_year, cover_image_url, rating, hours_played, status, review, played_on) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [title, platform, genre, release_year, cover_image_url, rating, hours_played, status, review, played_on]
    );
    return result.rows[0];
  },

  async findAll() {
    const result = await pool.query('SELECT * FROM games ORDER BY created_at DESC');
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM games WHERE id = $1', [id]);
    return result.rows[0];
  },

  async update(id, gameData) {
    const { title, platform, genre, release_year, cover_image_url, rating, hours_played, status, review, played_on } = gameData;
    const result = await pool.query(
      `UPDATE games 
       SET title = $1, platform = $2, genre = $3, release_year = $4, 
           cover_image_url = $5, rating = $6, hours_played = $7, status = $8, 
           review = $9, played_on = $10, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $11 
       RETURNING *`,
      [title, platform, genre, release_year, cover_image_url, rating, hours_played, status, review, played_on, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await pool.query('DELETE FROM games WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};
