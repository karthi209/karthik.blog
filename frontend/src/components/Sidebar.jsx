import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { clearStoredAuthToken, getStoredAuthToken, getUserAlias, isAdminUser, hasSeenAuthDisclaimer, markAuthDisclaimerSeen, startGoogleLogin } from '../services/auth';
import AuthRequiredModal from './AuthRequiredModal';

export default function Sidebar() {
  const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
  const rssHref = `${apiBase}/rss.xml`;
  const token = getStoredAuthToken();
  const alias = getUserAlias();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const menuRef = useRef(null);

  const onLogin = () => {
    console.log('[SIDEBAR] Login button clicked', { 
      currentPath: window.location.pathname,
      currentUrl: window.location.href,
      userAgent: navigator.userAgent
    });
    startGoogleLogin(window.location.pathname || '/');
  };

  const onLogout = () => {
    clearStoredAuthToken();
    window.location.href = '/';
  };

  useEffect(() => {
    const onDocClick = (e) => {
      const el = menuRef.current;
      if (!el) return;
      if (!el.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <aside className="home-sidebar">
      <AuthRequiredModal
        open={loginModalOpen}
        title="Login"
        message="Login is only required to interact (like/comment). Reading is always open."
        showFirstTimeDisclaimer={!hasSeenAuthDisclaimer()}
        onClose={() => setLoginModalOpen(false)}
        onLogin={() => {
          if (!hasSeenAuthDisclaimer()) markAuthDisclaimerSeen();
          startGoogleLogin(window.location.pathname || '/');
        }}
      />
      <div className="sidebar-widget">
        <Link to="/" className="sidebar-brand">
          <h2 className="brand-name">KARTHIK.BLOG</h2>
        </Link>
        <div className="sidebar-color-stripe" aria-hidden="true"></div>
      </div>

      <div className="sidebar-widget">
        <nav className="sidebar-nav">
          <Link className="sidebar-link" to="/blogs">Writings</Link>
          <Link className="sidebar-link" to="/notes">Notes</Link>
          <Link className="sidebar-link" to="/projects">Projects</Link>
          <Link className="sidebar-link" to="/library">Library</Link>
        </nav>
      </div>

      <div className="sidebar-widget">
        <h3 className="widget-title">Connect</h3>
        <nav className="sidebar-nav">
          <a className="sidebar-link" href="https://x.com/karthi9003" target="_blank" rel="noreferrer">Twitter/X</a>
          <a className="sidebar-link" href={`${apiBase}/rss.xml`}>RSS feed</a>
          <a
            className="sidebar-link"
            href="mailto:karthikeyan14june@gmail.com"
            target="_blank"
            rel="noreferrer"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            Email Me
          </a>
        </nav>
      </div>

      <div className="sidebar-widget">
        <div className="sidebar-bottom-row">
          <div className="sidebar-account" ref={menuRef}>
            <button
              type="button"
              className="sidebar-link sidebar-account-trigger"
              onClick={() => {
                if (!token) return setLoginModalOpen(true);
                setMenuOpen(v => !v);
              }}
              aria-haspopup="menu"
              aria-expanded={menuOpen ? 'true' : 'false'}
            >
              {token ? alias : 'Login'}
            </button>

            {token && menuOpen ? (
              <div className="sidebar-account-menu" role="menu">
                {isAdminUser() ? (
                  <Link className="sidebar-account-item" to="/admin" onClick={() => setMenuOpen(false)}>
                    Admin
                  </Link>
                ) : null}
                <button type="button" className="sidebar-account-item" onClick={onLogout}>
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
