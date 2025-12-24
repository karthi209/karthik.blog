import { Router } from 'express';
import cache from '../cache.js';
import { authenticateApiKey } from '../middleware/auth.js';
import { Note } from '../models/Note.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { sortBy, order } = req.query;
    const cacheKey = `notes-${sortBy || 'created_at'}-${order || 'desc'}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const notes = await Note.findAll({ sortBy, order });
    const result = notes.map(row => ({ ...row, _id: row.id }));

    cache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/admin/list', authenticateApiKey, async (req, res) => {
  try {
    const notes = await Note.findAll({ sortBy: 'created_at', order: 'DESC' });
    res.json(notes.map(n => ({ ...n, _id: n.id })));
  } catch (err) {
    console.error('Error listing notes:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/admin/create', authenticateApiKey, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const note = await Note.create({ title, content: content || null });
    cache.flushAll();
    res.status(201).json({ success: true, note: { ...note, _id: note.id } });
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(400).json({ message: err.message });
  }
});

router.put('/admin/:id', authenticateApiKey, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid note ID format' });

    const { title, content } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const note = await Note.update(id, { title, content: content || null });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    cache.flushAll();
    res.json({ success: true, note: { ...note, _id: note.id } });
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(400).json({ message: err.message });
  }
});

router.delete('/admin/:id', authenticateApiKey, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid note ID format' });

    const note = await Note.delete(id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    cache.flushAll();
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid note ID format' });

    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    res.json({ ...note, _id: note.id });
  } catch (err) {
    console.error('Error fetching note:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
