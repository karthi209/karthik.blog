import pool from '../db.js';

export const Blog = {
  // Initialize blogs table
  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        tags TEXT[],
        is_draft BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);
      CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_blogs_category_created_at ON blogs(category, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_blogs_tags ON blogs USING GIN (tags);
      CREATE INDEX IF NOT EXISTS idx_blogs_is_draft ON blogs(is_draft);
    `);
  },

  // Create a new blog
  async create(blogData) {
    const { title, content, category, tags = [], is_draft = false } = blogData;
    const result = await pool.query(
      `INSERT INTO blogs (title, content, category, tags, is_draft) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [title, content, category, tags, is_draft]
    );
    return result.rows[0];
  },

  // Find all blogs with optional filters
  async findAll(filters = {}) {
    let query = 'SELECT * FROM blogs WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.category) {
      query += ` AND category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.is_draft !== undefined) {
      query += ` AND is_draft = $${paramCount}`;
      params.push(filters.is_draft);
      paramCount++;
    }

    if (filters.tags && filters.tags.length > 0) {
      query += ` AND tags && $${paramCount}`;
      params.push(filters.tags);
      paramCount++;
    }

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const order = filters.order || 'DESC';
    query += ` ORDER BY ${sortBy} ${order}`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Find blog by ID
  async findById(id) {
    const result = await pool.query('SELECT * FROM blogs WHERE id = $1', [id]);
    return result.rows[0];
  },

  // Update blog
  async update(id, blogData) {
    const { title, content, category, tags, is_draft } = blogData;
    const result = await pool.query(
      `UPDATE blogs 
       SET title = $1, content = $2, category = $3, tags = $4, is_draft = $5,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6 
       RETURNING *`,
      [title, content, category, tags, is_draft, id]
    );
    return result.rows[0];
  },  // Delete blog
  async delete(id) {
    const result = await pool.query('DELETE FROM blogs WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  },

  // Get all categories
  async getCategories() {
    const result = await pool.query('SELECT DISTINCT category FROM blogs ORDER BY category');
    return result.rows.map(row => row.category);
  },

  // Get blog archives (grouped by year/month)
  async getArchives() {
    const result = await pool.query(`
      SELECT 
        EXTRACT(YEAR FROM created_at) as year,
        EXTRACT(MONTH FROM created_at) as month,
        COUNT(*) as count
      FROM blogs
      WHERE is_draft = false
      GROUP BY year, month
      ORDER BY year DESC, month DESC
    `);
    return result.rows;
  }
};
