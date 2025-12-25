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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);
      CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_blogs_category_created_at ON blogs(category, created_at DESC);
    `);
  },

  // Create a new blog
  async create(blogData) {
    const { title, content, category } = blogData;
    const result = await pool.query(
      `INSERT INTO blogs (title, content, category) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [title, content, category]
    );
    return result.rows[0];
  },

  // Find all blogs with optional filters and pagination
  async findAll(filters = {}) {
    let query = 'SELECT * FROM blogs WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.category) {
      query += ` AND category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    // Sorting - whitelist approach to prevent SQL injection
    const allowedSortFields = ['created_at', 'updated_at', 'title', 'category'];
    const sortBy = allowedSortFields.includes(filters.sortBy) ? filters.sortBy : 'created_at';
    const order = String(filters.order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortBy} ${order}`;

    // Pagination
    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
      paramCount++;
    }
    if (filters.offset) {
      query += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
    }

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Count blogs with optional filters
  async count(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM blogs WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.category) {
      query += ` AND category = $${paramCount}`;
      params.push(filters.category);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].total, 10);
  },

  // Find blog by ID
  async findById(id) {
    const result = await pool.query('SELECT * FROM blogs WHERE id = $1', [id]);
    return result.rows[0];
  },

  // Update blog
  async update(id, blogData) {
    const { title, content, category } = blogData;
    const result = await pool.query(
      `UPDATE blogs 
       SET title = $1, content = $2, category = $3,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING *`,
      [title, content, category, id]
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
      GROUP BY year, month
      ORDER BY year DESC, month DESC
    `);
    return result.rows;
  }
};
