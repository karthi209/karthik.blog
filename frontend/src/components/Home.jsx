import { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Menu, X, Home as HomeIcon, BookOpen, Library, FlaskConical, User, 
  Github, Twitter, Mail
} from 'lucide-react';
import { fetchBlogs, fetchHomepageData } from '../services/api';
import '../styles/modern.css';
import ThemeToggle from './ThemeToggle';
import Sidebar from './Sidebar';

// Lazy load components
const BlogsPage = lazy(() => import('./BlogsPage'));
const LibraryPage = lazy(() => import('./LibraryPage'));
const MusicLibrary = lazy(() => import('./MusicLibrary'));
const PlaylistPage = lazy(() => import('./PlaylistPage'));
const GamesLibrary = lazy(() => import('./GamesLibrary'));
const ScreenLibrary = lazy(() => import('./ScreenLibrary'));
const ReadsLibrary = lazy(() => import('./ReadsLibrary'));
const FieldnotesPage = lazy(() => import('./FieldnotesPage'));
const LabPage = lazy(() => import('./LabPage'));
const BlogPost = lazy(() => import('./BlogPost'));
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
    books: [],
    travels: []
  });
  
  // Route detection
  const isBlogPostPage = location.pathname.startsWith('/blog/') || location.pathname.startsWith('/blogs/');
  const isAdminPage = location.pathname.startsWith('/admin');
  const isPlaylistPage = location.pathname.match(/^\/library\/music\/\d+$/);
  const isLogDetailPage = !isPlaylistPage && location.pathname.startsWith('/library/') && location.pathname.split('/').length > 3;
  const isLegalPage = ['/terms', '/privacy', '/disclaimer'].includes(location.pathname);
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    if (isBlogPostPage || isLogDetailPage || isPlaylistPage || isAdminPage || isLegalPage) return;
    
    const path = location.pathname;
    if (path === '/' || path === '') setActivePage('home');
    else if (path.startsWith('/blogs')) setActivePage('blogs');
    else if (path.startsWith('/library')) setActivePage('library');
    else if (path.startsWith('/projects')) setActivePage('projects');
    else if (path.startsWith('/whoami')) setActivePage('whoami');
    else {
      setActivePage('home');
      if (path !== '/') navigate('/', { replace: true });
    }
  }, [location.pathname, isBlogPostPage, isLogDetailPage, isPlaylistPage, isAdminPage, isLegalPage, navigate]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [blogs, homeData] = await Promise.all([
          fetchBlogs(),
          fetchHomepageData()
        ]);
        setEntries({
          blogs: blogs || [],
          ...homeData
        });
      } catch (error) {
        console.error("Failed to load homepage data", error);
      }
    };
    loadData();
  }, []);

  const renderLibraryPage = () => {
    const path = location.pathname;
    const playlistMatch = path.match(/^\/library\/music\/(\d+)$/);
    if (playlistMatch) return <PlaylistPage id={playlistMatch[1]} />;
    if (path.includes('/library/music')) return <MusicLibrary />;
    if (path.includes('/library/games')) return <GamesLibrary />;
    if (path.includes('/library/screen')) return <ScreenLibrary />;
    if (path.includes('/library/reads')) return <ReadsLibrary />;
    if (path.includes('/library/travels')) return <FieldnotesPage />;
    return <LibraryPage />;
  };
  
  const navItems = [
    { id: 'home', label: 'Home', icon: <HomeIcon size={18} />, path: '/' },
    { id: 'blogs', label: 'Blogs', icon: <BookOpen size={18} />, path: '/blogs' },
    { id: 'library', label: 'Library', icon: <Library size={18} />, path: '/library' },
    { id: 'projects', label: 'Lab', icon: <FlaskConical size={18} />, path: '/projects' },
  ];

  const renderHomePage = () => {
    return (
      <div className="home-layout">
        <Sidebar />

        <div className="home-main">
          <div className="hero-section">
            <div className="hero-header">
              <div className="hero-content">
                <h1 className="hero-title">Hey there!</h1>
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
              <h2 className="section-title">Blogs</h2>
              <p className="section-subtitle">Long form articles and musings.</p>
            </div>
            
            <div className="home-list-rows">
              {entries.blogs.slice(0, 5).map((blog) => {
                const dateLabel = blog?.date ? new Date(blog.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '—';
                const readingTime = blog?.content ? Math.ceil(blog.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200) : 1;
                return (
                  <div 
                    key={blog._id || blog.id}
                    className="home-list-row"
                    onClick={() => navigate(`/blogs/${blog._id || blog.id}`)}
                  >
                    <div className="home-list-left">
                      <Link to={`/blogs/${blog._id || blog.id}`} className="home-list-link">
                        {blog.title}
                      </Link>
                      <div className="home-list-meta">
                        {blog.category && <span className="meta-tag">{blog.category.toUpperCase()}</span>}
                        <span className="meta-detail">{readingTime} MIN READ</span>
                      </div>
                    </div>
                    <span className="home-list-date">{dateLabel}</span>
                  </div>
                );
              })}
            </div>
            <Link to="/blogs" className="view-all-link">View all posts</Link>
          </div>
        </div>
      </div>
    );
  };

  const renderWithSidebar = (component) => {
    return (
      <div className="home-layout">
        <Sidebar />
        <div className="home-main">
          {component}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
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
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
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
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
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
          {isAdminPage ? <AdminPanel /> :
           isBlogPostPage ? renderWithSidebar(<BlogPost />) :
           isLogDetailPage ? <LogDetail /> :
           isLegalPage ? (
             location.pathname === '/terms' ? <Terms /> :
             location.pathname === '/privacy' ? <Privacy /> : <Disclaimer />
           ) : (
             activePage === 'home' ? renderHomePage() :
             activePage === 'blogs' ? renderWithSidebar(<BlogsPage />) :
             activePage === 'library' ? renderWithSidebar(renderLibraryPage()) :
             activePage === 'projects' ? renderWithSidebar(<LabPage />) :
             renderWithSidebar(<LabPage />)
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

