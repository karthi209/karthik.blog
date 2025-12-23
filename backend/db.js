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
    const { Screen } = await import('./models/Screen.js');
    const { Read } = await import('./models/Read.js');
    const { Note } = await import('./models/Note.js');
    const { View } = await import('./models/View.js');
    const { Reaction } = await import('./models/Reaction.js');
    const { BlogComment } = await import('./models/BlogComment.js');
    const { BlogLike } = await import('./models/BlogLike.js');

    // Initialize all tables
    await Blog.init();
    await Playlist.init();
    await PlaylistSong.init();
    await Game.init();
    await Screen.init();
    await Read.init();
    await Note.init();
    await View.init();
    await Reaction.init();
    await BlogComment.init();
    await BlogLike.init();

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

    // Update rating constraints from 1-5 to 1-10 across library tables
    await pool.query(`
      DO $$
      DECLARE c RECORD;
      BEGIN
        IF to_regclass('public.games') IS NOT NULL THEN
          FOR c IN
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = 'public.games'::regclass
              AND contype = 'c'
              AND pg_get_constraintdef(oid) ILIKE '%rating%'
          LOOP
            EXECUTE format('ALTER TABLE public.games DROP CONSTRAINT IF EXISTS %I', c.conname);
          END LOOP;

          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'games_rating_check_10') THEN
            EXECUTE 'ALTER TABLE public.games ADD CONSTRAINT games_rating_check_10 CHECK (rating >= 1 AND rating <= 10)';
          END IF;
        END IF;

        IF to_regclass('public.screens') IS NOT NULL THEN
          FOR c IN
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = 'public.screens'::regclass
              AND contype = 'c'
              AND pg_get_constraintdef(oid) ILIKE '%rating%'
          LOOP
            EXECUTE format('ALTER TABLE public.screens DROP CONSTRAINT IF EXISTS %I', c.conname);
          END LOOP;

          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'screens_rating_check_10') THEN
            EXECUTE 'ALTER TABLE public.screens ADD CONSTRAINT screens_rating_check_10 CHECK (rating >= 1 AND rating <= 10)';
          END IF;
        END IF;

        IF to_regclass('public.reads') IS NOT NULL THEN
          FOR c IN
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = 'public.reads'::regclass
              AND contype = 'c'
              AND pg_get_constraintdef(oid) ILIKE '%rating%'
          LOOP
            EXECUTE format('ALTER TABLE public.reads DROP CONSTRAINT IF EXISTS %I', c.conname);
          END LOOP;

          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reads_rating_check_10') THEN
            EXECUTE 'ALTER TABLE public.reads ADD CONSTRAINT reads_rating_check_10 CHECK (rating >= 1 AND rating <= 10)';
          END IF;
        END IF;
      END $$;
    `);

    console.log('Database migrations completed');
  } catch (error) {
    console.error('Error running migrations:', error);
    // Don't throw error for migrations - they might fail if tables don't exist yet
  }
};

export default pool;

