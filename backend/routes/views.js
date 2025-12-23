import { Router } from 'express';
import { View } from '../models/View.js';

const router = Router();

router.post('/track', async (req, res) => {
  try {
    const { path } = req.body || {};

    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'path is required' });
    }

    if (!path.startsWith('/')) {
      return res.status(400).json({ error: 'path must start with /' });
    }

    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const row = await View.track(path, ip, userAgent);
    res.json(row);
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({ error: 'Failed to track view' });
  }
});

router.get('/', async (req, res) => {
  try {
    const path = req.query.path;

    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'path query param is required' });
    }

    const row = await View.get(path);
    res.json(row);
  } catch (error) {
    console.error('Error fetching view count:', error);
    res.status(500).json({ error: 'Failed to fetch view count' });
  }
});

router.post('/batch', async (req, res) => {
  try {
    const { paths } = req.body || {};

    if (!Array.isArray(paths) || paths.some(p => typeof p !== 'string')) {
      return res.status(400).json({ error: 'paths must be an array of strings' });
    }

    const rows = await View.getBatch(paths);
    res.json({ rows });
  } catch (error) {
    console.error('Error fetching batch view counts:', error);
    res.status(500).json({ error: 'Failed to fetch batch view counts' });
  }
});

export default router;
