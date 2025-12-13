import express from 'express';
import { Screen } from '../models/Screen.js';
import { ScreenLog } from '../models/ScreenLog.js';
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

// Get all screen logs
router.get('/logs/all', async (req, res) => {
  try {
    const logs = await ScreenLog.getAll();
    res.json(logs);
  } catch (error) {
    console.error('Error fetching screen logs:', error);
    res.status(500).json({ error: 'Failed to fetch screen logs' });
  }
});

// Get logs for a specific screen
router.get('/:id/logs', async (req, res) => {
  try {
    const logs = await ScreenLog.getByScreenId(req.params.id);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching screen logs:', error);
    res.status(500).json({ error: 'Failed to fetch screen logs' });
  }
});

// Get single screen log by ID
router.get('/logs/:id', async (req, res) => {
  try {
    const log = await ScreenLog.getById(req.params.id);
    if (!log) {
      return res.status(404).json({ error: 'Screen log not found' });
    }
    res.json(log);
  } catch (error) {
    console.error('Error fetching screen log:', error);
    res.status(500).json({ error: 'Failed to fetch screen log' });
  }
});

// Admin routes for creating screens and logs
router.post('/admin/create-with-log', authenticateApiKey, async (req, res) => {
  try {
    const { title, type, rating, content } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }

    if (!['movie', 'series'].includes(type)) {
      return res.status(400).json({ error: 'Type must be movie or series' });
    }

    // Create the screen entry
    const screen = await Screen.create({
      title,
      type
    });

    // Create the log entry
    const log = await ScreenLog.create({
      screen_id: screen.id,
      rating: rating ? parseInt(rating) : null,
      status: 'completed',
      review: content || null
    });

    res.status(201).json({
      screen,
      log,
      message: 'Screen and log created successfully'
    });
  } catch (error) {
    console.error('Error creating screen with log:', error);
    res.status(500).json({ error: 'Failed to create screen and log' });
  }
});

export default router;
