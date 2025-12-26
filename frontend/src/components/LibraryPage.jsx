import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLogs } from '../services/api';

// Type labels for display
const TYPE_LABELS = {
  movies: 'Movie',
  tv: 'TV',
  music: 'Album',
  books: 'Book',
  games: 'Game'
};

export default function LibraryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [allItems, setAllItems] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // 'date' or 'rating'

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api';

        // Fetch all types in parallel
        const [playlists, games, movies, series, books] = await Promise.all([
          fetchLogs('music').catch(() => []),
          fetchLogs('games').catch(() => []),
          fetchLogs('movies').catch(() => []),
          fetchLogs('series').catch(() => []),
          fetchLogs('books').catch(() => [])
        ]);

        // Handle API response format - could be {success: true, data: [...]} or direct array
        const normalizeResponse = (response) => {
          if (Array.isArray(response)) return response;
          if (response && response.data && Array.isArray(response.data)) return response.data;
          if (response && response.success && Array.isArray(response.data)) return response.data;
          return [];
        };

        const gamesList = normalizeResponse(games);
        const playlistsList = normalizeResponse(playlists);
        const moviesList = normalizeResponse(movies);
        const seriesList = normalizeResponse(series);
        const booksList = normalizeResponse(books);

        // Normalize and combine all items
        const items = [
          ...playlistsList.map(p => ({
            id: `album-${p.id || p.log_id || p._id}`,
            type: 'music',
            title: p.title,
            description: p.content || p.description || p.thoughts || p.review,
            date: p.date || p.logged_date || p.created_at || p.createdAt,
            rating: p.rating ? parseFloat(p.rating) : null,
            onClick: () => navigate(`/library/music/${p.id || p.log_id || p._id}`)
          })),
          ...gamesList.map(g => ({
            id: `game-${g._id || g.id || g.log_id}`,
            type: 'games',
            title: g.title,
            description: g.thoughts || g.review || g.content,
            date: g.date || g.logged_date || g.created_at || g.createdAt,
            rating: g.rating ? parseFloat(g.rating) : null,
            onClick: () => navigate(`/library/games/${g._id || g.id || g.log_id}`)
          })),
          ...moviesList.map(s => ({
            id: `movie-${s._id || s.id || s.log_id}`,
            type: 'movies',
            title: s.title,
            description: s.thoughts || s.review || s.content,
            date: s.date || s.logged_date || s.created_at || s.createdAt,
            rating: s.rating ? parseFloat(s.rating) : null,
            onClick: () => navigate(`/library/movies/${s._id || s.id || s.log_id}`)
          })),
          ...seriesList.map(s => ({
            id: `series-${s._id || s.id || s.log_id}`,
            type: 'tv',
            title: s.title,
            description: s.thoughts || s.review || s.content,
            date: s.date || s.logged_date || s.created_at || s.createdAt,
            rating: s.rating ? parseFloat(s.rating) : null,
            onClick: () => navigate(`/library/series/${s._id || s.id || s.log_id}`)
          })),
          ...booksList.map(b => ({
            id: `book-${b._id || b.id || b.log_id}`,
            type: 'books',
            title: b.title,
            description: b.thoughts || b.review || b.content,
            date: b.date || b.logged_date || b.created_at || b.createdAt,
            rating: b.rating ? parseFloat(b.rating) : null,
            onClick: () => navigate(`/library/books/${b._id || b.id || b.log_id}`)
          }))
        ];

        // Filter out items without valid titles
        const validItems = items.filter(item => item.title);
        setAllItems(validItems);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [navigate]);

  useEffect(() => {
    if (!loading) {
      setShowLoader(false);
      return;
    }
    // Only show loader after 2.5 seconds - prevents distracting flash for fast loads
    const t = setTimeout(() => setShowLoader(true), 2500);
    return () => clearTimeout(t);
  }, [loading]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = allItems;
    
    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.type === categoryFilter);
    }
    
    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'rating') {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        // If ratings are equal, sort by date
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
      } else {
        // Sort by date
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
      }
    });
    
    return sorted;
  }, [allItems, categoryFilter, sortBy]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const item of filteredAndSortedItems) {
      const year = item?.date ? new Date(item.date).getFullYear() : '—';
      const key = String(year);
      const arr = map.get(key) || [];
      arr.push(item);
      map.set(key, arr);
    }

    // Keep years sorted desc
    return Array.from(map.entries())
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([year, items]) => ({ year, items }));
  }, [filteredAndSortedItems]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Library</h1>
          <p className="page-meta">Things I watched, played, listened to, and read.</p>
        </div>
      </div>

      {allItems.length > 0 && (
        <div className="library-controls">
          <div className="library-filter-group">
            <label htmlFor="category-filter" className="library-filter-label">Category</label>
            <select
              id="category-filter"
              className="library-filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="movies">Movies</option>
              <option value="tv">TV</option>
              <option value="music">Albums</option>
              <option value="books">Books</option>
              <option value="games">Games</option>
            </select>
          </div>
          <div className="library-filter-group">
            <label htmlFor="sort-filter" className="library-filter-label">Sort by</label>
            <select
              id="sort-filter"
              className="library-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Date</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          {showLoader ? (
            <>
              <div className="loading-spinner">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p className="loading-text">Loading library...</p>
            </>
          ) : null}
        </div>
      ) : filteredAndSortedItems.length === 0 ? (
        <div className="post">
          <p className="page-meta">Nothing here yet.</p>
        </div>
      ) : (
        <div className="library-timeline">
          {groups.map(group => (
            <section key={group.year} className="library-year">
              <div className="library-year-header">
                <h3 className="library-year-title">{group.year}</h3>
              </div>

              <div className="library-entries">
                {group.items.map(item => {
                  const dateLabel = item?.date
                    ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '—';
                  const thoughts = item?.description
                    ? item.description.replace(/\s+/g, ' ').trim()
                    : '';
                  const typeLabel = TYPE_LABELS[item.type] || item.type;
                  // Format rating: remove .0, keep .5 etc
                  const rating = item.rating 
                    ? (item.rating % 1 === 0 ? item.rating.toString() : item.rating.toFixed(1))
                    : null;
                  const ratingPercent = item.rating ? (item.rating / 10) * 100 : 0;

                  return (
                    <div
                      key={item.id}
                      className="library-entry"
                    >
                      <span className="library-entry-date">{dateLabel}</span>
                      <div className="library-entry-content">
                        <div className="library-entry-header">
                          <div className="library-entry-title">{item.title}</div>
                          <span className="library-entry-type">{typeLabel}</span>
                          <button
                            type="button"
                            className="library-read-review-btn"
                            onClick={item.onClick}
                          >
                            Read review
                          </button>
                        </div>
                        {thoughts ? (
                          <div className="library-entry-thoughts">{thoughts}</div>
                        ) : null}
                      </div>
                      <div className="library-entry-rating-col">
                        {rating !== null ? (
                          <div className="library-rating-wrapper">
                            <div className="library-rating-bar">
                              <div 
                                className="library-rating-bar-fill" 
                                style={{ width: `${ratingPercent}%` }}
                              ></div>
                            </div>
                            <span className="library-entry-rating">{rating}</span>
                          </div>
                        ) : (
                          <span className="library-entry-rating library-entry-rating-empty">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

