import { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { fetchBlogs, fetchHomepageData, fetchNotes, fetchProjects } from '../services/api';
import { trackView } from '../services/views';
import { clearStoredAuthToken, getStoredAuthToken, getUserAlias, hasSeenAuthDisclaimer, isAdminUser, markAuthDisclaimerSeen, setStoredAuthToken, startGoogleLogin } from '../services/auth';
import '../styles/modern.css';
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
    projects: [],
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
      // Normalize pathname to handle edge cases like /// or empty paths
      let pathname = window.location.pathname || '/';
      // Remove duplicate slashes
      pathname = pathname.replace(/\/+/g, '/');
      // Ensure it starts with /
      if (!pathname.startsWith('/')) pathname = '/' + pathname;

      const next = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
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
        const [blogs, homeData, notes, projects] = await Promise.all([
          fetchBlogs(),
          fetchHomepageData(),
          fetchNotes({ sortBy: 'created_at', order: 'desc' }),
          fetchProjects()
        ]);
        setEntries({
          blogs: blogs || [],
          notes: Array.isArray(notes) ? notes : [],
          projects: Array.isArray(projects) ? projects : [],
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
    { id: 'blogs', label: 'Writings', path: '/blogs' },
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
    const latestProjects = (entries.projects || []).slice(0, 5);

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

    const recentItems = [
      ...latestBlogs.map((blog) => {
        const dateValue = blog?.created_at || blog?.date;
        const id = blog?._id || blog?.id;
        const path = id ? `/blogs/${id}` : '/blogs';
        return {
          key: `blog-${id || blog?.title || ''}`,
          title: blog?.title,
          dateValue,
          label: 'Blog',
          dataType: 'blog',
          path
        };
      }),
      ...latestNotes.map((note) => {
        const dateValue = note?.created_at || note?.date;
        const id = note?._id || note?.id;
        const path = id ? `/notes/${id}` : '/notes';
        return {
          key: `note-${id || note?.title || ''}`,
          title: note?.title,
          dateValue,
          label: 'Note',
          dataType: 'note',
          path
        };
      }),
      ...latestLibrary.map((item) => {
        const dateValue = item?.date || item?.created_at || item?.createdAt;
        const id = item?.log_id || item?.id;

        let path = '/library';
        if (item?.__type === 'music' && id) path = `/library/music/${id}`;
        else if (item?.__type && id) path = `/library/${item.__type}/${id}`;

        const typeLabel = item?.__type ? String(item.__type) : 'library';
        const label = typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1);

        return {
          key: `library-${item?.__type}-${id || item?.title || ''}`,
          title: item?.title,
          dateValue,
          label,
          dataType: 'library',
          path
        };
      }),
      ...latestProjects.map((project) => {
        const dateValue = project?.created_at || project?.date;
        const id = project?._id || project?.id;
        const path = '/projects';
        return {
          key: `project-${id || project?.title || ''}`,
          title: project?.title,
          dateValue,
          label: 'Project',
          dataType: 'project',
          path
        };
      })
    ]
      .filter((i) => i && i.title)
      .sort((a, b) => new Date(b.dateValue || 0) - new Date(a.dateValue || 0))
      .slice(0, 5);

    return (
      <>
        <div className="home-homepage-grid">
          <div className="home-homepage-main">
            <div className="hero-section">
              <div className="hero-header">
                <div className="hero-content">
                <h1 className="hero-title">…hi, this is karthik</h1>
                  <div className="hero-intro">
                    <p>
                      Systems engineer by day. Hobby collector by night. Monster hunter in my dreams.
                      I tend to start hobbies faster than I finish them. Programming, cartography,
                      gaming, photography, and long rants on public transit.
                    </p>
                    <p>
                      I live in Chennai, India, and love my city enough to be slightly obsessed with it.
                      Occasionally, I disappear on a motorcycle across the countryside.
                      It usually helps.
                    </p>
                    <p>
                      I like fantasy novels. I like classic rock.
                      I like maps more than is socially normal.
                    </p>
                    <p className="hero-quote">
                      “The world’s full of stories. There’s room for every one of them to be told."" - Blood of Elves
                    </p>
                    <p>
                      Follow me on X/Twitter&nbsp;
                      <a href="https://x.com/karthi9003" target="_blank" rel="noreferrer">@karthi9003</a> for more rants.
                    </p>
                  </div>
                  <div className="hero-avatar">
                    <div className="hero-collage">
                      <div className="collage-photo collage-photo-me">
                        <img src="/me.jpg" alt="Karthik" loading="eager" decoding="sync" />
                      </div>
                      <div className="collage-photo collage-photo-bike">
                        <img src="/bike.jpg" alt="Bike" loading="eager" decoding="sync" />
                      </div>
                      <div className="collage-photo collage-photo-coffee">
                        <img src="/coffee.jpg" alt="Coffee" loading="eager" decoding="sync" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <aside className="home-homepage-rail">
            <div className="latest-section">
              <h2 className="section-title">Recent</h2>
              <div className="home-list-rows">
                {recentItems.map((item) => {
                  const dateLabel = item?.dateValue
                    ? new Date(item.dateValue).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '—';

                  return (
                    <div key={item.key} className="home-list-row" onClick={() => navigate(item.path)}>
                      <span className="home-list-date">{dateLabel}</span>
                      <Link to={item.path} className="home-list-link">
                        {item.title}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </>
    );
  };

  return (
    <div className="app-container" data-page={activePage}>
      {/* Mobile Topbar inspired by tania.dev */}
      <div className="mobile-topbar">
        <div>
          <Link to="/" className="mobile-brand">KARTHIK.BLOG</Link>
          <div className="mobile-actions">
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

            {/* System controls - less prominent */}
            <div className="mobile-nav-system">
              {token ? (
                <button type="button" className="mobile-nav-system-item" onClick={onMobileLogout}>
                  <span>Logout ({alias})</span>
                </button>
              ) : (
                <button type="button" className="mobile-nav-system-item" onClick={onMobileLogin}>
                  <span>Login</span>
                </button>
              )}

              {isAdminUser() ? (
                <button
                  type="button"
                  className={`mobile-nav-system-item ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
                  onClick={() => { setMobileMenuOpen(false); navigate('/admin'); }}
                >
                  <span>Admin</span>
                </button>
              ) : null}
            </div>
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
          <div className="home-layout">
            <Sidebar />
            <div className="home-main">
              {isAdminPage ? (
                <AdminPanel />
              ) : isBlogPostPage ? <BlogPost /> :
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
        </Suspense>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand">
              <span className="footer-title">KARTHIK.BLOG</span>
              <span className="footer-subtitle">MADRAS, TN • EST. 2024</span>
            </div>
            <nav className="footer-nav">
              <a href="https://github.com/karthi209" target="_blank" rel="noreferrer">GitHub</a>
              <a href="https://x.com/karthi9003" target="_blank" rel="noreferrer">Twitter</a>
              <a href="mailto:karthikeyan14june@gmail.com">Email</a>
              <Link to="/terms">Terms</Link>
              <Link to="/privacy">Privacy</Link>
            </nav>
          </div>
          <div className="footer-bottom">
            <span className="footer-copyright">© {new Date().getFullYear()} Karthik. Some rights, probably.</span>
            <span className="footer-ascii-inline"><span className="ascii-green">█</span><span className="ascii-yellow">█</span><span className="ascii-orange">█</span><span className="ascii-red">█</span><span className="ascii-purple">█</span><span className="ascii-blue">█</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

