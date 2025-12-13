import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="home-sidebar">
      <div className="sidebar-widget">
        <Link to="/" className="sidebar-brand">
          <h2 className="brand-name">KARTHIK.BLOG</h2>
        </Link>
        <div className="sidebar-color-stripe" aria-hidden="true"></div>
      </div>

      <div className="sidebar-widget">
        <nav className="sidebar-nav">
          <Link className="sidebar-link" to="/blogs">Blogs</Link>
          <Link className="sidebar-link" to="/library">Library</Link>
          <Link className="sidebar-link" to="/projects">Projects</Link>
        </nav>
      </div>

      <div className="sidebar-widget">
        <h3 className="widget-title">Connect</h3>
        <nav className="sidebar-nav">
          <a className="sidebar-link" href="https://x.com/karthi9003" target="_blank" rel="noreferrer">Twitter/X</a>
          <a className="sidebar-link" href="/rss.xml">RSS feed</a>
          <a className="sidebar-link" href="mailto:karthikeyan14june@gmail.com">Email</a>
        </nav>
      </div>
    </aside>
  );
}
