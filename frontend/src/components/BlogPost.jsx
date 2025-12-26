import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { fetchBlogs } from '../services/api';
import { fetchViewCount } from '../services/views';
import CommentsSection from './CommentsSection';
import '../styles/components/BlogPost.css';
import DOMPurify from 'dompurify';
import { Heart, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStoredAuthToken, hasSeenAuthDisclaimer, markAuthDisclaimerSeen, startGoogleLogin } from '../services/auth';
import { fetchBlogLikes, toggleBlogLike } from '../services/comments';
import AuthRequiredModal from './AuthRequiredModal';
import SpecialEditionModal from './SpecialEditionModal';

export default function BlogPost() {
  const { id: paramId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [error, setError] = useState(null);
  const [views, setViews] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [specialEditionModalOpen, setSpecialEditionModalOpen] = useState(false);

  // Extract ID from URL pathname if not in params (fallback for catch-all routes)
  const id = paramId || location.pathname.replace('/blog/', '').replace('/blogs/', '');
  
  // Check if this is a special edition full-page mode
  const searchParams = new URLSearchParams(location.search);
  const isSpecialEditionMode = searchParams.get('special-edition') === 'true';

  // Ancient symbol for the post (randomized based on ID for consistency)
  const symbols = [
    '◉', '◈', '⬢', '◐', '◑', '◓', '⊙', '⊚', '⊛', '☥', '⚶', '⚸',
    '◆', '◇', '●', '○', '■', '□', '▲', '△', '⬟', '⬠', '⬡', '◬', '⊗'
  ];
  // Use ID to deterministically pick a symbol for this post
  const postSymbol = symbols[id ? String(id).charCodeAt(0) % symbols.length : 0];

  useEffect(() => {
    // Reset state when ID changes
    setLoading(true);
    setError(null);
    setPost(null);

    // Don't fetch if ID is still undefined or empty
    if (!id) {
      setError('Invalid blog post ID');
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        // Use remote backend API URL
        let apiUrl = import.meta.env.VITE_API_URL || '/api';
        const response = await fetch(`${apiUrl}/blogs/${id}`);
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? 'Blog post not found'
              : 'Failed to fetch blog post'
          );
        }
        const result = await response.json();
        // Backend returns {success: true, data: {...}} or directly {...}
        const postData = result.data || result;
        setPost(postData);
        setError(null);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, location.pathname]);

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
    const loadLikes = async () => {
      try {
        const res = await fetchBlogLikes(Number(id));
        setLikeCount(Number(res?.count || 0));
        setLiked(!!res?.liked);
      } catch {
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
      const res = await toggleBlogLike(Number(id));
      setLikeCount(Number(res?.count || 0));
      setLiked(!!res?.liked);
    } catch {
    }
  };

  // Add copy buttons to code blocks after content loads
  useEffect(() => {
    if (!post) return;

    const timeout = setTimeout(() => {
      const codeBlocks = document.querySelectorAll('.blog-post-body pre');

      codeBlocks.forEach((pre) => {
        if (pre.querySelector('.copy-code-btn')) return;

        if (!pre.parentElement.classList.contains('code-block-wrapper')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'code-block-wrapper';
          pre.parentNode.insertBefore(wrapper, pre);
          wrapper.appendChild(pre);
        }

        const btn = document.createElement('button');
        btn.className = 'copy-code-btn';
        btn.textContent = 'Copy';
        btn.addEventListener('click', () => {
          const code = pre.querySelector('code')?.textContent || pre.textContent;
          navigator.clipboard.writeText(code).then(() => {
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
          });
        });

        pre.parentElement.appendChild(btn);
      });
    }, 100);

    return () => clearTimeout(timeout);
  }, [post]);

  useEffect(() => {
    if (!post) return;

    const container = document.querySelector('.blog-post-body');
    if (!container) return;

    const normalizeImg = (img) => {
      if (!img || img.tagName !== 'IMG') return;
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
      img.style.display = 'block';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
    };

    container.querySelectorAll('img').forEach(normalizeImg);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node?.nodeType !== 1) return;
          if (node.tagName === 'IMG') {
            normalizeImg(node);
            return;
          }
          node.querySelectorAll?.('img')?.forEach(normalizeImg);
        });
      });
    });

    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [post?.content]);

  // Apply edition class if blog has an edition
  const edition = post?.edition;
  const editionClass = edition ? `edition-${edition}` : '';

  // Show special edition modal if post has edition but URL doesn't have special-edition parameter
  useEffect(() => {
    if (post && edition && !isSpecialEditionMode && !loading) {
      // Show modal when post loads and it's a special edition but not in special edition mode
      setSpecialEditionModalOpen(true);
    }
  }, [post, edition, isSpecialEditionMode, loading]);

  // Extract and inject style tags from special edition content into document head
  // Also extract and execute script tags (React doesn't execute scripts in dangerouslySetInnerHTML)
  useEffect(() => {
    if (!edition || !post?.content) {
      // Clean up any previously injected styles
      const existingStyle = document.getElementById('special-edition-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
      return;
    }

    // Extract style and script tags from content
    const parser = new DOMParser();
    const doc = parser.parseFromString(post.content, 'text/html');
    const styleTags = doc.querySelectorAll('style');
    const scriptTags = doc.querySelectorAll('script');
    
    if (styleTags.length > 0) {
      // Remove any existing special edition styles
      const existingStyle = document.getElementById('special-edition-styles');
      if (existingStyle) {
        existingStyle.remove();
      }

      // Create a new style element in the head
      const styleElement = document.createElement('style');
      styleElement.id = 'special-edition-styles';
      
      // Combine all style tag contents
      let combinedStyles = '';
      styleTags.forEach(tag => {
        combinedStyles += tag.textContent || tag.innerHTML;
      });
      
      styleElement.textContent = combinedStyles;
      document.head.appendChild(styleElement);
    }

    // Execute script tags (React doesn't execute scripts in dangerouslySetInnerHTML)
    // Execute after DOM is rendered to ensure elements with onclick handlers exist
    if (scriptTags.length > 0) {
      const executeScripts = () => {
        scriptTags.forEach(scriptTag => {
          const script = document.createElement('script');
          script.textContent = scriptTag.textContent || scriptTag.innerHTML;
          // Execute in global scope - functions will be available for onclick handlers
          document.body.appendChild(script);
          // Remove after execution to avoid duplicates
          setTimeout(() => {
            if (script.parentNode) {
              script.remove();
            }
          }, 100);
        });
      };

      // Wait for the content container to be in the DOM
      const container = document.querySelector('.blog-post-body--special-edition');
      if (container) {
        // Use MutationObserver to detect when content is added
        const observer = new MutationObserver((mutations, obs) => {
          // Check if article.special-edition exists in the container
          const article = container.querySelector('article.special-edition');
          if (article) {
            obs.disconnect();
            // Execute scripts after content is confirmed to be in DOM
            setTimeout(executeScripts, 50);
          }
        });
        
        observer.observe(container, { childList: true, subtree: true });
        
        // Fallback: execute after a delay even if observer doesn't fire
        setTimeout(() => {
          observer.disconnect();
          executeScripts();
        }, 500);
      } else {
        // Fallback if container not found
        setTimeout(executeScripts, 200);
      }
    }

    return () => {
      // Clean up on unmount or when edition changes
      const existingStyle = document.getElementById('special-edition-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [edition, post?.content]);

  // Apply edition class for special edition full-page mode
  // All styling is now handled inline in the HTML content
  useEffect(() => {
    if (!edition) {
      // Remove all edition classes from html and body
      document.documentElement.className = document.documentElement.className.replace(/\bedition-\w+/g, '').trim();
      document.body.className = document.body.className.replace(/\bedition-\w+/g, '').trim();
      return;
    }

    // Apply edition class to html and body for full-page theming
    document.documentElement.classList.add(`edition-${edition}`);
    document.body.classList.add(`edition-${edition}`);

    return () => {
      // Remove edition class from html and body
      document.documentElement.classList.remove(`edition-${edition}`);
      document.body.classList.remove(`edition-${edition}`);
    };
  }, [edition]);

  // Apply full-page class to body when in special edition mode
  // This must be before any early returns to follow Rules of Hooks
  useEffect(() => {
    if (isSpecialEditionMode && edition) {
      document.body.classList.add('special-edition-fullpage');
    } else {
      document.body.classList.remove('special-edition-fullpage');
    }
    return () => {
      document.body.classList.remove('special-edition-fullpage');
    };
  }, [isSpecialEditionMode, edition]);

  if (loading) {
    return (
      <div className="blog-post-container">
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
              <p className="loading-text">Loading thought...</p>
            </>
          ) : null}
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

  const handleCloseFullPage = () => {
    navigate('/blogs');
  };

  const handleSpecialEditionProceed = () => {
    // Add special-edition parameter to URL
    const newUrl = `${location.pathname}?special-edition=true`;
    navigate(newUrl, { replace: true });
    setSpecialEditionModalOpen(false);
  };

  const handleSpecialEditionCancel = () => {
    setSpecialEditionModalOpen(false);
  };

  const getEditionName = (edition) => {
    const names = {
      'victorian': 'Victorian',
      'gothic': 'Gothic',
      'medieval': 'Medieval'
    };
    return names[edition?.toLowerCase()] || edition || 'Special';
  };

  return (
    <div className={`blog-post-container ${editionClass} ${isSpecialEditionMode ? 'blog-post-container--fullpage' : ''}`} style={{ minHeight: '60vh' }}>
      {isSpecialEditionMode && (
        <button 
          className="special-edition-close-btn"
          onClick={handleCloseFullPage}
          aria-label="Close and return to blog list"
        >
          <X size={24} />
          <span>Close</span>
        </button>
      )}

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
      <SpecialEditionModal
        open={specialEditionModalOpen}
        onClose={handleSpecialEditionCancel}
        onProceed={handleSpecialEditionProceed}
        editionName={getEditionName(edition)}
      />
      <div className="blog-post-layout">
        <div className="blog-post-main">
          <article className={`blog-post-content ${editionClass}`}>
            {!isSpecialEditionMode && (
              <header className="blog-post-header">
                <h1 className="blog-post-title">{post.title}</h1>

                <div className="blog-post-meta">
                  <div className="meta-item">
                    <span>{new Date(post.created_at).toLocaleDateString(undefined, { dateStyle: 'long' }).toUpperCase()}</span>
                  </div>
                  {post.category && (
                    <div className="meta-item">
                      <span>{post.category.toUpperCase()}</span>
                    </div>
                  )}
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
            )}

            {post.content ? (
              <div
                className={`blog-post-body ${edition ? 'blog-post-body--special-edition' : ''}`}
                dangerouslySetInnerHTML={{
                  __html: edition 
                    ? DOMPurify.sanitize(post.content || '', {
                        // For special editions, allow style tags, script tags, and inline styles
                        // This enables full HTML/CSS/JS control for interactive posts
                        ADD_TAGS: ['style', 'script', 'article', 'header', 'footer', 'section', 'div'],
                        ADD_ATTR: ['style', 'class', 'onclick', 'id'],
                        ALLOW_DATA_ATTR: true,
                        KEEP_CONTENT: true,
                        // Ensure style and script tags are preserved
                        FORBID_TAGS: [],
                        FORBID_ATTR: []
                      })
                    : DOMPurify.sanitize(post.content || '')
                }}
              />
            ) : (
              <div className="blog-post-body">
                <p>Content not available.</p>
              </div>
            )}

            {!isSpecialEditionMode && (
              <footer className="blog-post-footer">
                <div className="share-section">
                  <span>Share this thought:</span>
                  <div className="share-buttons">
                    <button
                      className="share-button"
                      onClick={() => {
                        const url = window.location.href;
                        const text = post.title || 'Check this out';
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
            )}

            {!isSpecialEditionMode && <CommentsSection blogId={Number(id)} />}
          </article>
        </div>

      </div>
    </div>
  );
}
