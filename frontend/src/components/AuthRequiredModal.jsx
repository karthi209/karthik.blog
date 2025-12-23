import { useEffect } from 'react';

export default function AuthRequiredModal({
  open,
  title = 'Login required',
  message,
  showFirstTimeDisclaimer,
  onClose,
  onLogin,
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="retro-modal-overlay" onClick={() => onClose?.()} role="presentation">
      <div
        className="retro-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="retro-modal-title">{title}</div>

        {message ? <div className="retro-modal-text">{message}</div> : null}

        {showFirstTimeDisclaimer ? (
          <div className="retro-modal-disclaimer">
            <div className="retro-modal-disclaimer-title">First time note</div>
            <div className="retro-modal-text">
              Signing in will create an account for you. You only need to sign in when you interact (like or comment).
              Reading is always open.
            </div>
          </div>
        ) : null}

        <div className="retro-modal-actions">
          <button type="button" className="retro-button retro-button--sm" onClick={() => onClose?.()}>
            Cancel
          </button>
          <button type="button" className="retro-button retro-button--sm" onClick={() => onLogin?.()}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
