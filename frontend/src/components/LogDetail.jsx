import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import DOMPurify from 'dompurify';
import { getStoredAuthToken, hasSeenAuthDisclaimer, markAuthDisclaimerSeen, startGoogleLogin } from '../services/auth';
import { fetchViewCount } from '../services/views';
import CommentsSection from './CommentsSection';
import AuthRequiredModal from './AuthRequiredModal';
import '../styles/modern.css';
import '../styles/components/BlogPost.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const API_BASE = API_URL.replace(/\/api\/?$/, '');

export default function LogDetail() {
  const params = useParams();
  const location = useLocation();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [error, setError] = useState(null);
  const [views, setViews] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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

  useEffect(() => {
    if (!loading) {
      setShowLoader(false);
      return;
    }
    // Only show loader after 2.5 seconds - prevents distracting flash for fast loads
    const t = setTimeout(() => setShowLoader(true), 2500);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    const loadLikes = async () => {
      try {
        // Note: Using logs likes API - backend may need log-specific endpoint
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        const res = await fetch(`${apiUrl}/logs/${category}/${id}/likes`, {
          headers: { ...(getStoredAuthToken() ? { Authorization: `Bearer ${getStoredAuthToken()}` } : {}) }
        });
        if (res.ok) {
          const data = await res.json();
          setLikeCount(Number(data?.count || 0));
          setLiked(!!data?.liked);
        }
      } catch {
        // Backend may not support log likes yet, so we'll just keep defaults
      }
    };

    if (!category || !id) return;
    loadLikes();
  }, [category, id]);

  const onToggleLike = async () => {
    const token = getStoredAuthToken();
    if (!token) {
      setAuthModalOpen(true);
      return;
    }
    try {
      // Note: Using logs likes API structure - backend may need log-specific endpoint
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${apiUrl}/logs/${category}/${id}/likes/toggle`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLikeCount(Number(data?.count || 0));
        setLiked(!!data?.liked);
      } else {
        // If endpoint doesn't exist yet, use local state as fallback
        setLiked(!liked);
        setLikeCount(prev => liked ? prev - 1 : prev + 1);
      }
    } catch {
      // Fallback to local state if API not available
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
    }
  };

  if (loading && showLoader) {
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

  const edition = log?.edition;
  const editionClass = edition ? `edition-${edition}` : '';

  // Extract and inject style tags and execute script tags from special edition content
  useEffect(() => {
    if (!edition || !log?.content) {
      const existingStyle = document.getElementById('special-edition-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(log.content, 'text/html');
    const styleTags = doc.querySelectorAll('style');
    const scriptTags = doc.querySelectorAll('script');
    
    if (styleTags.length > 0) {
      const existingStyle = document.getElementById('special-edition-styles');
      if (existingStyle) {
        existingStyle.remove();
      }

      const styleElement = document.createElement('style');
      styleElement.id = 'special-edition-styles';
      
      let combinedStyles = '';
      styleTags.forEach(tag => {
        combinedStyles += tag.textContent || tag.innerHTML;
      });
      
      styleElement.textContent = combinedStyles;
      document.head.appendChild(styleElement);
    }

    // Execute script tags (React doesn't execute scripts in dangerouslySetInnerHTML)
    // Execute after a small delay to ensure DOM elements are rendered
    if (scriptTags.length > 0) {
      setTimeout(() => {
        scriptTags.forEach(scriptTag => {
          const script = document.createElement('script');
          script.textContent = scriptTag.textContent || scriptTag.innerHTML;
          document.body.appendChild(script);
          setTimeout(() => script.remove(), 100);
        });
      }, 100);
    }

    return () => {
      const existingStyle = document.getElementById('special-edition-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [edition, log?.content]);

  // Apply edition class for special edition full-page mode
  useEffect(() => {
    if (!edition) {
      document.documentElement.className = document.documentElement.className.replace(/\bedition-\w+/g, '').trim();
      document.body.className = document.body.className.replace(/\bedition-\w+/g, '').trim();
      return;
    }
    document.documentElement.classList.add(`edition-${edition}`);
    document.body.classList.add(`edition-${edition}`);
    return () => {
      document.documentElement.classList.remove(`edition-${edition}`);
      document.body.classList.remove(`edition-${edition}`);
    };
  }, [edition]);

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
    <div className={`content-wrap ${editionClass}`}>
      <AuthRequiredModal
        open={authModalOpen}
        title="Login required"
        message="Please login to like or comment."
        showFirstTimeDisclaimer={!hasSeenAuthDisclaimer()}
        onClose={() => setAuthModalOpen(false)}
        onLogin={() => {
          if (!hasSeenAuthDisclaimer()) markAuthDisclaimerSeen();
          startGoogleLogin(window.location.pathname || '/');
        }}
      />
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
              {typeof views === 'number' ? (
                <span className="library-review-detail">{views} views</span>
              ) : null}
              <button
                type="button"
                className={`like-button like-button--inline ${liked ? 'liked' : ''}`}
                onClick={onToggleLike}
                aria-label="Like this review"
                style={{ marginLeft: '0.5rem' }}
              >
                <Heart size={14} fill={liked ? '#ff2d55' : 'none'} color={liked ? '#ff2d55' : 'currentColor'} />
                <span>{likeCount}</span>
              </button>
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
                <div 
                  className={`review-content ${log.edition ? 'review-content--special-edition' : ''}`}
                  dangerouslySetInnerHTML={{
                    __html: log.edition
                      ? DOMPurify.sanitize(log.content || '', {
                          ADD_TAGS: ['style', 'script', 'article', 'header', 'footer', 'section', 'div'],
                          ADD_ATTR: ['style', 'class', 'onclick', 'id'],
                          ALLOW_DATA_ATTR: true,
                          KEEP_CONTENT: true,
                          FORBID_TAGS: [],
                          FORBID_ATTR: []
                        })
                      : DOMPurify.sanitize(log.content || '')
                  }}
                />
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
            </div>

            {/* Share section */}
            <footer className="blog-post-footer" style={{ marginTop: '2rem' }}>
              <div className="share-section">
                <span>Share this review:</span>
                <div className="share-buttons">
                  <button
                    className="share-button"
                    onClick={() => {
                      const url = window.location.href;
                      const text = log.title || 'Check this out';
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                    }}
                  >
                    Share on X
                  </button>
                  <button
                    className="share-button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copied to clipboard!');
                    }}
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </footer>

            {/* Comments section */}
            <CommentsSection blogId={Number(id)} />
          </div>

        </div>
      </article>
    </div>
  );
}
