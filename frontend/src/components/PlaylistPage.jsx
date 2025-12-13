import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import '../styles/modern.css';

export default function PlaylistPage({ id }) {
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        const url = `${apiUrl}/playlists`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch playlists');
        const data = await response.json();
        const found = data.find(p => p.id === parseInt(id));
        
        if (!found) {
          setError('Playlist not found');
        } else {
          setPlaylist(found);
        }
      } catch (err) {
        console.error('Error fetching playlist:', err);
        setError('Failed to load playlist');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [id]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
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
      <div className="container" style={{ marginTop: '3rem' }}>
        <div className="loading-state">
          <div className="loading-spinner">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="container" style={{ marginTop: '3rem' }}>
        <div className="post">
          <button onClick={() => navigate('/library/music')} className="back-link">
            ← Back to Playlists
          </button>
          <h2 className="post-title" style={{ marginTop: '1rem' }}>{error || 'Playlist not found'}</h2>
        </div>
      </div>
    );
  }

  const songCount = playlist.songs ? playlist.songs.length : 0;

  const openInSpotify = () => {
    if (playlist.spotify_url) {
      window.open(playlist.spotify_url, '_blank');
    } else {
      const query = encodeURIComponent(`${playlist.name} playlist`);
      window.open(`https://open.spotify.com/search/${query}`, '_blank');
    }
  };

  const openInYouTubeMusic = () => {
    if (playlist.youtube_music_url) {
      window.open(playlist.youtube_music_url, '_blank');
    } else {
      const query = encodeURIComponent(`${playlist.name} playlist`);
      window.open(`https://music.youtube.com/search?q=${query}`, '_blank');
    }
  };

  return (
    <div className="container" style={{ marginTop: '3rem', maxWidth: '1200px' }}>
      <div 
        className="blog-post-container"
        style={{ padding: '0' }}
      >
        <button onClick={() => navigate('/library/music')} className="back-link" style={{ marginBottom: '1.5rem' }}>
          ← Back to Playlists
        </button>

        <div>
          <div className="playlist-info">
            <h1 className="post-title" style={{ margin: '0 0 0.75rem 0', fontSize: '2.25rem' }}>{playlist.name}</h1>
            <div className="meta-row" style={{ marginTop: '0', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              <span className="meta-item" style={{ color: 'var(--color-text-muted)' }}>
                {songCount} {songCount === 1 ? 'TRACK' : 'TRACKS'}
              </span>
              {playlist.created_at && (
                <>
                  <span style={{ color: 'var(--color-text-muted)' }}>·</span>
                  <span className="meta-item" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(playlist.created_at).getFullYear()}
                  </span>
                </>
              )}
            </div>
            {playlist.description && (
              <p className="playlist-description-full" style={{ marginTop: '0', marginBottom: '1.5rem', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
                {playlist.description}
              </p>
            )}
            
            <div className="playlist-actions" style={{ marginTop: '0', marginBottom: '2rem', display: 'flex', gap: '0.75rem' }}>
              <button onClick={openInSpotify} className="back-link" style={{ margin: 0 }}>
                Spotify →
              </button>
              <button onClick={openInYouTubeMusic} className="back-link" style={{ margin: 0 }}>
                YouTube Music →
              </button>
            </div>
          </div>
        </div>

        <div className="post-content" style={{ marginTop: '1.5rem' }}>
          {songCount === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No songs in this playlist yet.</p>
          ) : (
            <div className="songs-list-modern">
              {playlist.songs.map((s, idx) => (
                <div 
                  className="song-item-modern" 
                  key={s.id}
                  style={{
                    padding: '0.875rem 0',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-text-muted)', minWidth: '1.5rem' }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.25rem' }}>{s.title}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {s.artist && <span>{s.artist}</span>}
                      {s.album && <span>·</span>}
                      {s.album && <span>{s.album}</span>}
                      {s.year && <span>·</span>}
                      {s.year && <span>{s.year}</span>}
                    </div>
                    {s.preview_url && (
                      <audio 
                        style={{ marginTop: '0.5rem', width: '100%', height: '28px' }} 
                        controls 
                        controlsList="nodownload"
                      >
                        <source src={s.preview_url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
