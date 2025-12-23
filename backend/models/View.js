import pool from '../db.js';
import crypto from 'crypto';

const HASH_SECRET = process.env.VIEW_HASH_SECRET || 'karthik-blog-view-secret-2024';

export const View = {
  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS views (
        id SERIAL PRIMARY KEY,
        path TEXT UNIQUE NOT NULL,
        count BIGINT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_views_path ON views(path);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS view_uniques (
        id SERIAL PRIMARY KEY,
        path TEXT NOT NULL,
        day DATE NOT NULL,
        fingerprint_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(path, day, fingerprint_hash)
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_view_uniques_path_day ON view_uniques(path, day);
    `);
  },

  createFingerprint(ip, userAgent) {
    const today = new Date().toISOString().split('T')[0];
    const data = `${ip}|${userAgent}|${today}`;
    return crypto.createHmac('sha256', HASH_SECRET).update(data).digest('hex').slice(0, 32);
  },

  async track(path, ip, userAgent) {
    const fingerprint = this.createFingerprint(ip || '', userAgent || '');
    const today = new Date().toISOString().split('T')[0];

    const uniqueResult = await pool.query(
      `INSERT INTO view_uniques (path, day, fingerprint_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (path, day, fingerprint_hash) DO NOTHING
       RETURNING id`,
      [path, today, fingerprint]
    );

    const isNewUnique = uniqueResult.rows.length > 0;

    if (isNewUnique) {
      await pool.query(
        `INSERT INTO views (path, count)
         VALUES ($1, 1)
         ON CONFLICT (path)
         DO UPDATE SET count = views.count + 1, updated_at = CURRENT_TIMESTAMP`,
        [path]
      );
    }

    const countResult = await pool.query(
      'SELECT count FROM views WHERE path = $1',
      [path]
    );

    return {
      path,
      count: countResult.rows[0]?.count || 0,
      isNewUnique
    };
  },

  async get(path) {
    const result = await pool.query(
      'SELECT path, count FROM views WHERE path = $1',
      [path]
    );

    return result.rows[0] || { path, count: 0 };
  },

  async getBatch(paths) {
    if (!Array.isArray(paths) || paths.length === 0) return [];

    const result = await pool.query(
      'SELECT path, count FROM views WHERE path = ANY($1::text[])',
      [paths]
    );

    const byPath = new Map(result.rows.map(r => [r.path, r.count]));
    return paths.map(p => ({ path: p, count: Number(byPath.get(p) || 0) }));
  }
};
