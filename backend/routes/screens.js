import express from 'express';
import { Screen } from '../models/Screen.js';
import { authenticateApiKey } from '../middleware/auth.js';

const router = express.Router();

// Get all screens
router.get('/', async (req, res) => {
  try {
    const screens = await Screen.getAll();
    res.json(screens);
  } catch (error) {
    console.error('Error fetching screens:', error);
    res.status(500).json({ error: 'Failed to fetch screens' });
  }
});

// Get screen by ID
router.get('/:id', async (req, res) => {
  try {
    const screen = await Screen.getById(req.params.id);
    if (!screen) {
      return res.status(404).json({ error: 'Screen not found' });
    }
    res.json(screen);
  } catch (error) {
    console.error('Error fetching screen:', error);
    res.status(500).json({ error: 'Failed to fetch screen' });
  }
});

// Note: Log data is now merged into the screens table

// Admin endpoint to create screen with all data
router.post('/admin/create-with-log', authenticateApiKey, async (req, res) => {
  try {
    const { title, type, director, genre, year, cover_image_url, rating, content } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }

    if (!['movie', 'series'].includes(type)) {
      return res.status(400).json({ error: 'Type must be movie or series' });
    }

    // Create the screen with all data in one call (merged schema)
    const screen = await Screen.create({
      title,
      type,
      director: director || null,
      genre: genre || null,
      year: year ? parseInt(year) : null,
      cover_image_url: cover_image_url || null,
      rating: rating ? parseInt(rating) : null,
      status: 'completed',
      review: content || null,
      watched_on: new Date().toISOString().split('T')[0]
    });

    res.status(201).json({
      screen,
      message: 'Screen created successfully'
    });
  } catch (error) {
    console.error('Error creating screen with log:', error);
    res.status(500).json({ error: 'Failed to create screen and log' });
  }
});

export default router;
