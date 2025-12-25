import { Router } from 'express';
import pool from '../db.js';
import { requireAdminJwt } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateRequestBody, FIELD_LIMITS, validateUrl } from '../middleware/validation.js';
import { createResponse, updateResponse, deleteResponse, successResponse } from '../utils/response.js';

const router = Router();

// GET all projects (public)
router.get('/', asyncHandler(async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM projects ORDER BY created_at DESC'
    );
    const { response } = successResponse(result.rows);
    res.json(response);
}));

// GET single project by ID (public)
router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);

    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const { response } = successResponse(result.rows[0]);
    res.json(response);
}));

// CREATE new project (admin only)
router.post('/', requireAdminJwt, validateRequestBody({
    title: { type: 'string', required: true, maxLength: FIELD_LIMITS.TITLE },
    description: { type: 'string', required: false, maxLength: FIELD_LIMITS.DESCRIPTION },
    tech: { type: 'string', required: false, maxLength: 500 },
    url: { type: 'string', required: false, maxLength: FIELD_LIMITS.URL },
    github_url: { type: 'string', required: false, maxLength: FIELD_LIMITS.URL },
    status: { type: 'string', required: false, enum: ['completed', 'in-progress', 'archived'] }
}), asyncHandler(async (req, res) => {
    const { title, description, tech, url, github_url, status } = req.body;
    
    // Validate URLs if provided
    if (url && !validateUrl(url)) {
        return res.status(400).json({ success: false, message: 'Invalid URL format' });
    }
    if (github_url && !validateUrl(github_url)) {
        return res.status(400).json({ success: false, message: 'Invalid GitHub URL format' });
    }

    const result = await pool.query(
        `INSERT INTO projects (title, description, tech, url, github_url, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
        [title, description, tech, url, github_url, status || 'completed']
    );

    const { response, statusCode } = createResponse(result.rows[0], 'Project created successfully');
    res.status(statusCode).json(response);
}));

// UPDATE project (admin only)
router.put('/:id', requireAdminJwt, validateRequestBody({
    title: { type: 'string', required: true, maxLength: FIELD_LIMITS.TITLE },
    description: { type: 'string', required: false, maxLength: FIELD_LIMITS.DESCRIPTION },
    tech: { type: 'string', required: false, maxLength: 500 },
    url: { type: 'string', required: false, maxLength: FIELD_LIMITS.URL },
    github_url: { type: 'string', required: false, maxLength: FIELD_LIMITS.URL },
    status: { type: 'string', required: false, enum: ['completed', 'in-progress', 'archived'] }
}), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, tech, url, github_url, status } = req.body;
    
    // Validate URLs if provided
    if (url && !validateUrl(url)) {
        return res.status(400).json({ success: false, message: 'Invalid URL format' });
    }
    if (github_url && !validateUrl(github_url)) {
        return res.status(400).json({ success: false, message: 'Invalid GitHub URL format' });
    }

    const result = await pool.query(
        `UPDATE projects 
       SET title = $1, description = $2, tech = $3, url = $4, 
           github_url = $5, status = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
        [title, description, tech, url, github_url, status, id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const { response } = updateResponse(result.rows[0], 'Project updated successfully');
    res.json(response);
}));

// DELETE project (admin only)
router.delete('/:id', requireAdminJwt, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const { response } = deleteResponse('Project deleted successfully');
    res.json(response);
}));

export default router;
