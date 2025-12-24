
import pool from './db.js';

async function runMigration() {
    try {
        console.log('Checking log_metadata schema...');

        // Check if metadata column exists
        const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'log_metadata' AND column_name = 'metadata'
    `);

        if (res.rows.length === 0) {
            console.log('Adding metadata column to log_metadata...');
            await pool.query('ALTER TABLE log_metadata ADD COLUMN metadata JSONB DEFAULT \'{}\'');
            console.log('Column added successfully.');
        } else {
            console.log('metadata column already exists.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
