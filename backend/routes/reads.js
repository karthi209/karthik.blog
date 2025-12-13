import express from 'express';
import { Read } from '../models/Read.js';
import { ReadLog } from '../models/ReadLog.js';
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

// Get all read logs
router.get('/logs/all', async (req, res) => {
  try {
    const logs = await ReadLog.getAll();
    res.json(logs);
  } catch (error) {
    console.error('Error fetching read logs:', error);
    res.status(500).json({ error: 'Failed to fetch read logs' });
  }
});

// Get logs for a specific read
router.get('/:id/logs', async (req, res) => {
  try {
    const logs = await ReadLog.getByReadId(req.params.id);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching read logs:', error);
    res.status(500).json({ error: 'Failed to fetch read logs' });
  }
});

// Get single read log by ID
router.get('/logs/:id', async (req, res) => {
  try {
    const log = await ReadLog.getById(req.params.id);
    if (!log) {
      return res.status(404).json({ error: 'Read log not found' });
    }
    res.json(log);
  } catch (error) {
    console.error('Error fetching read log:', error);
    res.status(500).json({ error: 'Failed to fetch read log' });
  }
});

// Admin routes for creating reads and logs
router.post('/admin/create-with-log', authenticateApiKey, async (req, res) => {
  try {
    const { title, rating, content } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Create the read entry
    const read = await Read.create({
      title,
      author: null // Books don't have author in the current schema
    });

    // Create the log entry
    const log = await ReadLog.create({
      read_id: read.id,
      rating: rating ? parseInt(rating) : null,
      status: 'completed',
      review: content || null
    });

    res.status(201).json({
      read,
      log,
      message: 'Read and log created successfully'
    });
  } catch (error) {
    console.error('Error creating read with log:', error);
    res.status(500).json({ error: 'Failed to create read and log' });
  }
});

export default router;
