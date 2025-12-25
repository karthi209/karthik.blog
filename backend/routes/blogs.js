import { Router } from 'express';
import { Blog } from '../models/Blog.js';
import cache from '../cache.js';
import rateLimit from 'express-rate-limit';
import { requireUserJwt } from '../middleware/auth.js';
import { BlogComment } from '../models/BlogComment.js';
import { BlogLike } from '../models/BlogLike.js';
import { parsePagination, createPaginatedResponse } from '../utils/pagination.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { successResponse } from '../utils/response.js';

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

/**
 * @swagger
 * /blogs:
 *   get:
 *     summary: Get all blogs with filtering, sorting, and pagination
 *     tags: [Blogs]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated list of blogs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', asyncHandler(async (req, res) => {
  const { category, startDate, endDate, sortBy, order } = req.query;
  const { page, limit, offset } = parsePagination(req, 20, 100);
  
  // Create cache key from query params
  const cacheKey = `blogs-${category || 'all'}-${startDate || ''}-${endDate || ''}-${sortBy || 'created_at'}-${order || 'desc'}-${page}-${limit}`;
  const cachedBlogs = cache.get(cacheKey);
  if (cachedBlogs) {
    return res.json(cachedBlogs);
  }
  
  const filters = { limit, offset };
  if (category) filters.category = category;
  if (sortBy) filters.sortBy = sortBy;
  if (order) filters.order = order;
  
  // Get total count and blogs in parallel
  const [total, blogs] = await Promise.all([
    Blog.count(filters),
    Blog.findAll(filters)
  ]);
  
  // Apply date filters if needed (could be moved to model)
  let filteredBlogs = blogs;
  if (startDate) {
    filteredBlogs = filteredBlogs.filter(blog => new Date(blog.created_at) >= new Date(startDate));
  }
  if (endDate) {
    filteredBlogs = filteredBlogs.filter(blog => new Date(blog.created_at) <= new Date(endDate));
  }
  
  // Map id to _id for frontend compatibility
  const data = filteredBlogs.map(row => ({ ...row, _id: row.id }));
  
  // Create paginated response
  const result = createPaginatedResponse(data, total, page, limit);
  
  // Cache the result (shorter TTL for paginated results)
  cache.set(cacheKey, result, 60);
  
  res.json(result);
}));

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
    logger.error('Error fetching categories', { error: err.message });
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
    logger.error('Error fetching blogs by category', { error: err.message, category: req.params.category });
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
    logger.error('Error fetching archives', { error: err.message });
    res.status(500).json({ message: err.message });
  }
});

// Get single blog
router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid blog ID format' });
  }

  const blog = await Blog.findById(id);

  if (!blog) {
    return res.status(404).json({ success: false, message: 'Blog post not found' });
  }

  const { response } = successResponse({ ...blog, _id: blog.id });
  res.json(response);
}));

// Comments: list for a blog (public)
router.get('/:id/comments', async (req, res) => {
  try {
    const blogId = parseInt(req.params.id);
    if (isNaN(blogId)) return res.status(400).json({ error: 'Invalid blog ID' });

    const rows = await BlogComment.listByBlogId(blogId);
    res.json({ rows });
  } catch (err) {
    logger.error('Error fetching comments', { error: err.message, blogId: req.params.id });
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
    logger.error('Error creating comment', { error: err.message, blogId: req.params.id });
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
    logger.error('Error deleting comment', { error: err.message, commentId: req.params.commentId });
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
    logger.error('Error fetching likes', { error: err.message, blogId: req.params.id });
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
    logger.error('Error toggling like', { error: err.message, blogId: req.params.id });
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

export default router;
