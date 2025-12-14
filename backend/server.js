import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import { authenticateApiKey } from './middleware/auth.js';
import blogRoutes from './routes/blogs.js';
import blogApiRoutes from './routes/blogs-api.js';
import logRoutes from './routes/logs.js';
import playlistRoutes from './routes/playlists.js';
import gameRoutes from './routes/games.js';
import screenRoutes from './routes/screens.js';
import readRoutes from './routes/reads.js';
import travelRoutes from './routes/travels.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};
const coversDir = path.join(__dirname, 'uploads/covers');
const imagesDir = path.join(__dirname, 'uploads/images');
ensureDir(coversDir);
ensureDir(imagesDir);

const app = express();

// Trust proxy - trust only the first proxy (nginx)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Enable response compression
app.use(compression());

// CORS configuration - restrict to allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS policy violation'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Rate limiting for authentication endpoints (admin login only)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for admin write operations
const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 admin operations per minute
  message: 'Too many admin requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for read operations
    return req.method === 'GET';
  }
});

// General API rate limiting (more generous for public routes)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters only where needed
// Don't apply rate limiting to public read-only routes during development
// app.use('/api/', apiLimiter); // Uncomment for production

app.use(express.json({ limit: '10mb' })); // Allow larger payloads for markdown files

// Serve uploaded files statically with caching
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '30d', // Cache static files for 30 days
  etag: true,
  lastModified: true,
  immutable: true,
}));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, coversDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cover-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Generic blog image upload storage
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// File upload route
app.post('/api/upload/cover', upload.single('cover'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the relative path that can be stored in the database
    const filePath = `/uploads/covers/${req.file.filename}`;
    res.json({
      success: true,
      filePath: filePath,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Generic image upload route (for editor images) - PROTECTED
app.post('/api/upload/image', authenticateApiKey, uploadImage.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = `/uploads/images/${req.file.filename}`;
    res.json({
      success: true,
      filePath,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Initialize PostgreSQL database
initDatabase()
  .then(() => {
    console.log('Database initialization completed');
  })
  .catch(err => {
    console.error('Database initialization error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/blogs', blogRoutes);
app.use('/api/blogs', adminLimiter, blogApiRoutes); // API routes with authentication and rate limiting
app.use('/api/logs', logRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/screens', screenRoutes);
app.use('/api/reads', readRoutes);
app.use('/api/travels', travelRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 