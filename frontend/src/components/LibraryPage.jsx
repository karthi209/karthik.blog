import { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchLogs } from '../services/api';

export default function LibraryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get('type') || 'all');
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [allItems, setAllItems] = useState([]);

  const FILTERS = useMemo(() => (
    [
      { key: 'all', label: 'All' },
      { key: 'movies', label: 'Movies' },
      { key: 'tv', label: 'TV' },
      { key: 'music', label: 'Albums' },
      { key: 'books', label: 'Books' },
      { key: 'games', label: 'Games' }
    ]
  ), []);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        
        // Fetch all types in parallel
        const [playlists, games, movies, series, books] = await Promise.all([
          fetch(`${apiUrl}/playlists`).then(r => r.json()).catch(() => []),
          fetchLogs('games').catch(() => []),
          fetchLogs('movies').catch(() => []),
          fetchLogs('series').catch(() => []),
          fetchLogs('books').catch(() => [])
        ]);

        // Normalize and combine all items
        const items = [
          ...playlists.map(p => ({
            id: `album-${p.id}`,
            type: 'music',
            title: p.name,
            description: p.description,
            date: p.created_at,
            onClick: () => navigate(`/library/music/${p.id}`)
          })),
          ...games.map(g => ({
            id: `game-${g._id || g.id}`,
            type: 'games',
            title: g.title,
            description: g.thoughts || g.review,
            date: g.date || g.createdAt,
            onClick: () => navigate(`/library/games/${g._id || g.id}`)
          })),
          ...movies.map(s => ({
            id: `movie-${s._id || s.id}`,
            type: 'movies',
            title: s.title,
            description: s.thoughts || s.review,
            date: s.date || s.createdAt,
            onClick: () => navigate(`/library/movies/${s._id || s.id}`)
          })),
          ...series.map(s => ({
            id: `series-${s._id || s.id}`,
            type: 'tv',
            title: s.title,
            description: s.thoughts || s.review,
            date: s.date || s.createdAt,
            onClick: () => navigate(`/library/series/${s._id || s.id}`)
          })),
          ...books.map(b => ({
            id: `book-${b._id || b.id}`,
            type: 'books',
            title: b.title,
            description: b.thoughts || b.review,
            date: b.date || b.createdAt,
            onClick: () => navigate(`/library/books/${b._id || b.id}`)
          }))
        ];

        // Sort by date (most recent first)
        items.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setAllItems(items);
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
    const t = setTimeout(() => setShowLoader(true), 1200);
    return () => clearTimeout(t);
  }, [loading]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    if (newFilter === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ type: newFilter });
    }
  };

  const filteredItems = useMemo(() => {
    if (filter === 'all') return allItems;
    return allItems.filter(item => item.type === filter);
  }, [allItems, filter]);

  const counts = useMemo(() => {
    const by = FILTERS.reduce((acc, f) => {
      acc[f.key] = 0;
      return acc;
    }, {});

    by.all = allItems.length;
    for (const item of allItems) {
      if (by[item.type] !== undefined) by[item.type] += 1;
    }
    return by;
  }, [FILTERS, allItems]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const item of filteredItems) {
      const year = item?.date ? new Date(item.date).getFullYear() : '—';
      const key = String(year);
      const arr = map.get(key) || [];
      arr.push(item);
      map.set(key, arr);
    }

    // Keep years sorted desc, entries already sorted desc globally
    return Array.from(map.entries())
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([year, items]) => ({ year, items }));
  }, [filteredItems]);

  if (loading) {
    return (
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
    );
  }

  return (
    <>
      <div className="post hero-section">
        <h2 className="page-title">Library</h2>
        <p className="page-meta">A small log of things I watched, played, listened to, and read.</p>
      </div>

      <div className="library-filters">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleFilterChange(key)}
            className={`library-filter ${filter === key ? 'is-active' : ''}`}
          >
            {label}{counts[key] ? ` (${counts[key]})` : ''}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="post">
          <p className="page-meta">Nothing here yet.</p>
        </div>
      ) : (
        <div className="library-timeline">
          {groups.map(group => (
            <section key={group.year} className="library-year">
              <div className="library-year-header">
                <h3 className="library-year-title">{group.year}</h3>
                <span className="library-year-count">{group.items.length} entries</span>
              </div>

              <div className="library-entries">
                {group.items.map(item => {
                  const dateLabel = item?.date
                    ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '—';
                  const impact = item?.description
                    ? item.description.replace(/\s+/g, ' ').trim()
                    : '';
                  const impactShort = impact.length > 140 ? `${impact.slice(0, 140)}…` : impact;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="library-entry"
                      onClick={item.onClick}
                    >
                      <span className="library-entry-date">{dateLabel}</span>
                      <span>
                        <div className="library-entry-title">{item.title}</div>
                        <div className="library-entry-meta">
                          <span className="library-entry-tag">{item.type}</span>
                          {impactShort ? (
                            <span className="library-entry-impact">{impactShort}</span>
                          ) : null}
                        </div>
                      </span>
                    </button>
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
