import { useEffect, useMemo, useState } from 'react';
import { adminCreateBlog, getStoredApiKey, setStoredApiKey } from '../services/admin';
import { adminCreateLog } from '../services/logs-admin';
import { adminCreatePlaylist, adminUpdatePlaylist, adminDeletePlaylist, adminAddSong, adminAddSongsBulk, adminDeleteSong, fetchPlaylists } from '../services/playlists-admin';
import ReactQuill from 'react-quill';
import "quill/dist/quill.snow.css";

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('thoughts'); // thoughts, games, movies, series, books, music
  
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('');

  // Blog/Thought form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('tech');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');

  // Log form (games, movies, series, books)
  const [logTitle, setLogTitle] = useState('');
  const [logContent, setLogContent] = useState('');
  const [logRating, setLogRating] = useState(5);
  const [logType, setLogType] = useState('games');

  // Playlists management
  const [playlists, setPlaylists] = useState([]);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [youtubeMusicUrl, setYoutubeMusicUrl] = useState('');
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [songTitle, setSongTitle] = useState('');
  const [songAlbum, setSongAlbum] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songYear, setSongYear] = useState('');
  const [bulkSongs, setBulkSongs] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);

  // Quill modules configuration - simplified for mobile
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'blockquote', 'code-block',
    'link', 'image'
  ];

  useEffect(() => {
    // Check if already authenticated
    const authStatus = sessionStorage.getItem('adminAuth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    
    const key = getStoredApiKey();
    if (key) setApiKey(key);

    // Load playlists if on music tab
    if (activeTab === 'music' && isAuthenticated) {
      loadPlaylists();
    }
  }, [activeTab, isAuthenticated]);

  const loadPlaylists = async () => {
    try {
      const data = await fetchPlaylists();
      setPlaylists(data);
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Get credentials from environment variables
    const validUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
    const validPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'password';
    
    if (username === validUsername && password === validPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid username or password');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
    setUsername('');
    setPassword('');
  };

  const canSubmitBlog = useMemo(() => title && category && content, [title, category, content]);

  const handleSaveKey = () => {
    setStoredApiKey(apiKey.trim());
    setStatus('API key saved');
    setTimeout(() => setStatus(''), 1500);
  };

  const submitBlog = async (e) => {
    e.preventDefault();
    try {
      setStatus('Creating blog...');
      const tagsArray = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : null;
      await adminCreateBlog({ title, content, category, tags: tagsArray });
      setStatus('Blog created successfully!');
      setTitle(''); setCategory('tech'); setTags(''); setContent('');
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setStatus(`Error: ${err.message || 'Failed'}`);
    }
  };

  const submitLog = async (e) => {
    e.preventDefault();
    try {
      setStatus(`Creating ${logType} entry...`);
      await adminCreateLog({ 
        title: logTitle, 
        type: logType, 
        content: logContent, 
        rating: logRating ? String(logRating) : null
      });
      setStatus(`${logType.charAt(0).toUpperCase() + logType.slice(1)} entry created successfully!`);
      setLogTitle(''); setLogContent(''); setLogRating(5);
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setStatus(`Error: ${err.message || 'Failed'}`);
    }
  };

  const submitMusic = async (e) => {
    e.preventDefault();
    try {
      setStatus('Creating playlist...');
      await adminCreatePlaylist({
        name: playlistName.trim(),
        description: playlistDescription.trim()
      });
      setStatus('Playlist created successfully!');
      setPlaylistName('');
      setPlaylistDescription('');
      await loadPlaylists();
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setStatus(`Error: ${err.message || 'Failed'}`);
    }
  };

  const handleDeletePlaylist = async (id) => {
    if (!confirm('Delete this playlist and all its songs?')) return;
    try {
      setStatus('Deleting playlist...');
      await adminDeletePlaylist(id);
      setStatus('Playlist deleted!');
      await loadPlaylists();
      if (activePlaylist === id) setActivePlaylist(null);
      if (editingPlaylist === id) setEditingPlaylist(null);
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setStatus(`Error: ${err.message || 'Failed'}`);
    }
  };

  const handleUpdatePlaylist = async (id, name, description, spotifyUrl, youtubeMusicUrl) => {
    if (!name.trim()) {
      setStatus('Playlist name is required');
      setTimeout(() => setStatus(''), 2000);
      return;
    }
    try {
      setStatus('Updating playlist...');
      await adminUpdatePlaylist(id, { 
        name: name.trim(), 
        description: description.trim(),
        spotify_url: spotifyUrl?.trim() || null,
        youtube_music_url: youtubeMusicUrl?.trim() || null
      });
      setStatus('Playlist updated!');
      await loadPlaylists();
      setEditingPlaylist(null);
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setStatus(`Error: ${err.message || 'Failed'}`);
    }
  };

  const handleAddSong = async (playlistId) => {
    if (!songTitle.trim() || !songArtist.trim()) {
      setStatus('Song title and artist are required');
      setTimeout(() => setStatus(''), 2000);
      return;
    }
    try {
      setStatus('Adding song...');
      await adminAddSong(playlistId, {
        title: songTitle.trim(),
        album: songAlbum.trim(),
        artist: songArtist.trim(),
        year: songYear.trim()
      });
      setStatus('Song added!');
      setSongTitle('');
      setSongAlbum('');
      setSongArtist('');
      setSongYear('');
      await loadPlaylists();
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setStatus(`Error: ${err.message || 'Failed'}`);
    }
  };

  const handleAddSongsBulk = async (playlistId) => {
    if (!bulkSongs.trim()) {
      setStatus('Please enter songs');
      setTimeout(() => setStatus(''), 2000);
      return;
    }

    try {
      setStatus('Adding songs...');
      const lines = bulkSongs.trim().split('\n');
      const songs = lines
        .map(line => {
          const parts = line.split('|').map(p => p.trim());
          if (parts.length < 2) return null;
          return {
            title: parts[0],
            album: parts[2] || '',
            artist: parts[1],
            year: parts[3] || ''
          };
        })
        .filter(s => s !== null);

      if (songs.length === 0) {
        setStatus('No valid songs found. Format: Title | Artist | Album | Year');
        setTimeout(() => setStatus(''), 3000);
        return;
      }

      const result = await adminAddSongsBulk(playlistId, songs);
      setStatus(`${result.count} songs added!`);
      setBulkSongs('');
      setShowBulkInput(false);
      await loadPlaylists();
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setStatus(`Error: ${err.message || 'Failed'}`);
    }
  };

  const handleDeleteSong = async (playlistId, songId) => {
    if (!confirm('Remove this song from the playlist?')) return;
    try {
      setStatus('Removing song...');
      await adminDeleteSong(playlistId, songId);
      setStatus('Song removed!');
      await loadPlaylists();
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setStatus(`Error: ${err.message || 'Failed'}`);
    }
  };

  const tabs = [
    { id: 'thoughts', name: 'Thoughts', symbol: '◈' },
    { id: 'games', name: 'Games', symbol: '⌘' },
    { id: 'movies', name: 'Movies', symbol: '▶' },
    { id: 'series', name: 'TV Series', symbol: '▶' },
    { id: 'books', name: 'Books', symbol: '◈' },
    { id: 'music', name: 'Music', symbol: '♫' },
  ];

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="post" style={{ maxWidth: '480px', margin: '4rem auto', padding: '2rem' }}>
          <h2 className="post-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>Admin Login</h2>
          <form onSubmit={handleLogin} className="add-content-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                className="form-input" 
                type="text"
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                className="form-input" 
                type="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {loginError && (
              <div style={{ color: 'var(--color-accent)', marginBottom: '1rem', textAlign: 'center' }}>
                {loginError}
              </div>
            )}
            <div className="form-actions">
              <button className="form-button form-button-primary" type="submit">
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: 'var(--space-md)', 
        marginBottom: 'var(--space-lg)',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }}>
        <h2 className="post-title" style={{ 
          margin: 0, 
          flex: '1 1 auto', 
          fontSize: 'clamp(1.1rem, 4vw, 1.75rem)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span className="section-symbol" style={{ fontSize: '0.9em' }}>◉</span> 
          <span>Admin Panel</span>
        </h2>
        <button 
          className="form-button" 
          onClick={handleLogout}
          style={{ 
            padding: '0.6rem 1.1rem',
            fontSize: '0.85rem',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            flex: '0 0 auto',
            whiteSpace: 'nowrap',
            minWidth: '90px',
            background: 'var(--color-text)',
            color: 'var(--color-background)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div 
        className="admin-tabs-grid"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem', 
          marginBottom: 'var(--space-lg)', 
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '0.75rem'
        }}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setStatus('');
              if (tab.id !== 'thoughts' && tab.id !== 'music') {
                setLogType(tab.id);
              }
            }}
            className="admin-tab-button"
            style={{
              padding: '0.65rem 0.5rem',
              border: activeTab === tab.id ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
              background: activeTab === tab.id ? 'var(--color-accent)' : 'transparent',
              color: activeTab === tab.id ? 'var(--color-background)' : 'var(--color-text)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              fontWeight: activeTab === tab.id ? '600' : '500',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.2rem',
              minHeight: '68px',
              textAlign: 'center',
              lineHeight: '1.2'
            }}
          >
            <span style={{ opacity: 0.8, fontSize: '1.3em', display: 'block' }}>{tab.symbol}</span>
            <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              {tab.name}
            </span>
          </button>
        ))}
      </div>

      {/* Thoughts Form */}
      {activeTab === 'thoughts' && (
        <section className="post" style={{ padding: 'var(--space-lg)' }}>
          <h3 className="twitter-sidebar-title" style={{ marginBottom: 'var(--space-md)', fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
            Create Thought
          </h3>
          <form onSubmit={submitBlog} className="add-content-form">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="general">General</option>
                <option value="tech">Tech</option>
                <option value="life">Life</option>
                <option value="coding">Coding</option>
                <option value="travel">Travel</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input 
                className="form-input" 
                value={tags} 
                onChange={(e) => setTags(e.target.value)} 
                placeholder="react, javascript, webdev"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Content</label>
              <div className="quill-wrapper" style={{ 
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={modules}
                  formats={formats}
                  placeholder="Write your blog content here..."
                />
              </div>
              <p style={{ 
                fontSize: '0.875rem', 
                color: 'var(--color-text-light)', 
                marginTop: '0.5rem' 
              }}>
                Essential formatting tools: Headers, Bold, Lists, Links, Code blocks
              </p>
            </div>
            <div className="form-actions">
              <button className="form-button form-button-primary" type="submit" disabled={!canSubmitBlog}>
                Create Thought
              </button>
            </div>
            {status && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                background: status.includes('Error') ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 0, 0.1)',
                border: `1px solid ${status.includes('Error') ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 0, 0.3)'}`,
                borderRadius: '8px',
                color: 'var(--color-text)',
                fontSize: '0.95rem',
                textAlign: 'center'
              }}>
                {status}
              </div>
            )}
          </form>
        </section>
      )}

      {/* Games, Movies, Series, Books Form */}
      {['games', 'movies', 'series', 'books'].includes(activeTab) && (
        <section className="post" style={{ padding: 'var(--space-lg)' }}>
          <h3 className="twitter-sidebar-title" style={{ marginBottom: 'var(--space-md)', fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
            Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Entry
          </h3>
          <form onSubmit={submitLog} className="add-content-form">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input 
                className="form-input" 
                value={logTitle} 
                onChange={(e) => setLogTitle(e.target.value)} 
                placeholder={`Name of the ${activeTab === 'series' ? 'TV series' : activeTab.slice(0, -1)}`}
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Rating (1-5)</label>
              <input 
                className="form-input" 
                type="number" 
                min="1" 
                max="5" 
                value={logRating} 
                onChange={(e) => setLogRating(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Review / Notes</label>
              <textarea 
                className="form-textarea" 
                value={logContent} 
                onChange={(e) => setLogContent(e.target.value)}
                placeholder="Your thoughts, review, or notes..."
                rows="8"
                style={{ minHeight: '200px' }}
              />
            </div>
            <div className="form-actions">
              <button className="form-button form-button-primary" type="submit">
                Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(0, -1)}
              </button>
            </div>
            {status && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                background: status.includes('Error') ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 0, 0.1)',
                border: `1px solid ${status.includes('Error') ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 0, 0.3)'}`,
                borderRadius: '8px',
                color: 'var(--color-text)',
                fontSize: '0.95rem',
                textAlign: 'center'
              }}>
                {status}
              </div>
            )}
          </form>
        </section>
      )}

      {/* Playlists Management */}
      {activeTab === 'music' && (
        <>
          <section className="post" style={{ padding: 'var(--space-lg)' }}>
            <h3 className="twitter-sidebar-title" style={{ marginBottom: 'var(--space-md)', fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
              Create Playlist
            </h3>
            <form onSubmit={submitMusic} className="add-content-form">
              <div className="form-group">
                <label className="form-label">Playlist Name</label>
                <input 
                  className="form-input" 
                  value={playlistName} 
                  onChange={(e) => setPlaylistName(e.target.value)} 
                  placeholder="Summer Vibes, 90s Classics, etc."
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea 
                  className="form-textarea" 
                  value={playlistDescription} 
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  placeholder="A short description of the playlist"
                  rows="3"
                  style={{ minHeight: '80px' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Spotify URL (optional)</label>
                <input 
                  className="form-input" 
                  type="url"
                  value={spotifyUrl} 
                  onChange={(e) => setSpotifyUrl(e.target.value)} 
                  placeholder="https://open.spotify.com/playlist/..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">YouTube Music URL (optional)</label>
                <input 
                  className="form-input" 
                  type="url"
                  value={youtubeMusicUrl} 
                  onChange={(e) => setYoutubeMusicUrl(e.target.value)} 
                  placeholder="https://music.youtube.com/playlist?list=..."
                />
              </div>
              <div className="form-actions">
                <button className="form-button form-button-primary" type="submit">
                  Create Playlist
                </button>
              </div>
            </form>
          </section>

          <section className="post" style={{ padding: 'var(--space-lg)' }}>
            <h3 className="twitter-sidebar-title" style={{ marginBottom: 'var(--space-md)', fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
              Manage Playlists
            </h3>
            {playlists.length === 0 ? (
              <p className="post-content">No playlists yet. Create one above.</p>
            ) : (
              playlists.map(p => (
                <div key={p.id} style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)', border: '1px solid var(--color-border)' }}>
                  {editingPlaylist === p.id ? (
                    <div style={{ marginBottom: 'var(--space-sm)' }}>
                      <input 
                        className="form-input" 
                        defaultValue={p.name}
                        id={`edit-name-${p.id}`}
                        style={{ marginBottom: '0.5rem' }}
                      />
                      <textarea 
                        className="form-textarea" 
                        defaultValue={p.description}
                        id={`edit-desc-${p.id}`}
                        rows="2"
                        style={{ minHeight: '60px', marginBottom: '0.5rem' }}
                      />
                      <input 
                        className="form-input" 
                        type="url"
                        defaultValue={p.spotify_url || ''}
                        id={`edit-spotify-${p.id}`}
                        placeholder="Spotify URL"
                        style={{ marginBottom: '0.5rem' }}
                      />
                      <input 
                        className="form-input" 
                        type="url"
                        defaultValue={p.youtube_music_url || ''}
                        id={`edit-youtube-${p.id}`}
                        placeholder="YouTube Music URL"
                        style={{ marginBottom: '0.5rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="form-button" 
                          onClick={() => {
                            const name = document.getElementById(`edit-name-${p.id}`).value;
                            const desc = document.getElementById(`edit-desc-${p.id}`).value;
                            const spotify = document.getElementById(`edit-spotify-${p.id}`).value;
                            const youtube = document.getElementById(`edit-youtube-${p.id}`).value;
                            handleUpdatePlaylist(p.id, name, desc, spotify, youtube);
                          }}
                          style={{ fontSize: '0.875rem' }}
                        >
                          Save
                        </button>
                        <button 
                          className="form-button" 
                          onClick={() => setEditingPlaylist(null)}
                          style={{ fontSize: '0.875rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '1.125rem' }}>{p.name}</h4>
                        {p.description && <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-light)' }}>{p.description}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="form-button" 
                          onClick={() => setEditingPlaylist(p.id)}
                          style={{ fontSize: '0.875rem' }}
                        >
                          Edit
                        </button>
                        <button 
                          className="form-button" 
                          onClick={() => handleDeletePlaylist(p.id)}
                          style={{ fontSize: '0.875rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}

                  <button 
                    className="form-button" 
                    onClick={() => setActivePlaylist(activePlaylist === p.id ? null : p.id)}
                    style={{ marginBottom: 'var(--space-sm)', fontSize: '0.875rem' }}
                  >
                    {activePlaylist === p.id ? '▾ Hide Songs' : '▸ Manage Songs'}
                  </button>

                  {activePlaylist === p.id && (
                    <div style={{ marginTop: 'var(--space-md)' }}>
                      {!showBulkInput ? (
                        <>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '0.875rem' }}>Add Single Song</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 0.8fr', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                              <input className="form-input" placeholder="Song title" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} />
                              <input className="form-input" placeholder="Album" value={songAlbum} onChange={(e) => setSongAlbum(e.target.value)} />
                              <input className="form-input" placeholder="Artist" value={songArtist} onChange={(e) => setSongArtist(e.target.value)} />
                              <input className="form-input" placeholder="Year" value={songYear} onChange={(e) => setSongYear(e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="form-button" onClick={() => handleAddSong(p.id)} style={{ fontSize: '0.875rem' }}>
                                Add Song
                              </button>
                              <button className="form-button" onClick={() => setShowBulkInput(true)} style={{ fontSize: '0.875rem' }}>
                                Add Multiple Songs
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.875rem' }}>
                            Add Multiple Songs (one per line: Title | Artist | Album | Year)
                          </label>
                          <textarea 
                            className="form-textarea"
                            value={bulkSongs}
                            onChange={(e) => setBulkSongs(e.target.value)}
                            placeholder="Bohemian Rhapsody | Queen | A Night at the Opera | 1975&#10;Stairway to Heaven | Led Zeppelin | Led Zeppelin IV | 1971&#10;Hotel California | Eagles | Hotel California | 1976"
                            rows="6"
                            style={{ minHeight: '150px', fontFamily: 'monospace', fontSize: '0.875rem' }}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button className="form-button" onClick={() => handleAddSongsBulk(p.id)} style={{ fontSize: '0.875rem' }}>
                              Add All Songs
                            </button>
                            <button className="form-button" onClick={() => { setShowBulkInput(false); setBulkSongs(''); }} style={{ fontSize: '0.875rem' }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {p.songs && p.songs.length > 0 && (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 'var(--space-md)', fontSize: '0.875rem' }}>
                          <thead>
                            <tr>
                              <th style={{ border: '1px solid var(--color-border)', padding: '0.5rem', textAlign: 'left', background: 'var(--color-hover)' }}>Title</th>
                              <th style={{ border: '1px solid var(--color-border)', padding: '0.5rem', textAlign: 'left', background: 'var(--color-hover)' }}>Album</th>
                              <th style={{ border: '1px solid var(--color-border)', padding: '0.5rem', textAlign: 'left', background: 'var(--color-hover)' }}>Artist</th>
                              <th style={{ border: '1px solid var(--color-border)', padding: '0.5rem', textAlign: 'left', background: 'var(--color-hover)' }}>Year</th>
                              <th style={{ border: '1px solid var(--color-border)', padding: '0.5rem', background: 'var(--color-hover)' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.songs.map(s => (
                              <tr key={s.id}>
                                <td style={{ border: '1px solid var(--color-border)', padding: '0.5rem' }}>{s.title}</td>
                                <td style={{ border: '1px solid var(--color-border)', padding: '0.5rem' }}>{s.album || '—'}</td>
                                <td style={{ border: '1px solid var(--color-border)', padding: '0.5rem' }}>{s.artist}</td>
                                <td style={{ border: '1px solid var(--color-border)', padding: '0.5rem' }}>{s.year || '—'}</td>
                                <td style={{ border: '1px solid var(--color-border)', padding: '0.5rem', textAlign: 'center' }}>
                                  <button className="form-button" onClick={() => handleDeleteSong(p.id, s.id)} style={{ fontSize: '0.75rem' }}>
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}

            {status && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                background: status.includes('Error') ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 0, 0.1)',
                border: `1px solid ${status.includes('Error') ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 0, 0.3)'}`,
                borderRadius: '8px',
                color: 'var(--color-text)',
                fontSize: '0.95rem',
                textAlign: 'center'
              }}>
                {status}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}








