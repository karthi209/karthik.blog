import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { Map, Compass, Navigation, Calendar } from 'lucide-react';
import '../styles/modern.css';

export default function FieldnotesPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Placeholder for future API integration
  useEffect(() => {
    // TODO: Fetch fieldnotes/travel entries from backend
    setEntries([]);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="container" style={{ marginTop: '3rem' }}>
      <div 
        className="post hero-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Map size={32} color="var(--color-accent)" />
          <h2 className="post-section-title" style={{ margin: 0, border: 'none' }}>Fieldnotes</h2>
        </div>
        <p className="post-content">
          Travel logs, personal journeys, and adventures. Documentation of places visited,
          experiences lived, and lessons learned along the way.
        </p>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Loading field notes...</p>
        </div>
      ) : entries.length === 0 ? (
        <div 
          className="blog-card-empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Compass size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>No fieldnotes yet. The journey begins soon...</p>
        </div>
      ) : (
        <div 
          className="blog-cards-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {entries.map((entry, index) => (
            <div 
              key={index} 
              className="blog-card"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="blog-card-header">
                <div className="blog-card-icon">
                  <Navigation size={24} color="var(--color-accent)" />
                </div>
                <span className="status-indicator">
                  <Calendar size={12} style={{ marginRight: '4px' }} />
                  {new Date(entry.date).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="blog-card-title">
                <Link to={`/fieldnotes/${entry.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {entry.title}
                </Link>
              </h3>
              
              <p className="blog-card-excerpt">{entry.excerpt}</p>
              
              <div className="blog-card-footer">
                <Link to={`/fieldnotes/${entry.slug}`} className="blog-card-link">
                  Read Entry <Navigation size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
