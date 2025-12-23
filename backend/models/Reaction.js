import pool from '../db.js';
import crypto from 'crypto';

const HASH_SECRET = process.env.REACTION_HASH_SECRET || process.env.VIEW_HASH_SECRET || 'karthik-blog-reaction-secret-2024';

export const Reaction = {
  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reactions (
        id SERIAL PRIMARY KEY,
        path TEXT NOT NULL,
        reaction TEXT NOT NULL,
        count BIGINT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(path, reaction)
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reactions_path ON reactions(path);
      CREATE INDEX IF NOT EXISTS idx_reactions_path_reaction ON reactions(path, reaction);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reaction_uniques (
        id SERIAL PRIMARY KEY,
        path TEXT NOT NULL,
        reaction TEXT NOT NULL,
        day DATE NOT NULL,
        fingerprint_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(path, reaction, day, fingerprint_hash)
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reaction_uniques_path_day ON reaction_uniques(path, day);
      CREATE INDEX IF NOT EXISTS idx_reaction_uniques_path_reaction_day ON reaction_uniques(path, reaction, day);
    `);
  },

  createFingerprint(ip, userAgent, day) {
    const safeDay = day || new Date().toISOString().split('T')[0];
    const data = `${ip || ''}|${userAgent || ''}|${safeDay}`;
    return crypto.createHmac('sha256', HASH_SECRET).update(data).digest('hex').slice(0, 32);
  },

  async react({ path, reaction, ip, userAgent }) {
    const day = new Date().toISOString().split('T')[0];
    const fingerprint = this.createFingerprint(ip, userAgent, day);

    const uniqueResult = await pool.query(
      `INSERT INTO reaction_uniques (path, reaction, day, fingerprint_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (path, reaction, day, fingerprint_hash) DO NOTHING
       RETURNING id`,
      [path, reaction, day, fingerprint]
    );

    const isNewUnique = uniqueResult.rows.length > 0;

    if (isNewUnique) {
      await pool.query(
        `INSERT INTO reactions (path, reaction, count)
         VALUES ($1, $2, 1)
         ON CONFLICT (path, reaction)
         DO UPDATE SET count = reactions.count + 1, updated_at = CURRENT_TIMESTAMP`,
        [path, reaction]
      );
    }

    const countRes = await pool.query(
      'SELECT count FROM reactions WHERE path = $1 AND reaction = $2',
      [path, reaction]
    );

    return {
      path,
      reaction,
      count: Number(countRes.rows[0]?.count || 0),
      isNewUnique
    };
  },

  async getForPath(path) {
    const result = await pool.query(
      'SELECT reaction, count FROM reactions WHERE path = $1 ORDER BY reaction ASC',
      [path]
    );

    return result.rows.map(r => ({ reaction: r.reaction, count: Number(r.count || 0) }));
  }
};
