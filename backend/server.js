import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initDatabase } from './db.js';
import blogRoutes from './routes/blogs.js';
import blogApiRoutes from './routes/blogs-api.js';
import logRoutes from './routes/logs.js';
import playlistRoutes from './routes/playlists.js';
import gameRoutes from './routes/games.js';
import screenRoutes from './routes/screens.js';
import readRoutes from './routes/reads.js';
import travelRoutes from './routes/travels.js';

const app = express();

// Security headers
app.use(helmet());

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
  max: 20, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
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
app.use('/api/blogs', blogApiRoutes); // API routes with authentication
app.use('/api/logs', logRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/screens', screenRoutes);
app.use('/api/reads', readRoutes);
app.use('/api/travels', travelRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 