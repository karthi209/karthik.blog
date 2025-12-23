import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateApiKey } from '../middleware/auth.js';

const router = express.Router();

// Set up multer storage for covers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), 'uploads', 'covers');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `cover-${Date.now()}-${Math.floor(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// POST /api/upload/cover (admin only)
router.post('/cover', authenticateApiKey, upload.single('cover'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the relative path to store in DB
  const coverPath = `/uploads/covers/${req.file.filename}`;
  res.status(201).json({ cover_image_url: coverPath });
});

export default router;
