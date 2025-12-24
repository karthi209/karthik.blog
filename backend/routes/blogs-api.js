import { Router } from 'express';
import pool from '../db.js';
import fs from 'fs/promises';
import path from 'path';
import cache from '../cache.js';
import { authenticateApiKey } from '../middleware/auth.js';

const router = Router();
// Use shared cache instance

// Create blog from markdown file upload
router.post('/from-file', authenticateApiKey, async (req, res) => {
  try {
    const { title, category, markdownContent } = req.body;

    if (!title || !category || !markdownContent) {
      return res.status(400).json({
        message: 'Title, category, and markdownContent are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO blogs (title, content, category)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, markdownContent, category]
    );

    const blog = { ...result.rows[0], _id: result.rows[0].id };

    // Invalidate all blog-related caches
    cache.del('homepage-data');
    cache.del('categories');
    cache.del('archives');
    cache.flushAll(); // Safety: clear all list caches

    res.status(201).json(blog);
  } catch (error) {
    console.error('Error creating blog from file:', error);
    res.status(400).json({ message: error.message });
  }
});

// Create blog from direct content (simple API)
router.post('/create', authenticateApiKey, async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({
        message: 'Title, content, and category are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO blogs (title, content, category)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, content, category]
    );

    const blog = { ...result.rows[0], _id: result.rows[0].id };

    // Invalidate all blog-related caches
    cache.del('homepage-data');
    cache.del('categories');
    cache.del('archives');
    cache.flushAll(); // Safety: clear all cached blog lists

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      blog
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(400).json({ message: error.message });
  }
});

// Bulk create blogs from multiple markdown files
router.post('/bulk-create', authenticateApiKey, async (req, res) => {
  try {
    const { blogs } = req.body; // Array of { title, content, category }

    if (!Array.isArray(blogs) || blogs.length === 0) {
      return res.status(400).json({ message: 'blogs array is required' });
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

    res.status(201).json({
      success: true,
      message: `Created ${results.length} blog(s)`,
      blogs: results
    });
  } catch (error) {
    console.error('Error bulk creating blogs:', error);
    res.status(400).json({ message: error.message });
  }
});

// Admin: Get all blogs including drafts
router.get('/admin/list', authenticateApiKey, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, category, created_at, updated_at FROM blogs ORDER BY created_at DESC'
    );
    const blogs = result.rows.map(blog => ({ ...blog, _id: blog.id }));
    res.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update blog
router.put('/admin/:id', authenticateApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({
        message: 'Title, content, and category are required'
      });
    }

    const result = await pool.query(
      `UPDATE blogs 
       SET title = $1, content = $2, category = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4
       RETURNING *`,
      [title, content, category, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    cache.del('homepage-data');
    const blog = { ...result.rows[0], _id: result.rows[0].id };
    res.json({ success: true, message: 'Blog updated successfully', blog });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(400).json({ message: error.message });
  }
});

// Admin: Delete blog
router.delete('/admin/:id', authenticateApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM blogs WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    cache.del('homepage-data');
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

