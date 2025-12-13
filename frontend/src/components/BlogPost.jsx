import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchBlogs } from '../services/api';

import { ArrowLeft, Calendar, Tag, Share2 } from 'lucide-react';
import './BlogPost.css';
import DOMPurify from 'dompurify';

export default function BlogPost() {
  const { id: paramId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        console.error('Error fetching blog post:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, location.pathname]);

  if (loading) {
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
          <p>Loading thought...</p>
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
          <button onClick={() => navigate('/blogs')} className="back-button">
            <ArrowLeft size={16} /> Back to blogs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="blog-post-container"
    >
      <button onClick={() => navigate('/blogs')} className="back-link">
        <ArrowLeft size={16} /> Back to blogs
      </button>

      <article className="blog-post-content">
        <header className="blog-post-header">
          <h1 className="blog-post-title">{post.title}</h1>
          
          <div className="blog-post-meta">
            <div className="meta-item">
              <span>{new Date(post.date).toLocaleDateString(undefined, { dateStyle: 'long' }).toUpperCase()}</span>
            </div>
            {post.category && (
              <div className="meta-item">
                <span>{post.category.toUpperCase()}</span>
              </div>
            )}
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
              <Share2 size={16} /> Copy Link
            </button>
          </div>
        </footer>
      </article>
    </div>
  );
}
