import { Router } from 'express';
import pool from '../db.js';
import { Game } from '../models/Game.js';
import { GameLog } from '../models/GameLog.js';
import { Screen } from '../models/Screen.js';
import { ScreenLog } from '../models/ScreenLog.js';
import { Read } from '../models/Read.js';
import { ReadLog } from '../models/ReadLog.js';
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
        SELECT id, title, content, category, date, tags
        FROM blogs
        WHERE is_draft = false
        ORDER BY date DESC
        LIMIT 6
      `),

      // Get playlists
      pool.query(`
        SELECT id, name, created_at
        FROM playlists
        ORDER BY created_at DESC
      `),

      // Get games with latest log
      pool.query(`
        SELECT
          g.id, g.title, g.platform, g.genre, g.release_year, g.cover_image_url,
          gl.rating, gl.status, gl.hours_played,
          COALESCE(gl.created_at, g.created_at) as date
        FROM games g
        LEFT JOIN LATERAL (
          SELECT rating, status, hours_played, created_at
          FROM game_logs
          WHERE game_id = g.id
          ORDER BY created_at DESC
          LIMIT 1
        ) gl ON true
        ORDER BY COALESCE(gl.created_at, g.created_at) DESC
      `),

      // Get movies with latest log
      pool.query(`
        SELECT
          s.id, s.title,
          sl.rating, sl.status,
          COALESCE(sl.created_at, s.created_at) as date
        FROM screens s
        LEFT JOIN LATERAL (
          SELECT rating, status, created_at
          FROM screen_logs
          WHERE screen_id = s.id
          ORDER BY created_at DESC
          LIMIT 1
        ) sl ON true
        WHERE s.type = 'movie'
        ORDER BY COALESCE(sl.created_at, s.created_at) DESC
      `),

      // Get series with latest log
      pool.query(`
        SELECT
          s.id, s.title,
          sl.rating, sl.status,
          COALESCE(sl.created_at, s.created_at) as date
        FROM screens s
        LEFT JOIN LATERAL (
          SELECT rating, status, created_at
          FROM screen_logs
          WHERE screen_id = s.id
          ORDER BY created_at DESC
          LIMIT 1
        ) sl ON true
        WHERE s.type = 'series'
        ORDER BY COALESCE(sl.created_at, s.created_at) DESC
      `),

      // Get books with latest log
      pool.query(`
        SELECT
          r.id, r.title, r.author,
          rl.rating, rl.status,
          COALESCE(rl.created_at, r.created_at) as date
        FROM reads r
        LEFT JOIN LATERAL (
          SELECT rating, status, created_at
          FROM read_logs
            WHERE read_id = r.id
          ORDER BY created_at DESC
          LIMIT 1
        ) rl ON true
        ORDER BY COALESCE(rl.created_at, r.created_at) DESC
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

    // Get game logs with game info
    const games = await pool.query(`
      SELECT
        g.id, g.title,
        gl.rating,
        COALESCE(gl.created_at, g.created_at) as date
      FROM games g
      LEFT JOIN LATERAL (
        SELECT rating, created_at
        FROM game_logs
        WHERE game_id = g.id
        ORDER BY created_at DESC
        LIMIT 1
      ) gl ON true
      ORDER BY COALESCE(gl.created_at, g.created_at) DESC
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
        // Optimized: Single query with JOIN
        const games = await pool.query(`
          SELECT
            g.id, g.title, g.platform, g.genre, g.release_year, g.cover_image_url,
            gl.rating, gl.status, gl.hours_played,
            COALESCE(gl.created_at, g.created_at) as date
          FROM games g
          LEFT JOIN LATERAL (
            SELECT rating, status, hours_played, created_at
            FROM game_logs
            WHERE game_id = g.id
            ORDER BY created_at DESC
            LIMIT 1
          ) gl ON true
          ORDER BY COALESCE(gl.created_at, g.created_at) DESC
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
        // Optimized: Single query with JOIN
        const movies = await pool.query(`
          SELECT
            s.id,
            s.title,
            sl.rating,
            sl.status,
            COALESCE(sl.created_at, s.created_at) as date
          FROM screens s
          LEFT JOIN LATERAL (
            SELECT rating, status, created_at
            FROM screen_logs
            WHERE screen_id = s.id
            ORDER BY created_at DESC
            LIMIT 1
          ) sl ON true
          WHERE s.type = 'movie'
          ORDER BY COALESCE(sl.created_at, s.created_at) DESC
        `);
        results = movies.rows.map(movie => ({
          _id: movie.id,
          id: movie.id,
          title: movie.title,
          type: 'movies',
          rating: movie.rating?.toString(),
          status: movie.status,
          date: movie.date
        }));
        break;

      case 'series':
        // Optimized: Single query with JOIN
        const series = await pool.query(`
          SELECT
            s.id,
            s.title,
            sl.rating,
            sl.status,
            COALESCE(sl.created_at, s.created_at) as date
          FROM screens s
          LEFT JOIN LATERAL (
            SELECT rating, status, created_at
            FROM screen_logs
            WHERE screen_id = s.id
            ORDER BY created_at DESC
            LIMIT 1
          ) sl ON true
          WHERE s.type = 'series'
          ORDER BY COALESCE(sl.created_at, s.created_at) DESC
        `);
        results = series.rows.map(show => ({
          _id: show.id,
          id: show.id,
          title: show.title,
          type: 'series',
          rating: show.rating?.toString(),
          status: show.status,
          date: show.date
        }));
        break;

      case 'books':
        // Optimized: Single query with JOIN
        const books = await pool.query(`
          SELECT
            r.id,
            r.title,
            r.author,
            rl.rating,
            rl.status,
            COALESCE(rl.created_at, r.created_at) as date
          FROM reads r
          LEFT JOIN LATERAL (
            SELECT rating, status, created_at
            FROM read_logs
            WHERE read_id = r.id
            ORDER BY created_at DESC
            LIMIT 1
          ) rl ON true
          ORDER BY COALESCE(rl.created_at, r.created_at) DESC
        `);
        results = books.rows.map(book => ({
          _id: book.id,
          id: book.id,
          title: book.title,
          type: 'books',
          author: book.author,
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
        // Get game with its latest log
        const gameData = await pool.query(`
          SELECT
            g.id, g.title, g.platform, g.genre, g.release_year, g.cover_image_url as image,
            gl.rating, gl.status, gl.hours_played, gl.review as content,
            COALESCE(gl.created_at, g.created_at) as created_at
          FROM games g
          LEFT JOIN LATERAL (
            SELECT rating, status, hours_played, review, created_at
            FROM game_logs
            WHERE game_id = g.id
            ORDER BY created_at DESC
            LIMIT 1
          ) gl ON true
          WHERE g.id = $1
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
        // Get screen (movie/series) with its latest log
        const screenData = await pool.query(`
          SELECT
            s.id, s.title, s.type,
            sl.rating, sl.status, sl.review as content,
            COALESCE(sl.created_at, s.created_at) as created_at
          FROM screens s
          LEFT JOIN LATERAL (
            SELECT rating, status, review, created_at
            FROM screen_logs
            WHERE screen_id = s.id
            ORDER BY created_at DESC
            LIMIT 1
          ) sl ON true
          WHERE s.id = $1 AND s.type = $2
        `, [id, category === 'movies' ? 'movie' : 'series']);

        if (screenData.rows.length > 0) {
          const screen = screenData.rows[0];
          result = {
            _id: screen.id,
            id: screen.id,
            title: screen.title,
            type: category,
            rating: screen.rating?.toString(),
            status: screen.status,
            content: screen.content,
            created_at: screen.created_at,
            category: screen.type === 'movie' ? 'movies' : 'tv-series'
          };
        }
        break;

      case 'books':
        // Get book with its latest log
        const bookData = await pool.query(`
          SELECT
            r.id, r.title, r.author,
            rl.rating, rl.status, rl.review as content,
            COALESCE(rl.created_at, r.created_at) as created_at
          FROM reads r
          LEFT JOIN LATERAL (
            SELECT rating, status, review, created_at
            FROM read_logs
            WHERE read_id = r.id
            ORDER BY created_at DESC
            LIMIT 1
          ) rl ON true
          WHERE r.id = $1
        `, [id]);

        if (bookData.rows.length > 0) {
          const book = bookData.rows[0];
          result = {
            _id: book.id,
            id: book.id,
            title: book.title,
            type: 'books',
            author: book.author,
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
