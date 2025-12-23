import { Router } from 'express';
import { Blog } from '../models/Blog.js';
import cache from '../cache.js';
import rateLimit from 'express-rate-limit';
import { requireUserJwt } from '../middleware/auth.js';
import { BlogComment } from '../models/BlogComment.js';
import { BlogLike } from '../models/BlogLike.js';

const router = Router();
// Use shared cache instance

const commentsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many comments, please slow down'
});

const likesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many likes, please slow down'
});

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

// Comments: list for a blog (public)
router.get('/:id/comments', async (req, res) => {
  try {
    const blogId = parseInt(req.params.id);
    if (isNaN(blogId)) return res.status(400).json({ error: 'Invalid blog ID' });

    const rows = await BlogComment.listByBlogId(blogId);
    res.json({ rows });
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Comments: create (login required)
router.post('/:id/comments', commentsLimiter, requireUserJwt, async (req, res) => {
  try {
    const blogId = parseInt(req.params.id);
    if (isNaN(blogId)) return res.status(400).json({ error: 'Invalid blog ID' });

    const content = String(req.body?.content || '').trim();
    if (!content) return res.status(400).json({ error: 'content is required' });
    if (content.length > 2000) return res.status(400).json({ error: 'comment too long' });

    const row = await BlogComment.create({
      blogId,
      userEmail: String(req.user.email || '').toLowerCase(),
      content
    });

    res.status(201).json({ row });
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Comments: delete (author or admin)
router.delete('/:id/comments/:commentId', requireUserJwt, async (req, res) => {
  try {
    const blogId = parseInt(req.params.id);
    const commentId = parseInt(req.params.commentId);
    if (isNaN(blogId) || isNaN(commentId)) return res.status(400).json({ error: 'Invalid id' });

    // Fetch comment to validate ownership
    const rows = await BlogComment.listByBlogId(blogId);
    const comment = rows.find(r => r.id === commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const requesterEmail = String(req.user.email || '').toLowerCase();
    const isAdmin = req.user.role === 'admin';
    const isOwner = requesterEmail && requesterEmail === String(comment.user_email || '').toLowerCase();
    if (!isAdmin && !isOwner) return res.status(403).json({ error: 'Forbidden' });

    await BlogComment.delete({ id: commentId });
    res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Likes: get count + whether current user liked (public count, optional auth)
router.get('/:id/likes', async (req, res) => {
  try {
    const blogId = parseInt(req.params.id);
    if (isNaN(blogId)) return res.status(400).json({ error: 'Invalid blog ID' });

    const count = await BlogLike.count(blogId);

    // Best-effort decode if Authorization header is present
    let liked = false;
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      if (token && process.env.JWT_SECRET) {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        if (decoded?.email) {
          liked = await BlogLike.isLiked({ blogId, userEmail: String(decoded.email).toLowerCase() });
        }
      }
    } catch {
      liked = false;
    }

    res.json({ count, liked });
  } catch (err) {
    console.error('Error fetching likes:', err);
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

// Likes: toggle (login required)
router.post('/:id/likes/toggle', likesLimiter, requireUserJwt, async (req, res) => {
  try {
    const blogId = parseInt(req.params.id);
    if (isNaN(blogId)) return res.status(400).json({ error: 'Invalid blog ID' });

    const userEmail = String(req.user.email || '').toLowerCase();
    const result = await BlogLike.toggle({ blogId, userEmail });
    res.json({ liked: result.liked, count: result.count });
  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

export default router;
