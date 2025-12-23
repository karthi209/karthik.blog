import { Router } from 'express';
import { Reaction } from '../models/Reaction.js';

const router = Router();

router.post('/react', async (req, res) => {
  try {
    const { path, reaction } = req.body || {};

    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'path is required' });
    }

    if (!path.startsWith('/')) {
      return res.status(400).json({ error: 'path must start with /' });
    }

    if (!reaction || typeof reaction !== 'string') {
      return res.status(400).json({ error: 'reaction is required' });
    }

    if (reaction.length > 48) {
      return res.status(400).json({ error: 'reaction too long' });
    }

    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const row = await Reaction.react({ path, reaction, ip, userAgent });
    res.json(row);
  } catch (error) {
    console.error('Error reacting:', error);
    res.status(500).json({ error: 'Failed to react' });
  }
});

router.get('/', async (req, res) => {
  try {
    const path = req.query.path;

    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'path query param is required' });
    }

    const rows = await Reaction.getForPath(path);
    res.json({ path, rows });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    res.status(500).json({ error: 'Failed to fetch reactions' });
  }
});

export default router;
