import { Router } from 'express';
import cache from '../cache.js';
import { authenticateApiKey, requireUserJwt } from '../middleware/auth.js';
import { Note } from '../models/Note.js';
import { NoteLike } from '../models/NoteLike.js';
import { parsePagination, createPaginatedResponse } from '../utils/pagination.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { validateRequestBody, FIELD_LIMITS } from '../middleware/validation.js';
import { createResponse, updateResponse, deleteResponse, successResponse, errorResponse } from '../utils/response.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for likes
const likesLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many like requests, please try again later.'
});

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Get all notes with pagination
 *     tags: [Notes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list of notes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', asyncHandler(async (req, res) => {
  const { sortBy, order } = req.query;
  const { page, limit, offset } = parsePagination(req, 20, 100);
  
  const cacheKey = `notes-${sortBy || 'created_at'}-${order || 'desc'}-${page}-${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const [total, notes] = await Promise.all([
    Note.count(),
    Note.findAll({ sortBy, order, limit, offset })
  ]);
  
  const data = notes.map(row => ({ ...row, _id: row.id }));
  const result = createPaginatedResponse(data, total, page, limit);

  cache.set(cacheKey, result, 60);
  res.json(result);
}));

router.get('/admin/list', authenticateApiKey, asyncHandler(async (req, res) => {
  const notes = await Note.findAll({ sortBy: 'created_at', order: 'DESC' });
  const data = notes.map(n => ({ ...n, _id: n.id }));
  const { response } = successResponse(data);
  res.json(response);
}));

router.post('/admin/create', authenticateApiKey, validateRequestBody({
  title: { type: 'string', required: true, maxLength: FIELD_LIMITS.TITLE },
  content: { type: 'string', required: false, maxLength: FIELD_LIMITS.CONTENT },
  edition: { type: 'string', required: false, maxLength: 50 }
}), asyncHandler(async (req, res) => {
  const { title, content, edition } = req.body;
  const note = await Note.create({ title, content: content || null, edition: edition || null });
  cache.del('notes-created_at-desc-1-20'); // Invalidate cache instead of flushAll
  const { response, statusCode } = createResponse({ ...note, _id: note.id }, 'Note created successfully');
  res.status(statusCode).json(response);
}));

router.put('/admin/:id', authenticateApiKey, validateRequestBody({
  title: { type: 'string', required: true, maxLength: FIELD_LIMITS.TITLE },
  content: { type: 'string', required: false, maxLength: FIELD_LIMITS.CONTENT },
  edition: { type: 'string', required: false, maxLength: 50 }
}), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid note ID format' });

  const { title, content, edition } = req.body;
  const note = await Note.update(id, { title, content: content || null, edition: edition || null });
  if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

  cache.del('notes-created_at-desc-1-20'); // Invalidate cache
  const { response } = updateResponse({ ...note, _id: note.id }, 'Note updated successfully');
  res.json(response);
}));

router.delete('/admin/:id', authenticateApiKey, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid note ID format' });

  const note = await Note.delete(id);
  if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

  cache.del('notes-created_at-desc-1-20'); // Invalidate cache
  const { response } = deleteResponse('Note deleted successfully');
  res.json(response);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid note ID format' });

  const note = await Note.findById(id);
  if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

  const { response } = successResponse({ ...note, _id: note.id });
  res.json(response);
}));

// Likes: get count + whether current user liked (public count, optional auth)
router.get('/:id/likes', asyncHandler(async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    if (isNaN(noteId)) return res.status(400).json({ error: 'Invalid note ID' });

    const count = await NoteLike.count(noteId);

    // Best-effort decode if Authorization header is present
    let liked = false;
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      if (token && process.env.JWT_SECRET) {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        if (decoded?.email) {
          liked = await NoteLike.isLiked({ noteId, userEmail: String(decoded.email).toLowerCase() });
        }
      }
    } catch {
      liked = false;
    }

    res.json({ count, liked });
  } catch (err) {
    logger.error('Error fetching note likes', { error: err.message, noteId: req.params.id });
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
}));

// Likes: toggle (login required)
router.post('/:id/likes/toggle', likesLimiter, requireUserJwt, asyncHandler(async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    if (isNaN(noteId)) return res.status(400).json({ error: 'Invalid note ID' });

    const userEmail = String(req.user.email || '').toLowerCase();
    const result = await NoteLike.toggle({ noteId, userEmail });
    res.json({ liked: result.liked, count: result.count });
  } catch (err) {
    logger.error('Error toggling note like', { error: err.message, noteId: req.params.id });
    res.status(500).json({ error: 'Failed to toggle like' });
  }
}));

export default router;
