import express from 'express';
import { Game } from '../models/Game.js';
import { authenticateApiKey } from '../middleware/auth.js';

const router = express.Router();

// Get all games
router.get('/', async (req, res) => {
  try {
    const games = await Game.getAll();
    res.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Get game by ID
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.getById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// Note: Log data is now merged into the games table

// Admin routes for creating games
router.post('/admin/create', authenticateApiKey, async (req, res) => {
  try {
    const { title, platform, genre, release_year, cover_image_url } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Game title is required' });
    }

    const game = await Game.create({
      title,
      platform: platform || null,
      genre: genre || null,
      release_year: release_year ? parseInt(release_year) : null,
      cover_image_url: cover_image_url || null
    });

    res.status(201).json(game);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Combined admin endpoint to create game with all data
router.post('/admin/create-with-log', authenticateApiKey, async (req, res) => {
  try {
    const {
      title,
      platform,
      genre,
      release_year,
      cover_image_url,
      rating,
      hours_played,
      status,
      review,
      played_on
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Game title is required' });
    }

    // Create the game with all data in one call (merged schema)
    const game = await Game.create(
      title,
      platform || null,
      genre || null,
      release_year ? parseInt(release_year) : null,
      cover_image_url || null,
      rating ? parseInt(rating) : null,
      hours_played ? parseFloat(hours_played) : null,
      status || 'completed',
      review || null,
      played_on || new Date().toISOString().split('T')[0]
    );

    res.status(201).json({
      game,
      message: 'Game created successfully'
    });
  } catch (error) {
    console.error('Error creating game with log:', error);
    res.status(500).json({ error: 'Failed to create game and log' });
  }
});

export default router;
