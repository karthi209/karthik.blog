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

// Migration function to consolidate blog date columns
const runMigrations = async () => {
  try {
    console.log('Running database migrations...');

    // Consolidate blog date columns
    console.log('Consolidating blog timestamp columns...');
    
    // Check if blogs table exists
    const blogsTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'blogs'
      )
    `);

    if (blogsTableExists.rows[0].exists) {
      // Get existing columns
      const blogColumns = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'blogs' AND table_schema = 'public'
      `);
      
      const existingColumns = blogColumns.rows.map(row => row.column_name);
      
      // Migrate data from 'date' and 'published_at' to 'created_at' if needed
      if (existingColumns.includes('date')) {
        // Copy 'date' values to 'created_at' where created_at is null or older
        await pool.query(`
          UPDATE blogs 
          SET created_at = date 
          WHERE created_at IS NULL OR created_at > date
        `);
        console.log('Migrated date column to created_at');
        
        // Drop the 'date' column
        await pool.query(`ALTER TABLE blogs DROP COLUMN IF EXISTS date`);
        console.log('Dropped redundant date column');
      }
      
      // Drop published_at column as it's redundant with created_at
      if (existingColumns.includes('published_at')) {
        await pool.query(`ALTER TABLE blogs DROP COLUMN IF EXISTS published_at`);
        console.log('Dropped redundant published_at column');
      }
      
      // Ensure created_at and updated_at exist with proper defaults
      if (!existingColumns.includes('created_at')) {
        await pool.query(`
          ALTER TABLE blogs 
          ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('Added created_at column');
      }
      
      if (!existingColumns.includes('updated_at')) {
        await pool.query(`
          ALTER TABLE blogs 
          ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('Added updated_at column');
      }
      
      // Update indexes - remove old date index, add created_at index
      await pool.query(`DROP INDEX IF EXISTS idx_blogs_date`);
      await pool.query(`DROP INDEX IF EXISTS idx_blogs_category_date`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_blogs_category_created_at ON blogs(category, created_at DESC)`);
      console.log('Updated indexes for created_at');
    }

    console.log('Database migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
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