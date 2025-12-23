import express from 'express';
import { Read } from '../models/Read.js';
import { authenticateApiKey } from '../middleware/auth.js';

const router = express.Router();

// Get all reads
router.get('/', async (req, res) => {
  try {
    const reads = await Read.getAll();
    res.json(reads);
  } catch (error) {
    console.error('Error fetching reads:', error);
    res.status(500).json({ error: 'Failed to fetch reads' });
  }
});

// Get read by ID
router.get('/:id', async (req, res) => {
  try {
    const read = await Read.getById(req.params.id);
    if (!read) {
      return res.status(404).json({ error: 'Read not found' });
    }
    res.json(read);
  } catch (error) {
    console.error('Error fetching read:', error);
    res.status(500).json({ error: 'Failed to fetch read' });
  }
});

// Note: Log data is now merged into the reads table

// Admin endpoint to create read with all data
router.post('/admin/create-with-log', authenticateApiKey, async (req, res) => {
  try {
    const { title, author, genre, year, cover_image_url, rating, content } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Create the read with all data in one call (merged schema)
    const read = await Read.create(
      title,
      author || null,
      genre || null,
      year ? parseInt(year) : null,
      cover_image_url || null,
      rating ? parseInt(rating) : null,
      'completed',
      content || null,
      new Date().toISOString().split('T')[0]
    );

    res.status(201).json({
      read,
      message: 'Read created successfully'
    });
  } catch (error) {
    console.error('Error creating read with log:', error);
    res.status(500).json({ error: 'Failed to create read and log' });
  }
});

export default router;
