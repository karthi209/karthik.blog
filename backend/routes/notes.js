import { Router } from 'express';
import cache from '../cache.js';
import { authenticateApiKey } from '../middleware/auth.js';
import { Note } from '../models/Note.js';
import { parsePagination, createPaginatedResponse } from '../utils/pagination.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { validateRequestBody, FIELD_LIMITS } from '../middleware/validation.js';
import { createResponse, updateResponse, deleteResponse, successResponse, errorResponse } from '../utils/response.js';

const router = Router();

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
  content: { type: 'string', required: false, maxLength: FIELD_LIMITS.CONTENT }
}), asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const note = await Note.create({ title, content: content || null });
  cache.del('notes-created_at-desc-1-20'); // Invalidate cache instead of flushAll
  const { response, statusCode } = createResponse({ ...note, _id: note.id }, 'Note created successfully');
  res.status(statusCode).json(response);
}));

router.put('/admin/:id', authenticateApiKey, validateRequestBody({
  title: { type: 'string', required: true, maxLength: FIELD_LIMITS.TITLE },
  content: { type: 'string', required: false, maxLength: FIELD_LIMITS.CONTENT }
}), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid note ID format' });

  const { title, content } = req.body;
  const note = await Note.update(id, { title, content: content || null });
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

export default router;
