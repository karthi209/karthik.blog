import { Router } from 'express';
import { Blog } from '../models/Blog.js';
import cache from '../cache.js';

const router = Router();
// Use shared cache instance

// Get all blogs with filtering and sorting
router.get('/', async (req, res) => {
  try {
    const { category, startDate, endDate, sortBy, order } = req.query;
    
    // Create cache key from query params
    const cacheKey = `blogs-${category || 'all'}-${startDate || ''}-${endDate || ''}-${sortBy || 'created_at'}-${order || 'desc'}`;
    const cachedBlogs = cache.get(cacheKey);
    if (cachedBlogs) {
      return res.json(cachedBlogs);
    }
    
    const filters = {};
    if (category) filters.category = category;
    if (sortBy) filters.sortBy = sortBy;
    if (order) filters.order = order;
    
    const blogs = await Blog.findAll(filters);
    
    // Apply date filters if needed (could be moved to model)
    let filteredBlogs = blogs;
    if (startDate) {
      filteredBlogs = filteredBlogs.filter(blog => new Date(blog.created_at) >= new Date(startDate));
    }
    if (endDate) {
      filteredBlogs = filteredBlogs.filter(blog => new Date(blog.created_at) <= new Date(endDate));
    }
    
    // Map id to _id for frontend compatibility
    const result = filteredBlogs.map(row => ({ ...row, _id: row.id }));
    
    // Cache the result
    cache.set(cacheKey, result);
    
    res.json(result);
  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all unique categories
router.get('/categories', async (req, res) => {
  try {
    const cachedCategories = cache.get('categories');
    if (cachedCategories) {
      return res.json(cachedCategories);
    }
    
    const categories = await Blog.getCategories();
    cache.set('categories', categories, 180); // 3 minutes
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get blogs by category
router.get('/category/:category', async (req, res) => {
  try {
    const blogs = await Blog.findAll({ category: req.params.category, sortBy: 'created_at', order: 'DESC' });
    const result = blogs.map(row => ({ ...row, _id: row.id }));
    res.json(result);
  } catch (err) {
    console.error('Error fetching blogs by category:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get blog archives (grouped by month and year)
router.get('/archives', async (req, res) => {
  try {
    const cachedArchives = cache.get('archives');
    if (cachedArchives) {
      return res.json(cachedArchives);
    }
    
    const archives = await Blog.getArchives();
    
    const result = archives.map(row => ({
      _id: {
        year: parseInt(row.year),
        month: parseInt(row.month)
      },
      count: parseInt(row.count)
    }));
    
    cache.set('archives', result, 180); // 3 minutes
    res.json(result);
  } catch (err) {
    console.error('Error fetching archives:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get single blog
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid blog ID format' });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.json({ ...blog, _id: blog.id });
  } catch (err) {
    console.error('Error fetching blog:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
