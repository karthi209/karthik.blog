import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { fetchBlogs } from '../services/api';
import { fetchViewCount } from '../services/views';
import CommentsSection from './CommentsSection';
import './BlogPost.css';
import DOMPurify from 'dompurify';
import { Heart } from 'lucide-react';
import { getStoredAuthToken, hasSeenAuthDisclaimer, markAuthDisclaimerSeen, startGoogleLogin } from '../services/auth';
import { fetchBlogLikes, toggleBlogLike } from '../services/comments';
import BlogToc from './BlogToc';
import AuthRequiredModal from './AuthRequiredModal';

export default function BlogPost() {
  const { id: paramId } = useParams();
  const location = useLocation();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [error, setError] = useState(null);
  const [views, setViews] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // Reading progress bar - tracks scroll position
  useEffect(() => {
    const updateProgress = () => {
      const article = document.querySelector('.blog-post-body');
      if (!article) return;

      const articleTop = article.offsetTop;
      const articleHeight = article.scrollHeight;
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;

      // Calculate progress based on how much of the article is scrolled
      const start = articleTop - windowHeight * 0.2;
      const end = articleTop + articleHeight - windowHeight * 0.8;
      const progress = Math.min(100, Math.max(0, ((scrollY - start) / (end - start)) * 100));

      setReadingProgress(progress);
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress(); // Initial call

    return () => window.removeEventListener('scroll', updateProgress);
  }, [post]); // Re-run when post loads

  // Extract ID from URL pathname if not in params (fallback for catch-all routes)
  const id = paramId || location.pathname.replace('/blog/', '').replace('/blogs/', '');

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
        const data = await response.json();
        setPost(data);
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
    const t = setTimeout(() => setShowLoader(true), 1200);
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

  return (
    <div className="blog-post-container" style={{ minHeight: '60vh' }}>
      {/* Reading Progress Bar */}
      <div className="reading-progress-container">
        <div
          className="reading-progress-bar"
          style={{ width: `${readingProgress}%` }}
          role="progressbar"
          aria-valuenow={Math.round(readingProgress)}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>

      <AuthRequiredModal
        open={authModalOpen}
        title="Login required"
        message="Please login to like or comment."
        showFirstTimeDisclaimer={!hasSeenAuthDisclaimer()}
        onClose={() => setAuthModalOpen(false)}
        onLogin={() => {
          console.log('[BLOGPOST] Login button clicked', {
            currentPath: window.location.pathname,
            currentUrl: window.location.href
          });
          if (!hasSeenAuthDisclaimer()) markAuthDisclaimerSeen();
          startGoogleLogin(window.location.pathname || '/');
        }}
      />
      <div className="blog-post-layout">
        <div className="blog-post-main">
          <article className="blog-post-content">
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

            <div
              className="blog-post-body"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(post.content)
              }}
            />

            <footer className="blog-post-footer">
              <div className="share-section">
                <span>Share this thought:</span>
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
            </footer>

            <CommentsSection blogId={Number(id)} />
          </article>
        </div>

        <div className="blog-post-aside">
          <BlogToc />
        </div>
      </div>
    </div>
  );
}
