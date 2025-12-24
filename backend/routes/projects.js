import { Router } from 'express';
import pool from '../db.js';
import { requireAdminJwt } from '../middleware/auth.js';

const router = Router();

// GET all projects (public)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM projects ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching projects:', err);
        res.status(500).json({ message: err.message });
    }
});

// GET single project by ID (public)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching project:', err);
        res.status(500).json({ message: err.message });
    }
});

// CREATE new project (admin only)
router.post('/', requireAdminJwt, async (req, res) => {
    try {
        const { title, description, tech, url, github_url, status } = req.body;

        const result = await pool.query(
            `INSERT INTO projects (title, description, tech, url, github_url, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [title, description, tech, url, github_url, status || 'completed']
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating project:', err);
        res.status(500).json({ message: err.message });
    }
});

// UPDATE project (admin only)
router.put('/:id', requireAdminJwt, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, tech, url, github_url, status } = req.body;

        const result = await pool.query(
            `UPDATE projects 
       SET title = $1, description = $2, tech = $3, url = $4, 
           github_url = $5, status = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
            [title, description, tech, url, github_url, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating project:', err);
        res.status(500).json({ message: err.message });
    }
});

// DELETE project (admin only)
router.delete('/:id', requireAdminJwt, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        console.error('Error deleting project:', err);
        res.status(500).json({ message: err.message });
    }
});

export default router;
