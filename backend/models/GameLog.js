import pool from '../db.js';

export const GameLog = {
  // Initialize game_logs table
  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_logs (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        hours_played DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'completed',
        review TEXT,
        played_on DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_game_logs_game_id ON game_logs(game_id);
      CREATE INDEX IF NOT EXISTS idx_game_logs_played_on ON game_logs(played_on DESC);
      CREATE INDEX IF NOT EXISTS idx_game_logs_status ON game_logs(status);
      CREATE INDEX IF NOT EXISTS idx_game_logs_rating ON game_logs(rating);
      CREATE INDEX IF NOT EXISTS idx_game_logs_created_at ON game_logs(created_at DESC);
    `);
  },

  async create(logData) {
    const { game_id, rating, hours_played, status, review, played_on } = logData;
    const result = await pool.query(
      `INSERT INTO game_logs (game_id, rating, hours_played, status, review, played_on) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [game_id, rating, hours_played, status, review, played_on]
    );
    return result.rows[0];
  },

  async findByGameId(gameId) {
    const result = await pool.query(
      'SELECT * FROM game_logs WHERE game_id = $1 ORDER BY played_on DESC',
      [gameId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM game_logs WHERE id = $1', [id]);
    return result.rows[0];
  },

  async update(id, logData) {
    const { rating, hours_played, status, review, played_on } = logData;
    const result = await pool.query(
      `UPDATE game_logs 
       SET rating = $1, hours_played = $2, status = $3, review = $4, 
           played_on = $5, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6 
       RETURNING *`,
      [rating, hours_played, status, review, played_on, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await pool.query('DELETE FROM game_logs WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
};
