import { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { fetchViewCount } from '../services/views';
import { Heart } from 'lucide-react';
import { getStoredAuthToken, hasSeenAuthDisclaimer, markAuthDisclaimerSeen, startGoogleLogin } from '../services/auth';
import CommentsSection from './CommentsSection';
import AuthRequiredModal from './AuthRequiredModal';
import '../styles/components/BlogPost.css';

export default function NoteDetail() {
  const { id: paramId } = useParams();
  const location = useLocation();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [error, setError] = useState(null);
  const [views, setViews] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const id = paramId || location.pathname.replace('/wander/', '').replace('/notes/', '');

  useEffect(() => {
    setLoading(true);
    setError(null);
    setNote(null);

    if (!id) {
      setError('Invalid note ID');
      setLoading(false);
      return;
    }

    const fetchNote = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        const res = await fetch(`${apiUrl}/notes/${id}`);
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Note not found' : 'Failed to fetch note');
        }
        const result = await res.json();
        // Backend returns {success: true, data: {...}}
        const noteData = result.data || result;
        setNote(noteData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id, location.pathname]);

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
        // Note: Using blog likes API for now - backend may need note-specific endpoint
        // For now, we'll use the blog endpoint structure as a placeholder
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        const res = await fetch(`${apiUrl}/notes/${id}/likes`, {
          headers: { ...(getStoredAuthToken() ? { Authorization: `Bearer ${getStoredAuthToken()}` } : {}) }
        });
        if (res.ok) {
          const data = await res.json();
          setLikeCount(Number(data?.count || 0));
          setLiked(!!data?.liked);
        }
      } catch {
        // Backend may not support note likes yet, so we'll just keep defaults
      }
    };

    if (!id) return;
    loadLikes();
  }, [id]);

  const onToggleLike = async () => {
    const token = getStoredAuthToken();
    if (!token) {
      setAuthModalOpen(true);
      return;
    }
    try {
      // Note: Using blog likes API structure - backend may need note-specific endpoint
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${apiUrl}/notes/${id}/likes/toggle`, {
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
      <div className="blog-post-container">
        <div className="loading-state">
          <div className="loading-spinner">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Loading note...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-post-container">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const created = note?.created_at ? new Date(note.created_at) : null;
  const edition = note?.edition;
  const editionClass = edition ? `edition-${edition}` : '';

  // Extract and inject style tags and execute script tags from special edition content
  useEffect(() => {
    if (!edition || !note?.content) {
      const existingStyle = document.getElementById('special-edition-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(note.content, 'text/html');
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
  }, [edition, note?.content]);

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

  return (
    <div className={`blog-post-container ${editionClass}`} style={{ minHeight: '60vh' }}>
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
      <article className="blog-post-content">
        <header className="blog-post-header">
          <h1 className="blog-post-title">{note?.title}</h1>
          <div className="blog-post-meta">
            {created ? (
              <div className="meta-item">
                <span>{created.toLocaleDateString(undefined, { dateStyle: 'long' }).toUpperCase()}</span>
              </div>
            ) : null}
            {typeof views === 'number' ? (
              <div className="meta-item">
                <span>{String(views).toUpperCase()} VIEWS</span>
              </div>
            ) : null}

            <button
              type="button"
              className={`like-button like-button--inline ${liked ? 'liked' : ''}`}
              onClick={onToggleLike}
              aria-label="Like this post"
            >
              <Heart size={14} fill={liked ? '#ff2d55' : 'none'} color={liked ? '#ff2d55' : 'currentColor'} />
              <span>{likeCount}</span>
            </button>
          </div>
        </header>

        {note?.content ? (
          <div
            className={`blog-post-body ${edition ? 'blog-post-body--special-edition' : ''}`}
            dangerouslySetInnerHTML={{
              __html: edition
                ? DOMPurify.sanitize(note.content || '', {
                    ADD_TAGS: ['style', 'script', 'article', 'header', 'footer', 'section', 'div'],
                    ADD_ATTR: ['style', 'class', 'onclick', 'id'],
                    ALLOW_DATA_ATTR: true,
                    KEEP_CONTENT: true,
                    FORBID_TAGS: [],
                    FORBID_ATTR: []
                  })
                : DOMPurify.sanitize(note.content || '')
            }}
          />
        ) : null}

        <footer className="blog-post-footer">
          <div className="share-section">
            <span>Share this thought:</span>
            <div className="share-buttons">
              <button
                className="share-button"
                onClick={() => {
                  const url = window.location.href;
                  const text = note?.title || 'Check this out';
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

        <CommentsSection blogId={Number(id)} />
      </article>
    </div>
  );
}
