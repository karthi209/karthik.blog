import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';

import '../styles/modern.css';
import { fetchViewCount } from '../services/views';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const API_BASE = API_URL.replace(/\/api\/?$/, '');

export default function LogDetail() {
  const params = useParams();
  const location = useLocation();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [views, setViews] = useState(null);

  // Derive category and id from params or fallback to pathname parsing
  const { category: paramCategory, id: paramId } = params || {};
  let category = paramCategory;
  let id = paramId;

  if (!category || !id) {
    const parts = location.pathname.split('/').filter(Boolean); // e.g., ['', 'library', 'music', '123'] -> ['library','music','123']
    if (parts[0] === 'library' && parts.length >= 3) {
      category = parts[1];
      id = parts[2];
    }
  }

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

  const getCategoryLabel = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'games': return 'Games';
      case 'movies': return 'Movies';
      case 'series': return 'TV';
      case 'books': return 'Books';
      default:
        return cat ? String(cat) : 'Library';
    }
  };

  useEffect(() => {
    const fetchLog = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        const response = await fetch(`${apiUrl}/logs/${category}/${id}`);

        if (!response.ok) {
          throw new Error('Log not found');
        }

        const data = await response.json();
        setLog(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (category && id) {
      fetchLog();
    }
  }, [category, id]);

  useEffect(() => {
    const loadViews = async () => {
      try {
        const res = await fetchViewCount(location.pathname);
        setViews(typeof res?.count === 'number' ? res.count : Number(res?.count || 0));
      } catch {
        setViews(null);
      }
    };

    loadViews();
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p>Loading entry...</p>
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="content-wrap">
        <div className="post">
          <h2 className="post-title">Entry Not Found</h2>
          <div className="post-content">
            <p>Sorry, this entry doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrap">
      <article className="library-review">
        <div className="library-review-layout">
          {/* Left: Content */}
          <div className={`library-review-main ${!log.image ? 'library-review-main--full' : ''}`}>
            <div className="library-review-kicker">
              <span>{getCategoryLabel(log.category)}</span>
              {log.release_year ? <span>{log.release_year}</span> : null}
            </div>

            <h1 className="library-review-title">{log.title}</h1>

            {/* Metadata row */}
            <div className="library-review-meta">
              {log.rating ? (
                <span className="library-review-rating">
                  <span className="rating-value">{log.rating}</span>
                  <span className="rating-max">/10</span>
                </span>
              ) : null}
              {log.director ? <span className="library-review-detail">{log.director}</span> : null}
              {log.developer ? <span className="library-review-detail">{log.developer}</span> : null}
              {log.author ? <span className="library-review-detail">{log.author}</span> : null}
              {log.artist ? <span className="library-review-detail">{log.artist}</span> : null}
              {log.platform ? <span className="library-review-detail">{log.platform}</span> : null}
              {log.genre ? <span className="library-review-detail">{log.genre}</span> : null}
              {log.hours_played ? <span className="library-review-detail">{log.hours_played}h played</span> : null}
            </div>

            {/* Poster - shows above content on all screens */}
            {log.image ? (
              <div className="library-review-poster-mobile">
                <img 
                  src={log.image.startsWith('http') ? log.image : `${API_BASE}${log.image}`} 
                  alt={log.title} 
                />
              </div>
            ) : null}

            {/* Review content */}
            <div className="library-review-body">
              {log.content ? (
                <div className="review-content" dangerouslySetInnerHTML={{ __html: log.content }} />
              ) : (
                <p className="library-review-empty">No review yet.</p>
              )}
            </div>

            {/* Footer meta */}
            <div className="library-review-footer">
              {log.created_at ? (
                <span className="library-review-date">
                  {new Date(log.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              ) : null}
              {typeof views === 'number' ? (
                <span className="library-review-views">{views} views</span>
              ) : null}
            </div>
          </div>

        </div>
      </article>
    </div>
  );
}
