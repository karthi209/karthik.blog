import express from 'express';
import { Game } from '../models/Game.js';
import { GameLog } from '../models/GameLog.js';
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

// Get all game logs
router.get('/logs/all', async (req, res) => {
  try {
    const logs = await GameLog.getAll();
    res.json(logs);
  } catch (error) {
    console.error('Error fetching game logs:', error);
    res.status(500).json({ error: 'Failed to fetch game logs' });
  }
});

// Get logs for a specific game
router.get('/:id/logs', async (req, res) => {
  try {
    const logs = await GameLog.getByGameId(req.params.id);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching game logs:', error);
    res.status(500).json({ error: 'Failed to fetch game logs' });
  }
});

// Get single game log by ID
router.get('/logs/:id', async (req, res) => {
  try {
    const log = await GameLog.getById(req.params.id);
    if (!log) {
      return res.status(404).json({ error: 'Game log not found' });
    }
    res.json(log);
  } catch (error) {
    console.error('Error fetching game log:', error);
    res.status(500).json({ error: 'Failed to fetch game log' });
  }
});

// Admin routes for creating games and logs
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

router.post('/admin/logs/create', authenticateApiKey, async (req, res) => {
  try {
    const { game_id, rating, hours_played, status, review, played_on } = req.body;

    if (!game_id) {
      return res.status(400).json({ error: 'Game ID is required' });
    }

    const log = await GameLog.create({
      game_id: parseInt(game_id),
      rating: rating ? parseInt(rating) : null,
      hours_played: hours_played ? parseFloat(hours_played) : null,
      status: status || 'completed',
      review: review || null,
      played_on: played_on || new Date().toISOString().split('T')[0]
    });

    res.status(201).json(log);
  } catch (error) {
    console.error('Error creating game log:', error);
    res.status(500).json({ error: 'Failed to create game log' });
  }
});

// Combined admin endpoint to create game and log in one request
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

    // Create the game first
    const game = await Game.create({
      title,
      platform: platform || null,
      genre: genre || null,
      release_year: release_year ? parseInt(release_year) : null,
      cover_image_url: cover_image_url || null
    });

    // Create the log entry
    const log = await GameLog.create({
      game_id: game.id,
      rating: rating ? parseInt(rating) : null,
      hours_played: hours_played ? parseFloat(hours_played) : null,
      status: status || 'completed',
      review: review || null,
      played_on: played_on || new Date().toISOString().split('T')[0]
    });

    res.status(201).json({
      game,
      log,
      message: 'Game and log created successfully'
    });
  } catch (error) {
    console.error('Error creating game with log:', error);
    res.status(500).json({ error: 'Failed to create game and log' });
  }
});

export default router;
