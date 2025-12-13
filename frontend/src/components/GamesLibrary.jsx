import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLogs } from '../services/api';
import '../styles/modern.css';

export default function GamesLibrary() {
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
        const games = await fetchLogs('games');
        setEntries(games);
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEntryClick = (entry) => {
    navigate(`/library/games/${entry._id || entry.id}`);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'var(--color-success)';
      case 'playing': return 'var(--color-accent)';
      case 'dropped': return 'var(--color-error)';
      case 'on-hold': return 'var(--color-warning)';
      case 'wishlist': return 'var(--color-secondary)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getStatusIcon = () => null;

  const filteredAndSortedEntries = () => {
    let filtered = entries;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(query) || 
        (entry.platform && entry.platform.toLowerCase().includes(query))
      );
    }

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(entry => entry.status?.toLowerCase() === filter);
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
      completed: entries.filter(e => e.status?.toLowerCase() === 'completed').length,
      playing: entries.filter(e => e.status?.toLowerCase() === 'playing').length,
      dropped: entries.filter(e => e.status?.toLowerCase() === 'dropped').length,
      averageRating: entries.filter(e => e.rating).reduce((sum, e) => sum + parseFloat(e.rating), 0) / entries.filter(e => e.rating).length || 0
    };
    return stats;
  };

  const stats = getStats();
  const displayedEntries = filteredAndSortedEntries();
  const statuses = ['all', 'completed', 'playing', 'dropped', 'on-hold', 'wishlist'];

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
          <p>Loading games...</p>
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
                <span className="stat-value">{stats.completed}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.playing}</span>
                <span className="stat-label">Playing</span>
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
              {statuses.map((status) => (
                <button
                  key={status}
                  className={`category-pill ${filter === status ? 'active' : ''}`}
                  onClick={() => setFilter(status)}
                  style={{ textTransform: 'capitalize', width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
                >
                  {status === 'all' ? 'All Games' : status.replace('-', ' ')}
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
              <h2 className="page-title" style={{ margin: 0, border: 'none' }}>Games Collection</h2>
            </div>
            <p className="page-meta">{stats.total} GAMES · {stats.completed} COMPLETED · {stats.playing} IN PROGRESS</p>
            <p className="post-content" style={{ marginTop: '0.5rem' }}>
              Tracking my gaming journey. From 100% completions to casual sessions.
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="text"
                className="game-search-input"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="back-link" style={{ margin: 0 }} onClick={() => setSearchQuery('')}>Clear</button>
            </div>
          </div>

          {displayedEntries.length === 0 ? (
            <div className="blog-card-empty">
              <Gamepad2 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No games found matching your criteria.</p>
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
                        {entry.platform && (
                          <span className="meta-tag">{entry.platform.toUpperCase()}</span>
                        )}
                        {entry.status && (
                          <span className="meta-detail">{entry.status.toUpperCase().replace('-', ' ')}</span>
                        )}
                        {entry.rating && (
                          <span className="meta-detail">{entry.rating}/10</span>
                        )}
                        {dateLabel && <span className="meta-detail">{dateLabel}</span>}
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