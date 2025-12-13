import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { ArrowLeft, Star, Calendar, Tag, Clock, Gamepad2, Film, Tv, Book } from 'lucide-react';
import '../styles/modern.css';

export default function LogDetail() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const getCategoryIcon = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'games': return <Gamepad2 size={16} />;
      case 'movies': return <Film size={16} />;
      case 'series': return <Tv size={16} />;
      case 'books': return <Book size={16} />;
      default: return <Tag size={16} />;
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
        console.error('Error fetching log:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (category && id) {
      fetchLog();
    }
  }, [category, id]);

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
          <p>Loading entry...</p>
        </div>
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="container" style={{ marginTop: '3rem' }}>
        <div className="post">
          <h2 className="post-title">Entry Not Found</h2>
          <div className="post-content">
            <p>Sorry, this entry doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate('/library')}
              className="modern-button primary"
              style={{ marginTop: '1rem' }}
            >
              <ArrowLeft size={16} /> Back to Library
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '3rem' }}>
      <div 
        className="log-detail-modern"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={() => navigate(-1)}
          className="back-button"
          style={{ marginBottom: '1.5rem' }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <article className="post">
          <div className="log-detail-header-grid">
            {log.image && (
              <div className="log-detail-image-container">
                <img src={log.image} alt={log.title} className="log-detail-image" />
              </div>
            )}

            <div className="log-detail-info">
              <div className="status-badge-inline" style={{ 
                color: getStatusColor(log.status),
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}>
                {log.status}
              </div>

              <h1 className="post-title" style={{ margin: '0.5rem 0 1rem 0', fontSize: '2.5rem' }}>{log.title}</h1>
              
              <div className="meta-grid">
                {log.rating && (
                  <div className="meta-item-box">
                    <span className="meta-label">Rating</span>
                    <div className="rating-display" style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Star size={16} fill="currentColor" />
                      <span className="rating-value">{log.rating}/5</span>
                    </div>
                  </div>
                )}
                
                {log.category && (
                  <div className="meta-item-box">
                    <span className="meta-label">Category</span>
                    <div className="meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getCategoryIcon(log.category)}
                      <span style={{ textTransform: 'capitalize' }}>{log.category}</span>
                    </div>
                  </div>
                )}
                
                {log.created_at && (
                  <div className="meta-item-box">
                    <span className="meta-label">Added</span>
                    <div className="meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} />
                      {new Date(log.created_at).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {log.platform && (
                  <div className="meta-item-box">
                    <span className="meta-label">Platform</span>
                    <div className="meta-value">
                      {log.platform}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {log.content && (
            <div className="post-content" style={{ marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Review & Notes</h3>
              <div dangerouslySetInnerHTML={{ __html: log.content }} />
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
