import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import './MusicLibrary.css';

export default function MusicLibrary() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        const url = `${apiUrl}/playlists`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch playlists');
        const data = await response.json();
        setPlaylists(data);
      } catch (error) {
        console.error('Error fetching playlists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
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

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p>Loading playlists...</p>
      </div>
    );
  }

  return (
    <>
      <div 
        className="post hero-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="page-title" style={{ margin: 0, border: 'none' }}>Music Library</h2>
        <p className="page-meta">{playlists.length} CURATED PLAYLISTS</p>
      </div>

      {playlists.length === 0 ? (
        <div 
          className="blog-card-empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p>No playlists yet. Check back soon!</p>
        </div>
      ) : (
        <div className="list-rows">
          {playlists.map((p) => {
            const songCount = p.songs ? p.songs.length : 0;
            return (
              <div 
                key={p.id} 
                className="list-row"
                onClick={() => navigate(`/library/music/${p.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/library/music/${p.id}`); }}
              >
                <div>
                  <div className="list-row-title">{p.name}</div>
                  <div className="list-row-meta">
                    <span className="meta-detail">{songCount} TRACKS</span>
                    {p.description && <span className="meta-item">{p.description}</span>}
                  </div>
                </div>
                <div className="list-row-right">
                  <span className="pill">Listen</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
