import { Router } from 'express';
import pool from '../db.js';
import { LogMetadata } from '../models/LogMetadata.js';
import { LogContent } from '../models/LogContent.js';
import { requireAdminJwt } from '../middleware/auth.js';
import NodeCache from 'node-cache';

const router = Router();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

// Helper to format log for frontend
const formatLog = (log, content = null) => {
  const base = {
    _id: log.id,
    id: log.id,
    title: log.title,
    image: log.cover_image,
    rating: log.rating?.toString(),
    status: log.status,
    favorite: log.favorite,
    date: log.logged_date || log.created_at,
    type: log.category === 'tv' ? 'series' : log.category // maintain frontend 'series' type
  };

  if (content) {
    base.content = content.content; // The main review/notes
    // Spread details safely
    if (content.details) {
      Object.assign(base, content.details);
    }
  }

  // Spread metadata if present (category specific fields like artist, director)
  if (log.metadata) {
    Object.assign(base, log.metadata);
  }

  // Frontend expects specific type keys for some lists or simplified views
  // We can normalize further if needed.
  return base;
};

// --- Public Endpoints ---

// Combined endpoint to fetch all homepage data in one request
router.get('/combined/homepage', async (req, res) => {
  try {
    // Check cache first
    const cachedData = cache.get('homepage-data');
    if (cachedData) {
      return res.json(cachedData);
    }

    // Get blogs (unchanged)
    console.log('Fetching homepage blogs...');
    const blogsPromise = pool.query(`
      SELECT id, title, content, category, created_at
      FROM blogs
      ORDER BY created_at DESC
      LIMIT 6
    `);

    // Get logs by category
    const [blogs, music, games, movies, series, books] = await Promise.all([
      blogsPromise,
      LogMetadata.findAll('music', 10),
      LogMetadata.findAll('games', 10),
      LogMetadata.findAll('movies', 10),
      LogMetadata.findAll('tv', 10),
      LogMetadata.findAll('books', 10)
    ]);

    // Fetch separate playlist logic if needed, but for now assuming migrated to 'music'
    // If music category covers playlists:

    // Process details if strictly needed for homepage (usually just metadata is enough)
    // The previous implementation returned full objects with some details. 
    // For now, returning metadata should be sufficient for cards. 
    // If we need 'platform' for games on homepage, we might need a join or store it in metadata.
    // Wait, the previous implementation did return detailed fields for games/movies on homepage.
    // I should check if LogMetadata needs platform/genre/etc.
    // The simplified schema moved 'platform' to details (doh).
    // If homepage cards need 'platform' or 'author', we need to join.
    // Let's do a quick join for homepage items since it's just top 10.
    // Actually, SQL JOIN is better than fetching details one by one.

    // Let's optimize `LogMetadata.findAll` to optionally join or we write specific queries here.
    // I will write specific queries here for best performance to get common fields needed for cards.

    // But `LogContent` separates them. 
    // Let's rewrite the queries to LEFT JOIN log_content to get details for the homepage cards.

    const getLogsWithDetails = async (category, limit = 10) => {
      const result = await pool.query(`
        SELECT m.*, c.content, c.details
        FROM log_metadata m
        LEFT JOIN log_content c ON m.id = c.log_id
        WHERE m.category = $1
        ORDER BY m.logged_date DESC
        LIMIT $2
       `, [category, limit]);
      return result.rows.map(row => formatLog(row, { content: row.content, details: row.details }));
    };

    const [musicLogs, gameLogs, movieLogs, seriesLogs, bookLogs] = await Promise.all([
      getLogsWithDetails('music'),
      getLogsWithDetails('games'),
      getLogsWithDetails('movies'),
      getLogsWithDetails('tv'),
      getLogsWithDetails('books')
    ]);

    const result = {
      blogs: blogs.rows.map(row => ({ ...row, _id: row.id })),
      music: musicLogs,
      games: gameLogs,
      movies: movieLogs,
      series: seriesLogs,
      books: bookLogs
    };

    // Cache the result
    cache.set('homepage-data', result);

    res.json(result);
  } catch (err) {
    console.error('Error fetching combined homepage data:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all logs (backward compatibility or general feed)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, c.details
      FROM log_metadata m
      LEFT JOIN log_content c ON m.id = c.log_id
      ORDER BY m.logged_date DESC
      LIMIT 20
    `);

    const logs = result.rows.map(row => formatLog(row, { details: row.details }));
    res.json(logs);
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get logs by type
router.get('/:type', async (req, res) => {
  try {
    let { type } = req.params;

    // Clean up type mapping
    let category = type;
    if (type === 'series') category = 'tv';
    // music, games, movies, books match.

    const result = await pool.query(`
      SELECT m.*, c.details
      FROM log_metadata m
      LEFT JOIN log_content c ON m.id = c.log_id
      WHERE m.category = $1
      ORDER BY m.logged_date DESC
    `, [category]);

    const logs = result.rows.map(row => formatLog(row, { details: row.details }));
    res.json(logs);
  } catch (err) {
    console.error('Error fetching logs by type:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get individual log entry by category and ID
router.get('/:category/:id', async (req, res) => {
  try {
    let { category, id } = req.params;
    if (category === 'series') category = 'tv';

    const result = await pool.query(`
      SELECT m.*, c.content, c.details
      FROM log_metadata m
      LEFT JOIN log_content c ON m.id = c.log_id
      WHERE m.id = $1
    `, [id]);

    // Note: We ignore category in WHERE to allow finding by ID even if URL cat is wrong/lazy, 
    // but good to check if needed. existing checked ID+type.
    // If ID is unique across all metadata (it is serial), we are good.

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    const log = result.rows[0];
    // Optional: verify category
    // if (log.category !== category) ...

    const formatted = formatLog(log, { content: log.content, details: log.details });
    res.json(formatted);

  } catch (err) {
    console.error('Error fetching individual log:', err);
    res.status(500).json({ message: err.message });
  }
});

// --- Admin Endpoints ---

// Create new log entry
router.post('/', requireAdminJwt, async (req, res) => {
  try {
    const {
      category, // 'games', 'movies', 'tv', 'books', 'music' (can be 'series' from frontend, mapped below)
      title,
      cover_image, // or cover_image_url
      rating,
      status,
      content, // review/thoughts
      details = {} // extra fields like platform, genre, songs, etc.
    } = req.body;

    // Normalize category
    let type = category;
    if (category === 'series') type = 'tv';

    // Normalize details logic from previous separate endpoints
    // Extract metadata fields
    const {
      artist, director, developer, platform,
      metadata = {}
    } = req.body;

    const finalMetadata = { ...metadata };
    if (artist) finalMetadata.artist = artist;
    if (director) finalMetadata.director = director;
    if (developer) finalMetadata.developer = developer;
    if (platform) finalMetadata.platform = platform;

    // Normalize additional details
    const {
      genre, release_year, year, hours_played,
      tech, url, github_url
    } = req.body;

    const finalDetails = { ...details };
    // Enrich details if provided at top level
    if (genre) finalDetails.genre = genre;
    if (release_year) finalDetails.release_year = release_year;
    if (year) finalDetails.year = year;
    if (hours_played) finalDetails.hours_played = hours_played;

    // Project specific
    if (tech) finalDetails.tech = tech;
    if (url) finalDetails.url = url;
    if (github_url) finalDetails.github_url = github_url;

    const metadataRecord = await LogMetadata.create({
      category: type,
      title,
      cover_image: cover_image || req.body.cover_image_url,
      rating: rating ? parseInt(rating) : null,
      status: status || 'completed',
      favorite: false,
      logged_date: req.body.logged_date || req.body.played_on || req.body.watched_on || req.body.read_on || new Date(),
      metadata: finalMetadata
    });

    await LogContent.create({
      log_id: metadataRecord.id,
      content,
      details: finalDetails
    });

    cache.del('homepage-data');

    res.status(201).json({ ...metadataRecord, content, details: finalDetails });
  } catch (err) {
    console.error('Error creating log:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update log entry
router.put('/:id', requireAdminJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category, title, cover_image, rating, status, content, favorite, details = {},
      metadata = {}
    } = req.body;

    let type = category;
    if (category === 'series') type = 'tv';

    // Extract metadata fields
    const {
      artist, director, developer, platform
    } = req.body;

    const finalMetadata = { ...metadata };
    if (artist) finalMetadata.artist = artist;
    if (director) finalMetadata.director = director;
    if (developer) finalMetadata.developer = developer;
    if (platform) finalMetadata.platform = platform;

    // Normalize details handling like in create
    const {
      genre, release_year, year, hours_played,
      tech, url, github_url
    } = req.body;

    const finalDetails = { ...details };
    if (genre) finalDetails.genre = genre;
    if (release_year) finalDetails.release_year = release_year;
    if (year) finalDetails.year = year;
    if (hours_played) finalDetails.hours_played = hours_played;

    // Project specific
    if (tech) finalDetails.tech = tech;
    if (url) finalDetails.url = url;
    if (github_url) finalDetails.github_url = github_url;

    const metadataRecord = await LogMetadata.update(id, {
      category: type,
      title,
      cover_image: cover_image || req.body.cover_image_url,
      rating: rating ? parseInt(rating) : null,
      status,
      favorite,
      logged_date: req.body.logged_date || new Date(), // Ideally preserve original date if not passed, but update likely sends it
      metadata: finalMetadata
    });

    if (!metadataRecord) {
      return res.status(404).json({ message: 'Log not found' });
    }

    const updatedContent = await LogContent.update(id, {
      content,
      details: finalDetails
    });

    cache.del('homepage-data');

    res.json({ ...metadata, content: updatedContent.content, details: updatedContent.details });
  } catch (err) {
    console.error('Error updating log:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete log entry
router.delete('/:id', requireAdminJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await LogMetadata.delete(id);
    // LogContent cascades

    cache.del('homepage-data');

    if (!result) {
      return res.status(404).json({ message: 'Log not found' });
    }
    res.json({ message: 'Log deleted successfully' });
  } catch (err) {
    console.error('Error deleting log:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
