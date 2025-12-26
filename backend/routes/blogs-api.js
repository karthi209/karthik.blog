import { Router } from 'express';
import pool from '../db.js';
import fs from 'fs/promises';
import path from 'path';
import cache from '../cache.js';
import { authenticateApiKey } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateRequestBody, FIELD_LIMITS } from '../middleware/validation.js';
import { createResponse, updateResponse, deleteResponse, successResponse } from '../utils/response.js';

const router = Router();
// Use shared cache instance

// Create blog from markdown file upload
router.post('/from-file', authenticateApiKey, validateRequestBody({
  title: { type: 'string', required: true, maxLength: FIELD_LIMITS.TITLE },
  category: { type: 'string', required: true, maxLength: FIELD_LIMITS.CATEGORY, enum: ['tech', 'life', 'music', 'games', 'movies', 'tv', 'books'] },
  markdownContent: { type: 'string', required: true, maxLength: FIELD_LIMITS.CONTENT }
}), asyncHandler(async (req, res) => {
  const { title, category, markdownContent } = req.body;

    const result = await pool.query(
      `INSERT INTO blogs (title, content, category)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, markdownContent, category]
    );

    const blog = { ...result.rows[0], _id: result.rows[0].id };

    // Invalidate specific blog-related caches (more efficient than flushAll)
    cache.del('homepage-data');
    cache.del('categories');
    cache.del('archives');

    const { response, statusCode } = createResponse(blog, 'Blog created successfully');
    res.status(statusCode).json(response);
}));

/**
 * @swagger
 * /blogs/create:
 *   post:
 *     summary: Create blog from direct content
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [tech, life, music, games, movies, tv, books]
 *     responses:
 *       201:
 *         description: Blog created successfully
 */
// Create blog from direct content (simple API)
router.post('/create', authenticateApiKey, validateRequestBody({
  title: { type: 'string', required: true, maxLength: FIELD_LIMITS.TITLE },
  content: { type: 'string', required: true, maxLength: FIELD_LIMITS.CONTENT },
  category: { type: 'string', required: true, maxLength: FIELD_LIMITS.CATEGORY }
}), asyncHandler(async (req, res) => {
    const { title, content, category } = req.body;

    const result = await pool.query(
      `INSERT INTO blogs (title, content, category)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, content, category]
    );

    const blog = { ...result.rows[0], _id: result.rows[0].id };

    // Invalidate specific blog-related caches
    cache.del('homepage-data');
    cache.del('categories');
    cache.del('archives');

    const { response, statusCode } = createResponse(blog, 'Blog created successfully');
    res.status(statusCode).json(response);
}));

// Bulk create blogs from multiple markdown files
router.post('/bulk-create', authenticateApiKey, validateRequestBody({
  blogs: { type: 'object', required: true } // Array validation handled in route
}), asyncHandler(async (req, res) => {
    const { blogs } = req.body; // Array of { title, content, category }

    if (!Array.isArray(blogs) || blogs.length === 0) {
      return res.status(400).json({ success: false, message: 'blogs array is required' });
    }

    const results = [];
    for (const blog of blogs) {
      const { title, content, category } = blog;

      if (!title || !content || !category) {
        continue; // Skip invalid entries
      }

      const result = await pool.query(
        `INSERT INTO blogs (title, content, category)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [title, content, category]
      );

      results.push({ ...result.rows[0], _id: result.rows[0].id });
    }

    // Invalidate homepage cache
    cache.del('homepage-data');

    const { response, statusCode } = createResponse(
      { blogs: results },
      `Created ${results.length} blog(s)`
    );
    res.status(statusCode).json(response);
}));

// Admin: Get all blogs including drafts
router.get('/admin/list', authenticateApiKey, asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT id, title, category, created_at, updated_at FROM blogs ORDER BY created_at DESC'
  );
  const blogs = result.rows.map(blog => ({ ...blog, _id: blog.id }));
  const { response } = successResponse(blogs);
  res.json(response);
}));

// Admin: Update blog
router.put('/admin/:id', authenticateApiKey, validateRequestBody({
  title: { type: 'string', required: true, maxLength: FIELD_LIMITS.TITLE },
  content: { type: 'string', required: true, maxLength: FIELD_LIMITS.CONTENT },
  category: { type: 'string', required: true, maxLength: FIELD_LIMITS.CATEGORY }
}), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, content, category } = req.body;

    const result = await pool.query(
      `UPDATE blogs 
       SET title = $1, content = $2, category = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4
       RETURNING *`,
      [title, content, category, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    cache.del('homepage-data');
    const blog = { ...result.rows[0], _id: result.rows[0].id };
    const { response } = updateResponse(blog, 'Blog updated successfully');
    res.json(response);
}));

// Admin: Delete blog
router.delete('/admin/:id', authenticateApiKey, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    'DELETE FROM blogs WHERE id = $1 RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Blog not found' });
  }

  cache.del('homepage-data');
  const { response } = deleteResponse('Blog deleted successfully');
  res.json(response);
}));

export default router;

