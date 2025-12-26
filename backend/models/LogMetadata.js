import pool from '../db.js';

export const LogMetadata = {
    // Initialize log_metadata table
    async init() {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS log_metadata (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL CHECK (category IN ('movies', 'tv', 'games', 'books', 'music')),
        title VARCHAR(255) NOT NULL,
        cover_image TEXT,
        rating INTEGER CHECK (rating >= 0 AND rating <= 10),
        status VARCHAR(50), -- 'completed', 'watching', 'reading', 'listening', 'dropped', 'plan_to_watch'
        favorite BOOLEAN DEFAULT FALSE,
        favorite BOOLEAN DEFAULT FALSE,
        logged_date DATE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Add indexes
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_log_metadata_category ON log_metadata(category);
      CREATE INDEX IF NOT EXISTS idx_log_metadata_date ON log_metadata(logged_date DESC);
      CREATE INDEX IF NOT EXISTS idx_log_metadata_rating ON log_metadata(rating);
    `);
    },

    async create(data) {
        const { category, title, cover_image, rating, status, favorite, logged_date, metadata, edition } = data;
        const result = await pool.query(
            `INSERT INTO log_metadata (category, title, cover_image, rating, status, favorite, logged_date, metadata, edition) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
            [category, title, cover_image, rating, status, favorite || false, logged_date, metadata || {}, edition || null]
        );
        return result.rows[0];
    },

    async findAll(category = null, limit = null) {
        let query = 'SELECT * FROM log_metadata';
        const params = [];

        if (category) {
            query += ' WHERE category = $1';
            params.push(category);
        }

        query += ' ORDER BY logged_date DESC, created_at DESC';

        if (limit) {
            query += ` LIMIT $${params.length + 1}`;
            params.push(limit);
        }

        const result = await pool.query(query, params);
        return result.rows;
    },

    async findById(id) {
        const result = await pool.query('SELECT * FROM log_metadata WHERE id = $1', [id]);
        return result.rows[0];
    },

    async update(id, data) {
        const { category, title, cover_image, rating, status, favorite, logged_date, metadata, edition } = data;
        const result = await pool.query(
            `UPDATE log_metadata 
       SET category = $1, title = $2, cover_image = $3, rating = $4, 
           status = $5, favorite = $6, logged_date = $7, metadata = $8, edition = $9, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $10 
       RETURNING *`,
            [category, title, cover_image, rating, status, favorite, logged_date, metadata || {}, edition || null, id]
        );
        return result.rows[0];
    },

    async delete(id) {
        const result = await pool.query('DELETE FROM log_metadata WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
};
