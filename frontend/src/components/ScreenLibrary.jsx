import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Removed lucide-react icons to align with retro text-only style
// import { Film, Tv, Star, Filter, SortAsc, Search, MonitorPlay } from 'lucide-react';
import { fetchLogs } from '../services/api';
import '../styles/modern.css';

export default function ScreenLibrary() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const movies = await fetchLogs('movies');
        const series = await fetchLogs('series');
        // Add type property to distinguish
        const moviesWithType = movies.map(m => ({ ...m, type: 'movie' }));
        const seriesWithType = series.map(s => ({ ...s, type: 'series' }));
        setEntries([...moviesWithType, ...seriesWithType]);
      } catch (error) {
        console.error('Error fetching screen content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEntryClick = (entry) => {
    const category = entry.type === 'series' ? 'series' : 'movies';
    navigate(`/library/${category}/${entry._id || entry.id}`);
  };

  const filteredAndSortedEntries = () => {
    let filtered = entries;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(query)
      );
    }

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(entry => entry.type === filter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered = [...filtered].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        break;
      case 'rating':
        filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'title':
        filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    return filtered;
  };

  const getStats = () => {
    const stats = {
      total: entries.length,
      movies: entries.filter(e => e.type === 'movie').length,
      series: entries.filter(e => e.type === 'series').length,
      averageRating: entries.filter(e => e.rating).reduce((sum, e) => sum + parseFloat(e.rating), 0) / entries.filter(e => e.rating).length || 0
    };
    return stats;
  };

  const stats = getStats();
  const displayedEntries = filteredAndSortedEntries();

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '3rem' }}>
        <div className="loading-state">
          <div className="loading-spinner">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Loading screens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '3rem' }}>
      <div className="blog-layout">
        <aside className="blog-sidebar">
          <div className="sidebar-widget">
            <h3 className="widget-title">Library Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.movies}</span>
                <span className="stat-label">Movies</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.series}</span>
                <span className="stat-label">Series</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.averageRating.toFixed(1)}</span>
                <span className="stat-label">Avg Rating</span>
              </div>
            </div>
          </div>

          <div className="sidebar-widget">
            <h3 className="widget-title">Filter</h3>
            <div className="category-list">
              {['all', 'movie', 'series'].map(type => (
                <button
                  key={type}
                  className={`category-pill ${filter === type ? 'active' : ''}`}
                  onClick={() => setFilter(type)}
                  style={{ textTransform: 'capitalize', width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
                >
                  {type === 'all' ? 'All Content' : type === 'movie' ? 'Movies' : 'TV Series'}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-widget">
            <h3 className="widget-title">Sort By</h3>
            <select 
              className="modern-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recent">Recently Added</option>
              <option value="rating">Highest Rated</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </aside>

        <main className="blog-main">
          <div 
            className="post hero-section"
            style={{ marginBottom: '2rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <h2 className="page-title" style={{ margin: 0, border: 'none' }}>Screen Collection</h2>
            </div>
            <p className="page-meta">{stats.total} TITLES · {stats.movies} MOVIES · {stats.series} SERIES</p>
            <p className="post-content" style={{ marginTop: '0.5rem' }}>
              Movies and TV series that left an impact. My reviews and thoughts on what's worth watching.
            </p>
            
            <div style={{ marginTop: '1.5rem' }}>
              <input
                type="text"
                className="game-search-input"
                placeholder="Search movies & series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {displayedEntries.length === 0 ? (
            <div className="blog-card-empty">
              <p>No screen entries found matching your criteria.</p>
            </div>
          ) : (
            <div className="list-rows">
              {displayedEntries.map((entry) => {
                const dateLabel = entry?.date ? new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
                return (
                  <div 
                    key={entry._id || entry.id} 
                    className="list-row"
                    onClick={() => handleEntryClick(entry)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleEntryClick(entry); }}
                  >
                    <div>
                      <div className="list-row-title">{entry.title}</div>
                      <div className="list-row-meta">
                        <span className="meta-item" style={{ textTransform: 'uppercase' }}>
                          {entry.type}
                        </span>
                        {entry.rating && (
                          <span className="meta-item" style={{ textTransform: 'uppercase' }}>
                            RATED {entry.rating}/5
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="list-row-right">
                      {dateLabel && <span className="date">{dateLabel}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}