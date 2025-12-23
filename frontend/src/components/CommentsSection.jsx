import { useEffect, useMemo, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { aliasFromEmail, getAuthUser, getStoredAuthToken, isAdminUser, hasSeenAuthDisclaimer, markAuthDisclaimerSeen, startGoogleLogin } from '../services/auth';
import { deleteBlogComment, fetchBlogComments, postBlogComment } from '../services/comments';
import AuthRequiredModal from './AuthRequiredModal';

export default function CommentsSection({ blogId }) {
  const user = getAuthUser();
  const token = getStoredAuthToken();

  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const canPost = useMemo(() => {
    return !!token && text.trim().length > 0;
  }, [token, text]);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const cRows = await fetchBlogComments(blogId);
      setComments(Array.isArray(cRows) ? cRows : []);
    } catch (e) {
      setError(e?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!blogId) return;
    loadAll();
  }, [blogId]);

  const onSubmit = async () => {
    const content = text.trim();
    if (!token) {
      setAuthModalOpen(true);
      return;
    }
    if (!content) return;

    setError('');
    try {
      const res = await postBlogComment(blogId, content);
      const row = res?.row;
      if (row) {
        setComments(prev => [...prev, row]);
      } else {
        await loadAll();
      }
      setText('');
    } catch (e) {
      setError(e?.message || 'Failed to post comment');
    }
  };

  const onDelete = async (commentId) => {
    if (!token) return;
    try {
      await deleteBlogComment(blogId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (e) {
      setError(e?.message || 'Failed to delete');
    }
  };

  return (
    <section className="comments-section">
      <AuthRequiredModal
        open={authModalOpen}
        title="Login required"
        message="Please login to leave a comment."
        showFirstTimeDisclaimer={!hasSeenAuthDisclaimer()}
        onClose={() => setAuthModalOpen(false)}
        onLogin={() => {
          if (!hasSeenAuthDisclaimer()) markAuthDisclaimerSeen();
          startGoogleLogin(window.location.pathname || '/');
        }}
      />
      <div className="comments-header">
        <div className="comments-title">
          <MessageSquare size={16} />
          <span>Comments</span>
        </div>
      </div>

      {error ? <div className="comments-error">{error}</div> : null}

      {token ? (
        <div className="comment-form">
          <textarea
            className="comment-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Leave a thought…"
            rows={3}
          />
          <div className="comment-form-actions">
            <button type="button" className="retro-button retro-button--sm" onClick={onSubmit} disabled={!canPost}>
              Post
            </button>
          </div>
        </div>
      ) : (
        <div className="comment-form">
          <textarea
            className="comment-textarea"
            value=""
            onChange={() => {}}
            placeholder="Login to leave a comment…"
            rows={3}
            readOnly
            onClick={() => setAuthModalOpen(true)}
            onFocus={() => setAuthModalOpen(true)}
          />
          <div className="comment-form-actions">
            <button type="button" className="retro-button retro-button--sm" onClick={() => setAuthModalOpen(true)}>
              Login to comment
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="page-meta">Loading…</div>
      ) : (
        <div className="comments-list">
          {comments.length === 0 ? (
            <div className="page-meta">No comments yet.</div>
          ) : (
            comments.map((c) => {
              const canDelete = isAdminUser() || (user?.email && user.email === c.user_email);
              return (
                <div key={c.id} className="comment-row">
                  <div className="comment-meta">
                    <span className="comment-author">{aliasFromEmail(c.user_email)}</span>
                    <span className="comment-dot">·</span>
                    <span className="comment-date">{new Date(c.created_at).toLocaleString()}</span>
                    {canDelete ? (
                      <button type="button" className="comment-delete" onClick={() => onDelete(c.id)}>
                        delete
                      </button>
                    ) : null}
                  </div>
                  <div className="comment-body">{c.content}</div>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
