import { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { fetchBlogs, fetchHomepageData, fetchNotes } from '../services/api';
import { trackView } from '../services/views';
import { clearStoredAuthToken, getStoredAuthToken, getUserAlias, hasSeenAuthDisclaimer, isAdminUser, markAuthDisclaimerSeen, setStoredAuthToken, startGoogleLogin } from '../services/auth';
import '../styles/modern.css';
import ThemeToggle from './ThemeToggle';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

// Lazy load components
const BlogsPage = lazy(() => import('./BlogsPage'));
const NotesPage = lazy(() => import('./NotesPage'));
const LibraryPage = lazy(() => import('./LibraryPage'));
const PlaylistPage = lazy(() => import('./PlaylistPage'));
const LabPage = lazy(() => import('./LabPage'));
const BlogPost = lazy(() => import('./BlogPost'));
const NoteDetail = lazy(() => import('./NoteDetail'));
const LogDetail = lazy(() => import('./LogDetail'));
const AdminPanel = lazy(() => import('./AdminPanel'));
const Terms = lazy(() => import('../pages/Terms'));
const Privacy = lazy(() => import('../pages/Privacy'));
const Disclaimer = lazy(() => import('../pages/Disclaimer'));

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePage, setActivePage] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [entries, setEntries] = useState({
    blogs: [],
    music: [],
    games: [],
    movies: [],
    series: [],
    books: []
  });

  // Route detection
  const isBlogPostPage = location.pathname.startsWith('/blog/') || location.pathname.startsWith('/blogs/');
  const isNotePostPage = location.pathname.startsWith('/notes/') && location.pathname.split('/').length > 2;
  const isAdminPage = location.pathname.startsWith('/admin');
  const isPlaylistPage = location.pathname.match(/^\/library\/music\/\d+$/);
  const isLogDetailPage = !isPlaylistPage && location.pathname.startsWith('/library/') && location.pathname.split('/').length > 3;
  const isLegalPage = ['/terms', '/privacy', '/disclaimer'].includes(location.pathname);

  // Capture auth token returned from OAuth redirect (works for all routes)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setStoredAuthToken(token);
      params.delete('token');
      const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', next);
    }
  }, []);

  // Block /admin for non-admin users
  useEffect(() => {
    if (!isAdminPage) return;
    if (!isAdminUser()) {
      navigate('/', { replace: true });
    }
  }, [isAdminPage, navigate]);

  useEffect(() => {
    const rawPath = location.pathname || '/';
    if (rawPath.startsWith('/admin')) return;

    const shouldTrack =
      isBlogPostPage ||
      isNotePostPage ||
      isLogDetailPage ||
      isPlaylistPage;

    if (!shouldTrack) return;

    trackView(rawPath).catch(() => { });
  }, [location.pathname]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    if (isBlogPostPage || isNotePostPage || isLogDetailPage || isPlaylistPage || isAdminPage || isLegalPage) return;

    const path = location.pathname;
    if (path === '/' || path === '') setActivePage('home');
    else if (path.startsWith('/blogs')) setActivePage('blogs');
    else if (path.startsWith('/notes')) setActivePage('notes');
    else if (path.startsWith('/library')) setActivePage('library');
    else if (path.startsWith('/projects')) setActivePage('projects');
    else if (path.startsWith('/whoami')) setActivePage('whoami');
    else {
      setActivePage('home');
      if (path !== '/') navigate('/', { replace: true });
    }
  }, [location.pathname, isBlogPostPage, isNotePostPage, isLogDetailPage, isPlaylistPage, isAdminPage, isLegalPage, navigate]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [blogs, homeData, notes] = await Promise.all([
          fetchBlogs(),
          fetchHomepageData(),
          fetchNotes({ sortBy: 'created_at', order: 'desc' })
        ]);
        setEntries({
          blogs: blogs || [],
          notes: Array.isArray(notes) ? notes : [],
          ...homeData
        });
      } catch (error) {
        // Silently fail - homepage will render with empty data
      }
    };
    loadData();
  }, []);

  const renderLibraryPage = () => {
    const path = location.pathname;
    const playlistMatch = path.match(/^\/library\/music\/(\d+)$/);
    if (playlistMatch) return <PlaylistPage id={playlistMatch[1]} />;

    // Redirect old routes to unified library with filter
    if (path.includes('/library/music')) {
      navigate('/library?type=music', { replace: true });
      return null;
    }
    if (path.includes('/library/games')) {
      navigate('/library?type=games', { replace: true });
      return null;
    }
    if (path.includes('/library/screen')) {
      navigate('/library?type=screen', { replace: true });
      return null;
    }
    if (path.includes('/library/reads')) {
      navigate('/library?type=reads', { replace: true });
      return null;
    }

    return <LibraryPage />;
  };

  const navItems = [
    { id: 'blogs', label: 'Blogs', path: '/blogs' },
    { id: 'notes', label: 'Notes', path: '/notes' },
    { id: 'projects', label: 'Projects', path: '/projects' },
    { id: 'library', label: 'Library', path: '/library' },
  ];

  const token = getStoredAuthToken();
  const alias = getUserAlias();

  const onMobileLogin = () => {
    if (!hasSeenAuthDisclaimer()) markAuthDisclaimerSeen();
    setMobileMenuOpen(false);
    startGoogleLogin(window.location.pathname || '/');
  };

  const onMobileLogout = () => {
    clearStoredAuthToken();
    setMobileMenuOpen(false);
    navigate('/', { replace: true });
  };

  const renderHomePage = () => {
    const latestBlogs = (entries.blogs || []).slice(0, 5);
    const latestNotes = (entries.notes || []).slice(0, 5);

    const allLibrary = [
      ...(entries.music || []).map((i) => ({ ...i, __type: 'music' })),
      ...(entries.games || []).map((i) => ({ ...i, __type: 'games' })),
      ...(entries.movies || []).map((i) => ({ ...i, __type: 'movies' })),
      ...(entries.series || []).map((i) => ({ ...i, __type: 'series' })),
      ...(entries.books || []).map((i) => ({ ...i, __type: 'books' }))
    ];

    const latestLibrary = allLibrary
      .filter(Boolean)
      .slice()
      .sort((a, b) => new Date(b.date || b.created_at || b.createdAt || 0) - new Date(a.date || a.created_at || a.createdAt || 0))
      .slice(0, 5);

    return (
      <>
        <div className="hero-section">
          <div className="hero-header">
            <div className="hero-content">
              <h1 className="hero-title typewriter">Hey there!<span className="cursor">_</span></h1>
              <p className="hero-intro-text">
                I'm Karthik. By day, I'm a systems engineer based out of Chennai, India. By night… well, I collect hobbies like infinity stones. Mapping, embedded systems, gaming, photography, travelling, public transit, urban infrastructure, and probably five more by the time you read this.
              </p>
              <p className="hero-intro-text">
                I made this website because my brain refuses to stay in one lane, so this is where I track my projects, experiments, and whatever obsession I'm currently in.
              </p>
              <div className="hero-avatar">
                <div className="avatar-placeholder">
                  <img src="/banner.jpg" alt="Karthik" />
                </div>
              </div>
              <p className="hero-quote">
                "The world's full of stories. There's room for every one of them to be told." — <em>Blood of Elves</em>
              </p>
              <p className="hero-intro-text">
                Feel free to explore, and if you are still interested, follow me on X/Twitter <a href="https://x.com/karthi9003" target="_blank" rel="noopener noreferrer">@karthi9003</a> for more rants and updates.
              </p>
            </div>

          </div>
        </div>

        <div className="latest-section">
          <div className="section-header">
            <h2 className="section-title">Blog</h2>
          </div>
          <div className="home-list-rows">
            {latestBlogs.map((blog) => {
              const dateValue = blog?.created_at || blog?.date;
              const dateLabel = dateValue ? new Date(dateValue).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '—';
              const id = blog?._id || blog?.id;
              const path = id ? `/blogs/${id}` : '/blogs';

              return (
                <div key={id || blog.title} className="home-list-row" onClick={() => navigate(path)}>
                  <span className="home-list-date">{dateLabel}</span>
                  <div className="home-list-left">
                    <Link to={path} className="home-list-link">
                      {blog.title}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="latest-section">
          <div className="section-header">
            <h2 className="section-title">Notes</h2>
          </div>
          <div className="home-list-rows">
            {latestNotes.map((n) => {
              const dateValue = n?.created_at || n?.date;
              const dateLabel = dateValue ? new Date(dateValue).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '—';
              const id = n?._id || n?.id;
              const path = id ? `/notes/${id}` : '/notes';

              return (
                <div key={id || n.title} className="home-list-row" onClick={() => navigate(path)}>
                  <span className="home-list-date">{dateLabel}</span>
                  <div className="home-list-left">
                    <Link to={path} className="home-list-link">
                      {n.title}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="latest-section">
          <div className="section-header">
            <h2 className="section-title">Library</h2>
          </div>
          <div className="home-list-rows">
            {latestLibrary.map((item) => {
              const dateValue = item?.date || item?.created_at || item?.createdAt;
              const dateLabel = dateValue ? new Date(dateValue).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '—';
              const id = item?.log_id || item?.id;

              let path = '/library';
              if (item?.__type === 'music' && id) path = `/library/music/${id}`;
              else if (item?.__type && id) path = `/library/${item.__type}/${id}`;

              return (
                <div key={`${item.__type}-${id || item.title}`} className="home-list-row" onClick={() => navigate(path)}>
                  <span className="home-list-date">{dateLabel}</span>
                  <div className="home-list-left">
                    <Link to={path} className="home-list-link">
                      {item.title}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="app-container">
      {/* Mobile Topbar inspired by tania.dev */}
      <div className="mobile-topbar">
        <div>
          <Link to="/" className="mobile-brand">KARTHIK.BLOG</Link>
          <div className="mobile-actions">
            <ThemeToggle className="theme-toggle--mobile" iconOnly />
            <button
              className="mobile-menu-btn"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`mobile-nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => { setMobileMenuOpen(false); navigate(item.path); }}
              >
                <span>{item.label}</span>
              </button>
            ))}

            {token ? (
              <button type="button" className="mobile-nav-item" onClick={onMobileLogout}>
                <span>Logout ({alias})</span>
              </button>
            ) : (
              <button type="button" className="mobile-nav-item" onClick={onMobileLogin}>
                <span>Login</span>
              </button>
            )}

            {isAdminUser() ? (
              <button
                type="button"
                className={`mobile-nav-item ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
                onClick={() => { setMobileMenuOpen(false); navigate('/admin'); }}
              >
                <span>Admin</span>
              </button>
            ) : null}
          </div>
        </div>
      )}

      <main className="main-content">
        <Suspense fallback={
          <div className="loading-container">
            <div className="loading-spinner">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        }>
          {isAdminPage ? (
            <AdminPanel />
          ) : (
            <div className="home-layout">
              <Sidebar />
              <div className="home-main">
                {isBlogPostPage ? <BlogPost /> :
                  isNotePostPage ? <NoteDetail /> :
                    isLogDetailPage ? <LogDetail /> :
                      isLegalPage ? (
                        location.pathname === '/terms' ? <Terms /> :
                          location.pathname === '/privacy' ? <Privacy /> : <Disclaimer />
                      ) : (
                        activePage === 'home' ? renderHomePage() :
                          activePage === 'blogs' ? <BlogsPage /> :
                            activePage === 'notes' ? <NotesPage /> :
                              activePage === 'library' ? renderLibraryPage() :
                                activePage === 'projects' ? <LabPage /> :
                                  <LabPage />
                      )}
              </div>
            </div>
          )}
        </Suspense>
      </main>

      <footer className="site-footer">
        <div className="footer-simple">
          <div className="footer-left">
            <p>© Copyright {new Date().getFullYear()}, Karthik.</p>
            <p className="footer-meta">MADRAS, TN</p>
          </div>
          <div className="footer-links-simple">
            <a href="https://github.com/karthi209" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://x.com/karthi9003" target="_blank" rel="noreferrer">Twitter</a>
            <a href="mailto:karthikeyan14june@gmail.com">Email</a>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

