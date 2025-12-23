import { Router } from 'express';
import pool from '../db.js';
import { Game } from '../models/Game.js';
import { Screen } from '../models/Screen.js';
import { Read } from '../models/Read.js';
import { Playlist } from '../models/Playlist.js';
import NodeCache from 'node-cache';

const router = Router();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

// Combined endpoint to fetch all homepage data in one request
router.get('/combined/homepage', async (req, res) => {
  try {
    // Check cache first
    const cachedData = cache.get('homepage-data');
    if (cachedData) {
      return res.json(cachedData);
    }

    const [blogs, playlists, games, movies, series, books] = await Promise.all([
      // Get recent blogs
      pool.query(`
        SELECT id, title, content, category, created_at, tags
        FROM blogs
        WHERE is_draft = false
        ORDER BY created_at DESC
        LIMIT 6
      `),

      // Get playlists
      pool.query(`
        SELECT id, name, created_at
        FROM playlists
        ORDER BY created_at DESC
      `),

      // Get games with log data (now in same table)
      pool.query(`
        SELECT
          id, title, platform, genre, release_year, cover_image_url,
          rating, status, hours_played, created_at as date
        FROM games
        ORDER BY created_at DESC
      `),

      // Get movies with log data (now in same table)
      pool.query(`
        SELECT
          id, title, cover_image_url,
          rating, status, created_at as date
        FROM screens
        WHERE type = 'movie'
        ORDER BY created_at DESC
      `),

      // Get series with log data (now in same table)
      pool.query(`
        SELECT
          id, title, cover_image_url,
          rating, status, created_at as date
        FROM screens
        WHERE type = 'series'
        ORDER BY created_at DESC
      `),

      // Get books with log data (now in same table)
      pool.query(`
        SELECT
          id, title, author, cover_image_url,
          rating, status, created_at as date
        FROM reads
        ORDER BY created_at DESC
      `)
    ]);

    const result = {
      blogs: blogs.rows.map(row => ({ ...row, _id: row.id })),
      music: playlists.rows.map(p => ({
        _id: p.id, id: p.id, title: p.name, type: 'music', date: p.created_at
      })),
      games: games.rows.map(g => ({
        _id: g.id, id: g.id, title: g.title, type: 'games',
        platform: g.platform, genre: g.genre, release_year: g.release_year, image: g.cover_image_url,
        rating: g.rating?.toString(), status: g.status, hours_played: g.hours_played, date: g.date
      })),
      movies: movies.rows.map(m => ({
        _id: m.id, id: m.id, title: m.title, type: 'movies',
        rating: m.rating?.toString(), status: m.status, date: m.date
      })),
      series: series.rows.map(s => ({
        _id: s.id, id: s.id, title: s.title, type: 'series',
        rating: s.rating?.toString(), status: s.status, date: s.date
      })),
      books: books.rows.map(b => ({
        _id: b.id, id: b.id, title: b.title, type: 'books', author: b.author,
        rating: b.rating?.toString(), status: b.status, date: b.date
      }))
    };

    // Cache the result
    cache.set('homepage-data', result);

    res.json(result);
  } catch (err) {
    console.error('Error fetching combined homepage data:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all logs (backward compatibility endpoint)
router.get('/', async (req, res) => {
  try {
    // Aggregate all recent logs from different tables
    const results = [];

    // Get game logs with game info (now merged in games table)
    const games = await pool.query(`
      SELECT
        id, title, rating, created_at as date
      FROM games
      ORDER BY created_at DESC
      LIMIT 10
    `);

    results.push(...games.rows.map(game => ({
      _id: game.id,
      id: game.id,
      title: game.title,
      type: 'games',
      rating: game.rating?.toString(),
      date: game.date
    })));

    res.json(results);
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get logs by type (backward compatibility)
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    let results = [];

    switch (type) {
      case 'music':
        // Music is now playlists - optimized query
        const playlists = await pool.query(`
          SELECT id, name, created_at
          FROM playlists
          ORDER BY created_at DESC
        `);
        results = playlists.rows.map(p => ({
          _id: p.id,
          id: p.id,
          title: p.name,
          type: 'music',
          rating: null,
          date: p.created_at
        }));
        break;

      case 'games':
        // Optimized: Direct query from games table (merged schema)
        const games = await pool.query(`
          SELECT
            id, title, platform, genre, release_year, cover_image_url,
            rating, status, hours_played, created_at as date
          FROM games
          ORDER BY created_at DESC
        `);
        results = games.rows.map(game => ({
          _id: game.id,
          id: game.id,
          title: game.title,
          type: 'games',
          platform: game.platform,
          genre: game.genre,
          release_year: game.release_year,
          image: game.cover_image_url,
          rating: game.rating?.toString(),
          status: game.status,
          hours_played: game.hours_played,
          date: game.date
        }));
        break;

      case 'movies':
        // Optimized: Direct query from screens table (merged schema)
        const movies = await pool.query(`
          SELECT
            id, title, cover_image_url, rating, status, created_at as date
          FROM screens
          WHERE type = 'movie'
          ORDER BY created_at DESC
        `);
        results = movies.rows.map(movie => ({
          _id: movie.id,
          id: movie.id,
          title: movie.title,
          type: 'movies',
          cover_image_url: movie.cover_image_url,
          rating: movie.rating?.toString(),
          status: movie.status,
          date: movie.date
        }));
        break;

      case 'series':
        // Optimized: Direct query from screens table (merged schema)
        const series = await pool.query(`
          SELECT
            id, title, cover_image_url, rating, status, created_at as date
          FROM screens
          WHERE type = 'series'
          ORDER BY created_at DESC
        `);
        results = series.rows.map(show => ({
          _id: show.id,
          id: show.id,
          title: show.title,
          type: 'series',
          cover_image_url: show.cover_image_url,
          rating: show.rating?.toString(),
          status: show.status,
          date: show.date
        }));
        break;

      case 'books':
        // Optimized: Direct query from reads table (merged schema)
        const books = await pool.query(`
          SELECT
            id, title, author, cover_image_url, rating, status, created_at as date
          FROM reads
          ORDER BY created_at DESC
        `);
        results = books.rows.map(book => ({
          _id: book.id,
          id: book.id,
          title: book.title,
          type: 'books',
          author: book.author,
          cover_image_url: book.cover_image_url,
          rating: book.rating?.toString(),
          status: book.status,
          date: book.date
        }));
        break;

      default:
        return res.status(400).json({ message: 'Invalid log type' });
    }

    res.json(results);
  } catch (err) {
    console.error('Error fetching logs by type:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get individual log entry by category and ID
router.get('/:category/:id', async (req, res) => {
  try {
    const { category, id } = req.params;
    let result = null;

    switch (category) {
      case 'games':
        // Get game with all data (merged schema)
        const gameData = await pool.query(`
          SELECT
            id, title, platform, genre, release_year, cover_image_url as image,
            rating, status, hours_played, review as content, created_at
          FROM games
          WHERE id = $1
        `, [id]);

        if (gameData.rows.length > 0) {
          const game = gameData.rows[0];
          result = {
            _id: game.id,
            id: game.id,
            title: game.title,
            type: 'games',
            platform: game.platform,
            genre: game.genre,
            release_year: game.release_year,
            image: game.image,
            rating: game.rating?.toString(),
            status: game.status,
            hours_played: game.hours_played,
            content: game.content,
            created_at: game.created_at,
            category: 'gaming'
          };
        }
        break;

      case 'movies':
      case 'series':
        // Get screen (movie/series) with all data (merged schema)
        const screenData = await pool.query(`
          SELECT
            id, title, type, director, genre, year, cover_image_url as image,
            rating, status, review as content, created_at
          FROM screens
          WHERE id = $1 AND type = $2
        `, [id, category === 'movies' ? 'movie' : 'series']);

        if (screenData.rows.length > 0) {
          const screen = screenData.rows[0];
          result = {
            _id: screen.id,
            id: screen.id,
            title: screen.title,
            type: category,
            director: screen.director,
            genre: screen.genre,
            release_year: screen.year,
            image: screen.image,
            rating: screen.rating?.toString(),
            status: screen.status,
            content: screen.content,
            created_at: screen.created_at,
            category: screen.type === 'movie' ? 'movies' : 'tv-series'
          };
        }
        break;

      case 'books':
        // Get book with all data (merged schema)
        const bookData = await pool.query(`
          SELECT
            id, title, author, genre, year, cover_image_url as image,
            rating, status, review as content, created_at
          FROM reads
          WHERE id = $1
        `, [id]);

        if (bookData.rows.length > 0) {
          const book = bookData.rows[0];
          result = {
            _id: book.id,
            id: book.id,
            title: book.title,
            type: 'books',
            author: book.author,
            genre: book.genre,
            release_year: book.year,
            image: book.image,
            rating: book.rating?.toString(),
            status: book.status,
            content: book.content,
            created_at: book.created_at,
            category: 'books'
          };
        }
        break;

      default:
        return res.status(400).json({ message: 'Invalid category' });
    }

    if (!result) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    res.json(result);
  } catch (err) {
    console.error('Error fetching individual log:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
