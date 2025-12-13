import { Router } from 'express';
import pool from '../db.js';
import fs from 'fs/promises';
import path from 'path';
import NodeCache from 'node-cache';

const router = Router();
const cache = new NodeCache({ stdTTL: 300 }); // Same cache instance as logs.js

// Create blog from markdown file upload
router.post('/from-file', async (req, res) => {
  try {
    const { title, category, tags, markdownContent } = req.body;
    
    if (!title || !category || !markdownContent) {
      return res.status(400).json({ 
        message: 'Title, category, and markdownContent are required' 
      });
    }

    // Convert tags to array format
    const tagsArray = tags && Array.isArray(tags) ? tags : 
                     tags && typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(t => t) :
                     null;

    const result = await pool.query(
      `INSERT INTO blogs (title, content, category, tags, date)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING *`,
      [title, markdownContent, category, tagsArray]
    );

    const blog = { ...result.rows[0], _id: result.rows[0].id };
    
    // Invalidate homepage cache
    cache.del('homepage-data');
    
    res.status(201).json(blog);
  } catch (error) {
    console.error('Error creating blog from file:', error);
    res.status(400).json({ message: error.message });
  }
});

// Create blog from direct content (simple API)
router.post('/create', async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ 
        message: 'Title, content, and category are required' 
      });
    }

    // Convert tags to array format
    const tagsArray = tags && Array.isArray(tags) ? tags : 
                     tags && typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(t => t) :
                     null;

    const result = await pool.query(
      `INSERT INTO blogs (title, content, category, tags, date)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING *`,
      [title, content, category, tagsArray]
    );

    const blog = { ...result.rows[0], _id: result.rows[0].id };
    
    // Invalidate homepage cache
    cache.del('homepage-data');
    
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
router.post('/bulk-create', async (req, res) => {
  try {
    const { blogs } = req.body; // Array of { title, content, category, tags }
    
    if (!Array.isArray(blogs) || blogs.length === 0) {
      return res.status(400).json({ message: 'blogs array is required' });
    }

    const results = [];
    for (const blog of blogs) {
      const { title, content, category, tags } = blog;
      
      if (!title || !content || !category) {
        continue; // Skip invalid entries
      }

      // Convert tags to array format
      const tagsArray = tags && Array.isArray(tags) ? tags : 
                       tags && typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(t => t) :
                       null;

      const result = await pool.query(
        `INSERT INTO blogs (title, content, category, tags, date)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         RETURNING *`,
        [title, content, category, tagsArray]
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

export default router;

