import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/modern.css';
import { fetchNotes } from '../services/api';

export default function NotesPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchNotes({ sortBy: 'created_at', order: 'desc' });
        setNotes(Array.isArray(data) ? data : []);
      } catch {
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const groups = useMemo(() => {
    const map = new Map();
    for (const n of (Array.isArray(notes) ? notes : [])) {
      const dateValue = n?.created_at || n?.date;
      const year = dateValue ? new Date(dateValue).getFullYear() : '—';
      const key = String(year);
      const arr = map.get(key) || [];
      arr.push(n);
      map.set(key, arr);
    }

    return Array.from(map.entries())
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([year, items]) => ({
        year,
        items: items.sort((a, b) => {
          const ad = a?.created_at || a?.date || 0;
          const bd = b?.created_at || b?.date || 0;
          return new Date(bd) - new Date(ad);
        })
      }));
  }, [notes]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notes</h1>
          <p className="page-meta">A place for thoughts to land.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="loading-text">loading notes...</p>
        </div>
      ) : (
        <div className="list-stack">
          {groups.map((g) => (
            <section key={g.year} className="list-section">
              <div className="list-section-header">
                <h3 className="list-section-title">{g.year}</h3>
                <span className="meta-small">{g.items.length} {g.items.length === 1 ? 'note' : 'notes'}</span>
              </div>

              <div className="library-entries">
                {g.items.map((n) => {
                  const dateValue = n?.created_at || n?.date;
                  const dateLabel = dateValue ? new Date(dateValue).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
                  const id = n?._id || n?.id;
                  return (
                    <button
                      key={id || n.title}
                      type="button"
                      className="library-entry blog-entry"
                      onClick={() => navigate(`/notes/${id}`)}
                    >
                      <span className="library-entry-date">{dateLabel}</span>
                      <span>
                        <div className="library-entry-title">{n.title}</div>
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
