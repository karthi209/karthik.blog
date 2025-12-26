import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

import '../styles/modern.css';
import { fetchViewCount } from '../services/views';

export default function PlaylistPage({ id }) {
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [error, setError] = useState(null);
  const [views, setViews] = useState(null);
  const location = useLocation();

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
          setError('Album not found');
        } else {
          setPlaylist(found);
        }
      } catch (err) {
        setError('Failed to load album');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [id]);

  useEffect(() => {
    const loadViews = async () => {
      try {
        const res = await fetchViewCount(location.pathname);
        setViews(typeof res?.count === 'number' ? res.count : Number(res?.count || 0));
      } catch {
        setViews(null);
      }
    };

    loadViews();
  }, [location.pathname]);

  useEffect(() => {
    if (!loading) {
      setShowLoader(false);
      return;
    }
    // Only show loader after 2.5 seconds - prevents distracting flash for fast loads
    const t = setTimeout(() => setShowLoader(true), 2500);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading && showLoader) {
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
          <p>Loading album...</p>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="content-wrap">
        <div className="post">
          <h2 className="post-title" style={{ marginTop: '1rem' }}>{error || 'Album not found'}</h2>
        </div>
      </div>
    );
  }

  const songCount = playlist.songs ? playlist.songs.length : 0;

  const openInSpotify = () => {
    if (playlist.spotify_url) {
      window.open(playlist.spotify_url, '_blank');
    } else {
      const query = encodeURIComponent(`${playlist.name} album`);
      window.open(`https://open.spotify.com/search/${query}`, '_blank');
    }
  };

  const openInYouTubeMusic = () => {
    if (playlist.youtube_music_url) {
      window.open(playlist.youtube_music_url, '_blank');
    } else {
      const query = encodeURIComponent(`${playlist.name} album`);
      window.open(`https://music.youtube.com/search?q=${query}`, '_blank');
    }
  };

  return (
    <div className="content-wrap">
      <article className="post library-note library-note-page">
        <header className="library-note-header">
          <div>
            <div className="library-note-kicker">
              <span className="library-note-kicker-item">Album</span>
              {playlist.created_at ? (
                <span className="library-note-kicker-item">
                  {new Date(playlist.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              ) : null}
            </div>

            <h1 className="library-note-title">{playlist.name}</h1>

            <div className="library-note-chips">
              <span className="library-note-chip">
                {songCount} {songCount === 1 ? 'track' : 'tracks'}
              </span>
              {typeof views === 'number' ? (
                <span className="library-note-chip">
                  {views} views
                </span>
              ) : null}
              <button type="button" onClick={openInSpotify} className="retro-button retro-button--sm">
                Spotify →
              </button>
              <button type="button" onClick={openInYouTubeMusic} className="retro-button retro-button--sm">
                YouTube Music →
              </button>
            </div>

            {playlist.description ? (
              <p className="library-note-intro">{playlist.description}</p>
            ) : null}
          </div>
        </header>

        <div className="post-content">
          {songCount === 0 ? (
            <p className="page-meta">No songs in this album yet.</p>
          ) : (
            <div className="library-tracks">
              {playlist.songs.map((s, idx) => (
                <div className="library-track" key={s.id}>
                  <div className="library-track-no">{idx + 1}</div>
                  <div className="library-track-body">
                    <div className="library-track-title">{s.title}</div>
                    <div className="library-track-meta">
                      {s.artist ? <span>{s.artist}</span> : null}
                      {s.album ? <span>·</span> : null}
                      {s.album ? <span>{s.album}</span> : null}
                      {s.year ? <span>·</span> : null}
                      {s.year ? <span>{s.year}</span> : null}
                    </div>
                    {s.preview_url ? (
                      <audio className="library-track-audio" controls controlsList="nodownload">
                        <source src={s.preview_url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </article>
    </div>
  );
}
