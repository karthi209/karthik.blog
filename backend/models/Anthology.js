import pool from '../db.js';

export const Anthology = {
    // Initialize anthologies table
    async init() {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS anthologies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        slug VARCHAR(255) UNIQUE NOT NULL,
        blogs INTEGER[] DEFAULT '{}',
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_anthologies_slug ON anthologies(slug);
      CREATE INDEX IF NOT EXISTS idx_anthologies_created_at ON anthologies(created_at DESC);
    `);
    },

    // Create a new anthology
    async create(data) {
        const { title, description, slug, blogs = [], is_public = true } = data;
        const result = await pool.query(
            `INSERT INTO anthologies (title, description, slug, blogs, is_public) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
            [title, description, slug, blogs, is_public]
        );
        return result.rows[0];
    },

    // Find all anthologies
    async findAll(filters = {}) {
        let query = 'SELECT * FROM anthologies WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (filters.is_public !== undefined) {
            query += ` AND is_public = $${paramCount}`;
            params.push(filters.is_public);
            paramCount++;
        }

        const sortBy = filters.sortBy || 'created_at';
        const order = filters.order || 'DESC';
        query += ` ORDER BY ${sortBy} ${order}`;

        const result = await pool.query(query, params);
        return result.rows;
    },

    // Find anthology by slug
    async findBySlug(slug) {
        const result = await pool.query('SELECT * FROM anthologies WHERE slug = $1', [slug]);
        return result.rows[0];
    },

    // Find anthology by ID
    async findById(id) {
        const result = await pool.query('SELECT * FROM anthologies WHERE id = $1', [id]);
        return result.rows[0];
    },

    // Update anthology
    async update(id, data) {
        const { title, description, slug, blogs, is_public } = data;
        const result = await pool.query(
            `UPDATE anthologies 
       SET title = $1, description = $2, slug = $3, blogs = $4, is_public = $5,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6 
       RETURNING *`,
            [title, description, slug, blogs, is_public, id]
        );
        return result.rows[0];
    },

    // Delete anthology
    async delete(id) {
        const result = await pool.query('DELETE FROM anthologies WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    },

    // Get blogs for an anthology
    // Note: This fetches the full blog objects in the order specified in the anthology
    async getAnthologyBlogs(anthologyId) {
        // First get the anthology to get the blog IDs order
        const anthology = await this.findById(anthologyId);
        if (!anthology || !anthology.blogs || anthology.blogs.length === 0) {
            return [];
        }

        // Fetch blogs that match the IDs
        const result = await pool.query(
            'SELECT * FROM blogs WHERE id = ANY($1)',
            [anthology.blogs]
        );

        // Sort the results in the order of the IDs in validBlogs
        const blogsMap = new Map(result.rows.map(b => [b.id, b]));
        return anthology.blogs
            .map(id => blogsMap.get(id))
            .filter(blog => blog); // remove any that might have been deleted (undefined)
    }
};
