import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { fetchViewCount } from '../services/views';
import './BlogPost.css';

export default function NoteDetail() {
  const { id: paramId } = useParams();
  const location = useLocation();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [views, setViews] = useState(null);

  const id = paramId || location.pathname.replace('/notes/', '');

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
        const data = await res.json();
        setNote(data);
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
  const html = note?.content
    ? DOMPurify.sanitize(note.content)
    : '';

  return (
    <div className="blog-post-container" style={{ minHeight: '60vh' }}>
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
          </div>
        </header>

        {html ? (
          <div
            className="blog-post-body"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content || '') }}
          />
        ) : null}

      </article>
    </div>
  );
}
