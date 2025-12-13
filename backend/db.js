import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'portfolio_db',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
  // Performance optimizations
  max: 20, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  acquireTimeoutMillis: 60000, // Return an error after 60 seconds if a client could not be acquired
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize database tables - now handled by models
export const initDatabase = async () => {
  try {
    // Import models
    const { Blog } = await import('./models/Blog.js');
    const { Playlist } = await import('./models/Playlist.js');
    const { PlaylistSong } = await import('./models/PlaylistSong.js');
    const { Game } = await import('./models/Game.js');
    const { GameLog } = await import('./models/GameLog.js');
    const { Screen } = await import('./models/Screen.js');
    const { ScreenLog } = await import('./models/ScreenLog.js');
    const { Read } = await import('./models/Read.js');
    const { ReadLog } = await import('./models/ReadLog.js');
    const { Travel } = await import('./models/Travel.js');
    const { TravelLog } = await import('./models/TravelLog.js');

    // Initialize all tables
    await Blog.init();
    await Playlist.init();
    await PlaylistSong.init();
    await Game.init();
    await GameLog.init();
    await Screen.init();
    await ScreenLog.init();
    await Read.init();
    await ReadLog.init();
    await Travel.init();
    await TravelLog.init();

    // Run migrations for any missing columns/indexes
    await runMigrations();

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Migration function to add missing columns and indexes
export const runMigrations = async () => {
  try {
    console.log('Running database migrations...');

    // Add missing columns to games table if they don't exist
    const gameColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'games' AND table_schema = 'public'
    `);

    const existingGameColumns = gameColumns.rows.map(row => row.column_name);

    if (!existingGameColumns.includes('platform')) {
      await pool.query(`ALTER TABLE games ADD COLUMN platform VARCHAR(100)`);
      console.log('Added platform column to games table');
    }

    if (!existingGameColumns.includes('genre')) {
      await pool.query(`ALTER TABLE games ADD COLUMN genre VARCHAR(100)`);
      console.log('Added genre column to games table');
    }

    if (!existingGameColumns.includes('release_year')) {
      await pool.query(`ALTER TABLE games ADD COLUMN release_year INTEGER`);
      console.log('Added release_year column to games table');
    }

    if (!existingGameColumns.includes('cover_image_url')) {
      await pool.query(`ALTER TABLE games ADD COLUMN cover_image_url TEXT`);
      console.log('Added cover_image_url column to games table');
    }

    // Add missing columns to game_logs table if they don't exist
    const gameLogColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'game_logs' AND table_schema = 'public'
    `);

    const existingGameLogColumns = gameLogColumns.rows.map(row => row.column_name);

    if (!existingGameLogColumns.includes('hours_played')) {
      await pool.query(`ALTER TABLE game_logs ADD COLUMN hours_played DECIMAL(10,2)`);
      console.log('Added hours_played column to game_logs table');
    }

    if (!existingGameLogColumns.includes('status')) {
      await pool.query(`ALTER TABLE game_logs ADD COLUMN status VARCHAR(50) DEFAULT 'completed'`);
      console.log('Added status column to game_logs table');
    }

    if (!existingGameLogColumns.includes('played_on')) {
      await pool.query(`ALTER TABLE game_logs ADD COLUMN played_on DATE DEFAULT CURRENT_DATE`);
      console.log('Added played_on column to game_logs table');
    }

    console.log('Database migrations completed');
  } catch (error) {
    console.error('Error running migrations:', error);
    // Don't throw error for migrations - they might fail if tables don't exist yet
  }
};

export default pool;

