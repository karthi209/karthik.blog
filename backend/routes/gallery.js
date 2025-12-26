import { Router } from 'express';
import cache from '../cache.js';
import { authenticateApiKey } from '../middleware/auth.js';
import { Gallery } from '../models/Gallery.js';
import { parsePagination, createPaginatedResponse } from '../utils/pagination.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { validateRequestBody, FIELD_LIMITS } from '../middleware/validation.js';
import { createResponse, updateResponse, deleteResponse, successResponse, errorResponse } from '../utils/response.js';

const router = Router();

/**
 * @swagger
 * /gallery:
 *   get:
 *     summary: Get all gallery photos with pagination
 *     tags: [Gallery]
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
 *         description: Paginated list of gallery photos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', asyncHandler(async (req, res) => {
  const { sortBy, order } = req.query;
  const { page, limit, offset } = parsePagination(req, 20, 100);
  
  const cacheKey = `gallery-${sortBy || 'created_at'}-${order || 'desc'}-${page}-${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const [total, photos] = await Promise.all([
    Gallery.count(),
    Gallery.findAll({ sortBy, order, limit, offset })
  ]);
  
  const data = photos.map(row => ({ ...row, _id: row.id }));
  const result = createPaginatedResponse(data, total, page, limit);

  cache.set(cacheKey, result, 60);
  res.json(result);
}));

router.get('/admin/list', authenticateApiKey, asyncHandler(async (req, res) => {
  const photos = await Gallery.findAll({ sortBy: 'created_at', order: 'DESC' });
  const data = photos.map(p => ({ ...p, _id: p.id }));
  const { response } = successResponse(data);
  res.json(response);
}));

router.post('/admin/create', authenticateApiKey, validateRequestBody({
  title: { type: 'string', required: false, maxLength: FIELD_LIMITS.TITLE },
  caption: { type: 'string', required: false, maxLength: FIELD_LIMITS.CONTENT },
  image_url: { type: 'string', required: true }
}), asyncHandler(async (req, res) => {
  const { title, caption, image_url, image_path } = req.body;
  const photo = await Gallery.create({ 
    title: title || null, 
    caption: caption || null, 
    image_url,
    image_path: image_path || null
  });
  cache.del('gallery-created_at-desc-1-20'); // Invalidate cache
  const { response, statusCode } = createResponse({ ...photo, _id: photo.id }, 'Gallery photo created successfully');
  res.status(statusCode).json(response);
}));

router.put('/admin/:id', authenticateApiKey, validateRequestBody({
  title: { type: 'string', required: false, maxLength: FIELD_LIMITS.TITLE },
  caption: { type: 'string', required: false, maxLength: FIELD_LIMITS.CONTENT },
  image_url: { type: 'string', required: false }
}), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid gallery photo ID format' });

  const { title, caption, image_url, image_path } = req.body;
  const photo = await Gallery.update(id, { 
    title: title !== undefined ? (title || null) : undefined,
    caption: caption !== undefined ? (caption || null) : undefined,
    image_url: image_url || undefined,
    image_path: image_path || undefined
  });
  if (!photo) return res.status(404).json({ success: false, message: 'Gallery photo not found' });

  cache.del('gallery-created_at-desc-1-20'); // Invalidate cache
  const { response } = updateResponse({ ...photo, _id: photo.id }, 'Gallery photo updated successfully');
  res.json(response);
}));

router.delete('/admin/:id', authenticateApiKey, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid gallery photo ID format' });

  const photo = await Gallery.delete(id);
  if (!photo) return res.status(404).json({ success: false, message: 'Gallery photo not found' });

  cache.del('gallery-created_at-desc-1-20'); // Invalidate cache
  const { response } = deleteResponse('Gallery photo deleted successfully');
  res.json(response);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid gallery photo ID format' });

  const photo = await Gallery.findById(id);
  if (!photo) return res.status(404).json({ success: false, message: 'Gallery photo not found' });

  const { response } = successResponse({ ...photo, _id: photo.id });
  res.json(response);
}));

export default router;

