import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'portfolio_db',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

// Migration function to add missing columns and indexes for games functionality
const runMigrations = async () => {
  try {
    console.log('Running database migrations for games functionality...');

    // Check if games table exists
    const gamesTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'games'
      )
    `);

    if (!gamesTableExists.rows[0].exists) {
      console.log('Games table does not exist. Please run the server first to initialize tables.');
      return;
    }

    // Add missing columns to games table if they don't exist
    const gameColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'games' AND table_schema = 'public'
    `);

    const existingGameColumns = gameColumns.rows.map(row => row.column_name);

    const missingGameColumns = [
      { name: 'platform', type: 'VARCHAR(100)' },
      { name: 'genre', type: 'VARCHAR(100)' },
      { name: 'release_year', type: 'INTEGER' },
      { name: 'cover_image_url', type: 'TEXT' }
    ];

    for (const column of missingGameColumns) {
      if (!existingGameColumns.includes(column.name)) {
        await pool.query(`ALTER TABLE games ADD COLUMN ${column.name} ${column.type}`);
        console.log(`✓ Added ${column.name} column to games table`);
      }
    }

    // Add missing columns to game_logs table if they don't exist
    const gameLogColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'game_logs' AND table_schema = 'public'
    `);

    const existingGameLogColumns = gameLogColumns.rows.map(row => row.column_name);

    const missingGameLogColumns = [
      { name: 'hours_played', type: 'DECIMAL(10,2)' },
      { name: 'status', type: 'VARCHAR(50) DEFAULT \'completed\'' },
      { name: 'played_on', type: 'DATE DEFAULT CURRENT_DATE' }
    ];

    for (const column of missingGameLogColumns) {
      if (!existingGameLogColumns.includes(column.name)) {
        await pool.query(`ALTER TABLE game_logs ADD COLUMN ${column.name} ${column.type}`);
        console.log(`✓ Added ${column.name} column to game_logs table`);
      }
    }

    // Add indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_games_title ON games(title)',
      'CREATE INDEX IF NOT EXISTS idx_games_platform ON games(platform)',
      'CREATE INDEX IF NOT EXISTS idx_games_genre ON games(genre)',
      'CREATE INDEX IF NOT EXISTS idx_games_release_year ON games(release_year)',
      'CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_game_logs_status ON game_logs(status)',
      'CREATE INDEX IF NOT EXISTS idx_game_logs_rating ON game_logs(rating)',
      'CREATE INDEX IF NOT EXISTS idx_game_logs_created_at ON game_logs(created_at DESC)'
    ];

    for (const index of indexes) {
      await pool.query(index);
    }
    console.log('✓ Added performance indexes');

    console.log('🎮 Database migrations completed successfully!');
    console.log('Your games functionality is now ready to use.');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run migrations if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export { runMigrations };