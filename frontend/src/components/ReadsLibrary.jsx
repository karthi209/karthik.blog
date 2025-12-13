import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, BookOpen, Star, Filter, SortAsc, Search } from 'lucide-react';
import { fetchLogs } from '../services/api';
import '../styles/modern.css';

export default function ReadsLibrary() {
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
        const books = await fetchLogs('books');
        setEntries(books);
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEntryClick = (entry) => {
    navigate(`/library/books/${entry._id || entry.id}`);
  };

  const filteredAndSortedEntries = () => {
    let filtered = entries;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(query) || 
        (entry.author && entry.author.toLowerCase().includes(query))
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
      read: entries.filter(e => e.status?.toLowerCase() === 'read').length,
      reading: entries.filter(e => e.status?.toLowerCase() === 'reading').length,
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
          <p>Loading books...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '3rem' }}>
      <div className="blog-layout">
        <aside className="blog-sidebar">
          <div className="sidebar-widget">
            <h3 className="widget-title">
              <BookOpen size={18} />
              Library Stats
            </h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.read}</span>
                <span className="stat-label">Read</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.reading}</span>
                <span className="stat-label">Reading</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.averageRating.toFixed(1)}</span>
                <span className="stat-label">Avg Rating</span>
              </div>
            </div>
          </div>

          <div className="sidebar-widget">
            <h3 className="widget-title">
              <Filter size={18} />
              Filter
            </h3>
            <div className="category-list">
              {['all', 'reading', 'read', 'to-read', 'dropped'].map(status => (
                <button
                  key={status}
                  className={`category-pill ${filter === status ? 'active' : ''}`}
                  onClick={() => setFilter(status)}
                  style={{ textTransform: 'capitalize', width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-widget">
            <h3 className="widget-title">
              <SortAsc size={18} />
              Sort By
            </h3>
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
              <Book size={32} color="var(--color-accent)" />
              <h2 className="page-title" style={{ margin: 0, border: 'none' }}>Reading List</h2>
            </div>
            <p className="page-meta">{stats.total} BOOKS · {stats.read} READ · {stats.reading} IN PROGRESS</p>
            <p className="post-content" style={{ marginTop: '0.5rem' }}>
              Books that changed my perspective, taught me something new, or just entertained me thoroughly.
            </p>
            
            <div className="search-bar-container" style={{ marginTop: '1.5rem' }}>
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search books & authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {displayedEntries.length === 0 ? (
            <div className="blog-card-empty">
              <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No books found matching your criteria.</p>
            </div>
          ) : (
            <div className="list-rows">
              {displayedEntries.map((entry) => {
                const dateLabel = entry?.date ? new Date(entry.date).getFullYear() : '';
                return (
                  <div 
                    key={entry._id || entry.id} 
                    className="list-row book-row"
                    onClick={() => handleEntryClick(entry)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleEntryClick(entry); }}
                  >
                    <div>
                      <div className="list-row-title">{entry.title}</div>
                      <div className="list-row-meta">
                        {entry.author && (
                          <span className="meta-item">by {entry.author}</span>
                        )}
                        {entry.status && (
                          <span className="meta-item" style={{ color: 'var(--color-text-muted)' }}>
                            <Book size={12} /> {entry.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="list-row-right">
                      {entry.rating && (
                        <span className="pill">★ {entry.rating}</span>
                      )}
                      {dateLabel && (
                        <span className="date">{dateLabel}</span>
                      )}
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