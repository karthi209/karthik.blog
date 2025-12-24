import pool from '../db.js';

export const LogContent = {
    // Initialize log_content table
    async init() {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS log_content (
        id SERIAL PRIMARY KEY,
        log_id INTEGER REFERENCES log_metadata(id) ON DELETE CASCADE,
        content TEXT, -- The main review/notes
        details JSONB, -- Specific fields like platform, director, author, etc.
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(log_id) -- One content entry per metadata entry
      )
    `);
    },

    async create(data) {
        const { log_id, content, details } = data;
        const result = await pool.query(
            `INSERT INTO log_content (log_id, content, details) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
            [log_id, content, details]
        );
        return result.rows[0];
    },

    async findByLogId(logId) {
        const result = await pool.query('SELECT * FROM log_content WHERE log_id = $1', [logId]);
        return result.rows[0];
    },

    async update(logId, data) {
        const { content, details } = data;
        // Upsert logic (update if exists, insert if not)
        const existing = await this.findByLogId(logId);

        if (existing) {
            const result = await pool.query(
                `UPDATE log_content 
         SET content = $1, details = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE log_id = $3 
         RETURNING *`,
                [content, details, logId]
            );
            return result.rows[0];
        } else {
            return this.create({ log_id: logId, content, details });
        }
    },

    async delete(logId) {
        const result = await pool.query('DELETE FROM log_content WHERE log_id = $1 RETURNING *', [logId]);
        return result.rows[0];
    }
};
