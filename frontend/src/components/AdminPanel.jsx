import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { adminCreateBlog, getStoredAdminToken, setStoredAdminToken, clearStoredAdminToken, adminUploadImage, adminListBlogs, adminUpdateBlog, adminDeleteBlog } from '../services/admin';
import { adminCreateLog, adminCreateGame } from '../services/logs-admin';
import { adminCreatePlaylist, adminUpdatePlaylist, adminDeletePlaylist, adminAddSong, adminAddSongsBulk, adminDeleteSong, fetchPlaylists } from '../services/playlists-admin';
import { adminListNotes, adminCreateNote, adminUpdateNote, adminDeleteNote } from '../services/notes-admin';
import ReactQuill from 'react-quill';
import "quill/dist/quill.snow.css";
import './BlogsPage.css';
import Sidebar from './Sidebar';
import AuthRequiredModal from './AuthRequiredModal';
import { hasSeenAuthDisclaimer, markAuthDisclaimerSeen } from '../services/auth';

const API = import.meta.env.VITE_API_URL || '/api';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [contentType, setContentType] = useState('blogs'); // blogs, notes, library, music
  const [libraryType, setLibraryType] = useState('games'); // games, screen_movie, screen_series, books
  const [activeTab, setActiveTab] = useState('blogs'); // blogs, notes, games, movies, series, books, music
  
  const [status, setStatus] = useState('');
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const quillRef = useRef(null);

  // Blog/Thought form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [isDraft, setIsDraft] = useState(false);

  // Blog management
  const [blogs, setBlogs] = useState([]);
  const [editingBlog, setEditingBlog] = useState(null);
  const [showManageBlogs, setShowManageBlogs] = useState(false);

  // Notes form + management
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState('');
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [showManageNotes, setShowManageNotes] = useState(false);

  // Log form (games, movies, series, books)
  const [logTitle, setLogTitle] = useState('');
  const [logContent, setLogContent] = useState('');
  const [logRating, setLogRating] = useState(10);
  const [logType, setLogType] = useState('games');

  // Game-specific fields
  const [gamePlatform, setGamePlatform] = useState('');
  const [gameGenre, setGameGenre] = useState('');
  const [gameReleaseYear, setGameReleaseYear] = useState('');
  const [gameCoverImageFile, setGameCoverImageFile] = useState(null);
  const [gameStatus, setGameStatus] = useState('completed');
  const [gameHoursPlayed, setGameHoursPlayed] = useState('');

  // Movie/Series-specific fields
  const [screenDirector, setScreenDirector] = useState('');
  const [screenGenre, setScreenGenre] = useState('');
  const [screenYear, setScreenYear] = useState('');
  const [screenCoverImageFile, setScreenCoverImageFile] = useState(null);

  // Book-specific fields
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookGenre, setBookGenre] = useState('');
  const [bookYear, setBookYear] = useState('');
  const [bookCoverImageFile, setBookCoverImageFile] = useState(null);

  // Playlists management
  const [playlists, setPlaylists] = useState([]);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [youtubeMusicUrl, setYoutubeMusicUrl] = useState('');
  const [playlistCoverFile, setPlaylistCoverFile] = useState(null);
  const [playlistCoverPreview, setPlaylistCoverPreview] = useState(null);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [songTitle, setSongTitle] = useState('');
  const [songAlbum, setSongAlbum] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songYear, setSongYear] = useState('');
  const [bulkSongs, setBulkSongs] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);

  // Quill modules configuration - simplified for mobile
  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        setStatus('Uploading image...');
        const { filePath } = await adminUploadImage(file);
        const apiBase = import.meta.env.VITE_API_URL || '';
        // If API ends with /api, strip it to get the asset host; fallback to same-origin
        const assetBase = apiBase.startsWith('http')
          ? apiBase.replace(/\/?api$/, '')
          : '';
        const publicUrl = `${assetBase}${filePath}`;
        const editor = quillRef.current?.getEditor();
        const range = editor?.getSelection(true);
        if (editor && range) {
          editor.insertEmbed(range.index, 'image', publicUrl);
          editor.setSelection(range.index + 1);
        }
        setStatus('Image uploaded');
        setTimeout(() => setStatus(''), 1500);
      } catch (error) {
        setStatus('Image upload failed');
        setTimeout(() => setStatus(''), 2000);
      }
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'blogs' && showManageBlogs) {
      loadBlogs();
    }
  }, [isAuthenticated, activeTab, showManageBlogs]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'notes' && showManageNotes) {
      loadNotes();
    }
  }, [isAuthenticated, activeTab, showManageNotes]);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: handleImageUpload
      }
    },
    clipboard: {
      matchVisual: false,
    }
  }), [handleImageUpload]);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'blockquote', 'code-block',
    'link', 'image'
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      setStoredAdminToken(token);
      setIsAuthenticated(true);
      setLoginError('');
      // Remove token from URL
      params.delete('token');
      const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', next);
    }

    if (error) {
      setLoginError(String(error));
      params.delete('error');
      const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', next);
    }

    const stored = getStoredAdminToken();
    if (stored) setIsAuthenticated(true);

    // Load playlists if on music tab
    if (activeTab === 'music' && isAuthenticated) {
      loadPlaylists();
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (contentType === 'blogs') {
      setActiveTab('blogs');
      return;
    }
    if (contentType === 'notes') {
      setActiveTab('notes');
      return;
    }
    if (contentType === 'music') {
      setActiveTab('music');
      return;
    }

    // Library
    if (libraryType === 'games') {
      setActiveTab('games');
      setLogType('games');
    } else if (libraryType === 'screen_movie') {
      setActiveTab('movies');
      setLogType('movies');
    } else if (libraryType === 'screen_series') {
      setActiveTab('series');
      setLogType('series');
    } else if (libraryType === 'books') {
      setActiveTab('books');
      setLogType('books');
    }
  }, [contentType, libraryType]);

  const loadPlaylists = async () => {
    try {
      const data = await fetchPlaylists();
      setPlaylists(data);
    } catch (error) {
      // Silently fail
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const base = apiBase.endsWith('/api') ? apiBase : `${apiBase}`;
    window.location.href = `${base}/auth/google?redirect=${encodeURIComponent('/admin')}`;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    clearStoredAdminToken();
  };

  const canSubmitBlog = useMemo(() => title && category && content, [title, category, content]);

  const uploadCoverImage = async (file) => {
    const formData = new FormData();
    formData.append('cover', file);

    const token = getStoredAdminToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`${API}/upload/cover`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.filePath;
  };

  const submitBlog = async (e, saveAsDraft = false) => {
    e.preventDefault();
    try {
      const isDraftValue = saveAsDraft || isDraft;
      const tagsArray = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : null;
      
      if (editingBlog) {
        setStatus('Updating blog...');
        await adminUpdateBlog(editingBlog.id, { 
          title, 
          content, 
          category: category?.toUpperCase(), 
          tags: tagsArray,
          is_draft: isDraftValue
        });
        setStatus('Blog updated successfully!');
        setEditingBlog(null);
      } else {
        setStatus(isDraftValue ? 'Saving draft...' : 'Publishing blog...');
        await adminCreateBlog({ 
          title, 
          content, 
          category: category?.toUpperCase(), 
          tags: tagsArray,
          is_draft: isDraftValue
        });
        setStatus(isDraftValue ? 'Draft saved!' : 'Blog published!');
      }
      
      setTitle(''); 
      setCategory(''); 
      setTags(''); 
      setContent('');
      setIsDraft(false);
      if (showManageBlogs) loadBlogs();
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setStatus(`Error: ${err.message || 'Failed'}`);
    }
  };

  const loadBlogs = async () => {
    try {
      const data = await adminListBlogs();
      setBlogs(data);
    } catch (error) {
      setStatus('Failed to load blogs');
    }
  };

  const loadNotes = async () => {
    try {
      const data = await adminListNotes();
      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      setStatus('Failed to load notes');
    }
  };

  const handleEditBlog = async (blog) => {
    try {
      const response = await fetch(`${API}/blogs/${blog.id}`);
      const fullBlog = await response.json();
      setTitle(fullBlog.title);
      setCategory(fullBlog.category);
      setTags(fullBlog.tags ? fullBlog.tags.join(', ') : '');
      setContent(fullBlog.content);
      setIsDraft(fullBlog.is_draft || false);
      setEditingBlog(blog);
      setShowManageBlogs(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setStatus('Failed to load blog');
    }
  };

  const handleDeleteBlog = async (id) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;
    try {
      setStatus('Deleting blog...');
      await adminDeleteBlog(id);
      setStatus('Blog deleted!');
      loadBlogs();
      setTimeout(() => setStatus(''), 2000);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const cancelEdit = () => {
    setEditingBlog(null);
    setTitle('');
    setCategory('');
    setTags('');
    setContent('');
    setIsDraft(false);
  };

  const cancelEditNote = () => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteTags('');
  };

  const submitNote = async (e) => {
    e.preventDefault();
    try {
      if (!noteTitle.trim()) {
        setStatus('Error: Title is required');
        return;
      }

      const tagsArray = noteTags
        ? noteTags.split(',').map(t => t.trim()).filter(Boolean)
        : null;

      if (editingNote) {
        setStatus('Updating note...');
        await adminUpdateNote(editingNote.id, {
          title: noteTitle.trim(),
          content: noteContent || null,
          tags: tagsArray
        });
        setStatus('Note updated!');
        setEditingNote(null);
      } else {
        setStatus('Creating note...');
        await adminCreateNote({
          title: noteTitle.trim(),
          content: noteContent || null,
          tags: tagsArray
        });
        setStatus('Note created!');
      }

      setNoteTitle('');
      setNoteContent('');
      setNoteTags('');
      if (showManageNotes) loadNotes();
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setStatus(`Error: ${err.message || 'Failed'}`);
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setNoteTitle(note.title || '');
    setNoteContent(note.content || '');
    setNoteTags(Array.isArray(note.tags) ? note.tags.join(', ') : '');
    setShowManageNotes(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteNote = async (id) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      setStatus('Deleting note...');
      await adminDeleteNote(id);
      setStatus('Note deleted!');
      loadNotes();
      setTimeout(() => setStatus(''), 2000);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const submitLog = async (e) => {
    e.preventDefault();
    try {
      setStatus(`Creating ${logType} entry...`);

      if (logType === 'games') {
        // Upload cover image first if selected
        let coverImageUrl = null;
        if (gameCoverImageFile) {
          setStatus('Uploading cover image...');
          try {
            coverImageUrl = await uploadCoverImage(gameCoverImageFile);
          } catch (uploadError) {
            setStatus(`Upload failed: ${uploadError.message}`);
            return;
          }
        }

        setStatus('Creating game entry...');
        // Use the enhanced game creation function
        await adminCreateGame({
          title: logTitle,
          platform: gamePlatform,
          genre: gameGenre,
          release_year: gameReleaseYear,
          cover_image_url: coverImageUrl,
          rating: logRating ? String(logRating) : null,
          hours_played: gameHoursPlayed,
          status: gameStatus,
          review: logContent,
          played_on: new Date().toISOString().split('T')[0]
        });
      } else if (logType === 'movies' || logType === 'series') {
        // Upload cover image first if selected
        let coverImageUrl = null;
        if (screenCoverImageFile) {
          setStatus('Uploading cover image...');
          try {
            coverImageUrl = await uploadCoverImage(screenCoverImageFile);
          } catch (uploadError) {
            setStatus(`Upload failed: ${uploadError.message}`);
            return;
          }
        }
        await adminCreateLog({
          title: logTitle,
          type: logType,
          director: screenDirector,
          genre: screenGenre,
          year: screenYear,
          cover_image_url: coverImageUrl,
          rating: logRating ? String(logRating) : null,
          content: logContent
        });
      } else {
        // Use the regular log creation for books
        await adminCreateLog({ 
          title: logTitle, 
          type: logType, 
          content: logContent, 
          rating: logRating ? String(logRating) : null
        });
      }

      setStatus(`${logType.charAt(0).toUpperCase() + logType.slice(1)} entry created successfully!`);
      
      // Reset all form fields
      setLogTitle(''); 
      setLogContent(''); 
      setLogRating(10);
      setGamePlatform('');
      setGameGenre('');
      setGameReleaseYear('');
      setGameCoverImageFile(null);
      setGameStatus('completed');
      setGameHoursPlayed('');
      setScreenDirector('');
      setScreenGenre('');
      setScreenYear('');
      setScreenCoverImageFile(null);
      setBookAuthor('');
      setBookGenre('');
      setBookYear('');
      setBookCoverImageFile(null);
      
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setStatus(`Error: ${err.message || 'Failed'}`);
    }
  };

  const submitMusic = async (e) => {
    e.preventDefault();
    try {
      setStatus('Creating album...');
      let coverImageUrl = null;
      if (playlistCoverFile) {
        setStatus('Uploading cover image...');
        try {
          coverImageUrl = await uploadCoverImage(playlistCoverFile);
        } catch (uploadError) {
          setStatus(`Upload failed: ${uploadError.message}`);
          return;
        }
      }
      await adminCreatePlaylist({
        name: playlistName.trim(),
        description: playlistDescription.trim(),
        cover_image_url: coverImageUrl
      });
      setStatus('Album created successfully!');
      setPlaylistName('');
      setPlaylistDescription('');
      setPlaylistCoverFile(null);
      setPlaylistCoverPreview(null);
      await loadPlaylists();
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setStatus(`Error: ${err.message || 'Failed'}`);
    }
  };

  const handleDeletePlaylist = async (id) => {
    if (!confirm('Delete this album and all its songs?')) return;
    try {
      setStatus('Deleting album...');
      await adminDeletePlaylist(id);
      setStatus('Album deleted!');
      await loadPlaylists();
      if (activePlaylist === id) setActivePlaylist(null);
      if (editingPlaylist === id) setEditingPlaylist(null);
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setStatus(`Error: ${err.message || 'Failed'}`);
    }
  };

  const handleUpdatePlaylist = async (id, name, description, spotifyUrl, youtubeMusicUrl, coverImageUrl) => {
    if (!name.trim()) {
      setStatus('Album name is required');
      setTimeout(() => setStatus(''), 2000);
      return;
    }
    try {
      setStatus('Updating album...');
      await adminUpdatePlaylist(id, { 
        name: name.trim(), 
        description: description.trim(),
        spotify_url: spotifyUrl?.trim() || null,
        youtube_music_url: youtubeMusicUrl?.trim() || null,
        cover_image_url: coverImageUrl || null
      });
      setStatus('Album updated!');
      await loadPlaylists();
      setEditingPlaylist(null);
      setPlaylistCoverFile(null);
      setPlaylistCoverPreview(null);
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

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="container">
        <AuthRequiredModal
          open={loginModalOpen}
          title="Admin Login"
          message="Login is only required for admin actions. Reading is always open."
          showFirstTimeDisclaimer={!hasSeenAuthDisclaimer()}
          onClose={() => setLoginModalOpen(false)}
          onLogin={() => {
            if (!hasSeenAuthDisclaimer()) markAuthDisclaimerSeen();
            handleLogin({ preventDefault: () => {} });
          }}
        />
        <div className="post" style={{ maxWidth: '480px', margin: '4rem auto', padding: '2rem' }}>
          <h2 className="post-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>Admin Login</h2>
          {loginError ? (
            <div style={{ color: 'var(--color-accent)', marginBottom: '1rem', textAlign: 'center' }}>
              {loginError}
            </div>
          ) : null}

          <div className="form-actions" style={{ justifyContent: 'center' }}>
            <button className="form-button form-button-primary" type="button" onClick={() => setLoginModalOpen(true)}>
              Login with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-layout">
      <Sidebar />
      
      <div className="home-main">
        <div className="admin-wrapper">
          <div className="blog-header">
            <h1 className="page-title">Admin Panel</h1>
            <button 
              className="form-button admin-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>

          <div className="admin-tabs-grid" style={{ gridTemplateColumns: '1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Content Type</label>
              <select
                className="form-input"
                value={contentType}
                onChange={(e) => {
                  setContentType(e.target.value);
                  setStatus('');
                  setShowManageBlogs(false);
                  setShowManageNotes(false);
                }}
              >
                <option value="blogs">Blogs</option>
                <option value="notes">Notes</option>
                <option value="library">Library</option>
                <option value="music">Music</option>
              </select>
            </div>

            {contentType === 'library' ? (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Library Type</label>
                <select
                  className="form-input"
                  value={libraryType}
                  onChange={(e) => {
                    setLibraryType(e.target.value);
                    setStatus('');
                  }}
                >
                  <option value="games">Games</option>
                  <option value="screen_movie">Screen: Movie</option>
                  <option value="screen_series">Screen: TV</option>
                  <option value="books">Books</option>
                </select>
              </div>
            ) : null}
          </div>

      {/* Blogs Form */}
      {activeTab === 'blogs' && (
        <section className="admin-section">
          <h3 className="twitter-sidebar-title" style={{ marginBottom: 'var(--space-md)', fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
            {editingBlog ? 'Edit Blog' : 'Create Blog'}
          </h3>
          <form onSubmit={submitBlog} className="add-content-form">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category (UPPERCASE)</label>
              <input 
                className="form-input" 
                value={category}
                onChange={(e) => setCategory(e.target.value.toUpperCase())}
                placeholder="TECH, LIFE, TRAVEL, ..."
                required
              />
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
                  ref={quillRef}
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
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={isDraft} 
                  onChange={(e) => setIsDraft(e.target.checked)}
                  style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }}
                />
                <span>Save as draft (won't be published)</span>
              </label>
            </div>
            <div className="form-actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="form-button form-button-primary" type="submit" disabled={!canSubmitBlog}>
                {editingBlog ? 'Update Blog' : (isDraft ? 'Save Draft' : 'Publish Blog')}
              </button>
              {editingBlog && (
                <button 
                  type="button"
                  className="form-button" 
                  onClick={cancelEdit}
                  style={{ background: 'var(--color-bg-secondary)' }}
                >
                  Cancel Edit
                </button>
              )}
              {!editingBlog && (
                <button 
                  type="button"
                  className="form-button" 
                  onClick={() => setShowManageBlogs(!showManageBlogs)}
                  style={{ background: 'var(--color-bg-secondary)' }}
                >
                  {showManageBlogs ? 'Hide' : 'Manage'} Blogs
                </button>
              )}
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

          {showManageBlogs && (
            <div style={{ marginTop: '2rem' }}>
              <h3 className="twitter-sidebar-title" style={{ marginBottom: 'var(--space-md)', fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
                Manage Blogs
              </h3>
              {blogs.length === 0 ? (
                <p style={{ color: 'var(--color-text-light)', textAlign: 'center', padding: '2rem' }}>
                  No blogs yet. Create your first one above!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {blogs.map(blog => (
                    <div 
                      key={blog.id}
                      style={{
                        padding: '1rem',
                        border: '2px solid var(--color-border)',
                        borderRadius: '8px',
                        background: 'var(--color-bg-secondary)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                          {blog.title}
                          {blog.is_draft && (
                            <span style={{ 
                              marginLeft: '0.5rem', 
                              fontSize: '0.75rem', 
                              padding: '0.125rem 0.5rem',
                              background: 'orange',
                              color: 'black',
                              borderRadius: '4px',
                              fontWeight: 700
                            }}>
                              DRAFT
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                          {blog.category} • {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEditBlog(blog)}
                          className="form-button"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBlog(blog.id)}
                          className="form-button"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: 'rgba(255, 0, 0, 0.2)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {activeTab === 'notes' && (
        <section className="admin-section">
          <h3 className="twitter-sidebar-title" style={{ marginBottom: 'var(--space-md)', fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
            {editingNote ? 'Edit Note' : 'Create Note'}
          </h3>

          <form onSubmit={submitNote} className="add-content-form">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Tags (comma separated, optional)</label>
              <input className="form-input" value={noteTags} onChange={(e) => setNoteTags(e.target.value)} placeholder="raw, idea, life" />
            </div>

            <div className="form-group">
              <label className="form-label">Content (raw, optional)</label>
              <textarea
                className="form-textarea"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write anything. This is a raw note."
                rows="10"
                style={{ minHeight: '220px' }}
              />
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="form-button form-button-primary" type="submit">
                {editingNote ? 'Update Note' : 'Publish Note'}
              </button>
              {editingNote ? (
                <button type="button" className="form-button" onClick={cancelEditNote} style={{ background: 'var(--color-bg-secondary)' }}>
                  Cancel Edit
                </button>
              ) : (
                <button type="button" className="form-button" onClick={() => setShowManageNotes(!showManageNotes)} style={{ background: 'var(--color-bg-secondary)' }}>
                  {showManageNotes ? 'Hide' : 'Manage'} Notes
                </button>
              )}
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

          {showManageNotes && (
            <div style={{ marginTop: '2rem' }}>
              <h3 className="twitter-sidebar-title" style={{ marginBottom: 'var(--space-md)', fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
                Manage Notes
              </h3>
              {notes.length === 0 ? (
                <p style={{ color: 'var(--color-text-light)', textAlign: 'center', padding: '2rem' }}>
                  No notes yet. Create your first one above!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {notes.map(n => (
                    <div
                      key={n.id}
                      style={{
                        padding: '1rem',
                        border: '2px solid var(--color-border)',
                        borderRadius: '8px',
                        background: 'var(--color-bg-secondary)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{n.title}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                          {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleEditNote(n)} className="form-button" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDeleteNote(n.id)} className="form-button" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: 'rgba(255, 0, 0, 0.2)' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Games Form */}
      {activeTab === 'games' && (
        <section className="admin-section">
          <h3 className="twitter-sidebar-title" style={{ marginBottom: 'var(--space-md)', fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
            Add Game Entry
          </h3>
          <form onSubmit={submitLog} className="add-content-form">
            <div className="form-group">
              <label className="form-label">Game Title</label>
              <input 
                className="form-input" 
                value={logTitle} 
                onChange={(e) => setLogTitle(e.target.value)} 
                placeholder="The Legend of Zelda: Breath of the Wild"
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Platform</label>
                <select 
                  className="form-input" 
                  value={gamePlatform} 
                  onChange={(e) => setGamePlatform(e.target.value)}
                >
                  <option value="">Select Platform</option>
                  <option value="PC">PC</option>
                  <option value="PlayStation 5">PlayStation 5</option>
                  <option value="PlayStation 4">PlayStation 4</option>
                  <option value="Xbox Series X/S">Xbox Series X/S</option>
                  <option value="Xbox One">Xbox One</option>
                  <option value="Nintendo Switch">Nintendo Switch</option>
                  <option value="Nintendo 3DS">Nintendo 3DS</option>
                  <option value="Mobile">Mobile</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Genre</label>
                <select 
                  className="form-input" 
                  value={gameGenre} 
                  onChange={(e) => setGameGenre(e.target.value)}
                >
                  <option value="">Select Genre</option>
                  <option value="Action">Action</option>
                  <option value="Adventure">Adventure</option>
                  <option value="RPG">RPG</option>
                  <option value="Strategy">Strategy</option>
                  <option value="Simulation">Simulation</option>
                  <option value="Sports">Sports</option>
                  <option value="Racing">Racing</option>
                  <option value="Puzzle">Puzzle</option>
                  <option value="Horror">Horror</option>
                  <option value="Platformer">Platformer</option>
                  <option value="Fighting">Fighting</option>
                  <option value="Shooter">Shooter</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Release Year</label>
                <input 
                  className="form-input" 
                  type="number"
                  value={gameReleaseYear} 
                  onChange={(e) => setGameReleaseYear(e.target.value)} 
                  placeholder="2023"
                  min="1950"
                  max={new Date().getFullYear() + 2}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  className="form-input" 
                  value={gameStatus} 
                  onChange={(e) => setGameStatus(e.target.value)}
                >
                  <option value="completed">Completed</option>
                  <option value="playing">Playing</option>
                  <option value="dropped">Dropped</option>
                  <option value="on-hold">On Hold</option>
                  <option value="wishlist">Wishlist</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Rating (1-10)</label>
                <input 
                  className="form-input" 
                  type="number" 
                  min="1" 
                  max="10" 
                  value={logRating} 
                  onChange={(e) => setLogRating(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hours Played</label>
                <input 
                  className="form-input" 
                  type="number"
                  step="0.5"
                  value={gameHoursPlayed} 
                  onChange={(e) => setGameHoursPlayed(e.target.value)} 
                  placeholder="25.5"
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Cover Image</label>
              <input 
                className="form-input" 
                type="file"
                accept="image/*"
                onChange={(e) => setGameCoverImageFile(e.target.files[0])}
              />
              <p style={{ 
                fontSize: '0.875rem', 
                color: 'var(--color-text-light)', 
                marginTop: '0.25rem' 
              }}>
                Upload a cover image (optional, max 5MB)
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Review / Notes</label>
              <textarea 
                className="form-textarea" 
                value={logContent} 
                onChange={(e) => setLogContent(e.target.value)}
                placeholder="Your thoughts, review, or notes about this game..."
                rows="6"
                style={{ minHeight: '120px' }}
              />
            </div>

            <div className="form-actions">
              <button className="form-button form-button-primary" type="submit">
                Add Game
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

      {/* Movies, Series Form */}
      {['movies', 'series'].includes(activeTab) && (
        <section className="admin-section">
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
                placeholder={`Name of the ${activeTab === 'series' ? 'TV series' : 'movie'}`}
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Director</label>
              <input 
                className="form-input" 
                value={screenDirector} 
                onChange={(e) => setScreenDirector(e.target.value)} 
                placeholder="Director name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Genre</label>
              <input 
                className="form-input" 
                value={screenGenre} 
                onChange={(e) => setScreenGenre(e.target.value)} 
                placeholder="Action, Drama, Sci-Fi, etc."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Release Year</label>
              <input 
                className="form-input" 
                type="number" 
                value={screenYear} 
                onChange={(e) => setScreenYear(e.target.value)} 
                placeholder="2024"
                min="1900"
                max="2100"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cover Image</label>
              <input 
                className="form-input" 
                type="file" 
                accept="image/*"
                onChange={(e) => setScreenCoverImageFile(e.target.files[0])}
                style={{
                  padding: '0.5rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              />
              <small style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                Upload a cover image (optional, max 5MB)
              </small>
            </div>
            <div className="form-group">
              <label className="form-label">Rating (1-10)</label>
              <input 
                className="form-input" 
                type="number" 
                min="1" 
                max="10" 
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

      {/* Books Form */}
      {activeTab === 'books' && (
        <section className="admin-section">
          <h3 className="twitter-sidebar-title" style={{ marginBottom: 'var(--space-md)', fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
            Add Book Entry
          </h3>
          <form onSubmit={submitLog} className="add-content-form">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input 
                className="form-input" 
                value={logTitle} 
                onChange={(e) => setLogTitle(e.target.value)} 
                placeholder="Name of the book"
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Author</label>
              <input 
                className="form-input" 
                value={bookAuthor} 
                onChange={(e) => setBookAuthor(e.target.value)} 
                placeholder="Author name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Genre</label>
              <input 
                className="form-input" 
                value={bookGenre} 
                onChange={(e) => setBookGenre(e.target.value)} 
                placeholder="Fiction, Non-fiction, Mystery, etc."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Publication Year</label>
              <input 
                className="form-input" 
                type="number" 
                value={bookYear} 
                onChange={(e) => setBookYear(e.target.value)} 
                placeholder="2024"
                min="1000"
                max="2100"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cover Image</label>
              <input 
                className="form-input" 
                type="file" 
                accept="image/*"
                onChange={(e) => setBookCoverImageFile(e.target.files[0])}
                style={{
                  padding: '0.5rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              />
              <small style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                Upload a cover image (optional, max 5MB)
              </small>
            </div>
            <div className="form-group">
              <label className="form-label">Rating (1-10)</label>
              <input 
                className="form-input" 
                type="number" 
                min="1" 
                max="10" 
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

      {/* Albums Management */}
      {activeTab === 'music' && (
        <>
          <section className="admin-section">
            <h3 className="twitter-sidebar-title" style={{ marginBottom: 'var(--space-md)', fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
              Create Album
            </h3>
            <form onSubmit={submitMusic} className="add-content-form">
              <div className="form-group">
                <label className="form-label">Album Name</label>
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
                  placeholder="A short description of the album"
                  rows="3"
                  style={{ minHeight: '80px' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Cover Image (optional)</label>
                <input
                  className="form-input"
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files[0];
                    setPlaylistCoverFile(file);
                    setPlaylistCoverPreview(file ? URL.createObjectURL(file) : null);
                  }}
                  style={{ padding: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}
                />
                {playlistCoverPreview && (
                  <img src={playlistCoverPreview} alt="Cover Preview" style={{ marginTop: 8, maxWidth: 120, borderRadius: 8 }} />
                )}
                <small style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                  Upload a cover image (optional, max 5MB)
                </small>
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
                  Create Album
                </button>
              </div>
            </form>
          </section>

          <section className="admin-section">
            <h3 className="twitter-sidebar-title" style={{ marginBottom: 'var(--space-md)', fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
              Manage Albums
            </h3>
            {playlists.length === 0 ? (
              <p className="post-content">No albums yet. Create one above.</p>
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
                      <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                        <label className="form-label">Cover Image (optional)</label>
                        <input
                          className="form-input"
                          type="file"
                          accept="image/*"
                          id={`edit-cover-${p.id}`}
                          onChange={e => {
                            const file = e.target.files[0];
                            setPlaylistCoverFile(file);
                            setPlaylistCoverPreview(file ? URL.createObjectURL(file) : null);
                          }}
                          style={{ padding: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}
                        />
                        {(playlistCoverPreview || p.cover_image_url) && (
                          <img src={playlistCoverPreview || p.cover_image_url} alt="Cover Preview" style={{ marginTop: 8, maxWidth: 120, borderRadius: 8 }} />
                        )}
                        <small style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                          Upload a cover image (optional, max 5MB)
                        </small>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="form-button" 
                          onClick={async () => {
                            const name = document.getElementById(`edit-name-${p.id}`).value;
                            const desc = document.getElementById(`edit-desc-${p.id}`).value;
                            const spotify = document.getElementById(`edit-spotify-${p.id}`).value;
                            const youtube = document.getElementById(`edit-youtube-${p.id}`).value;
                            let coverImageUrl = p.cover_image_url;
                            if (playlistCoverFile) {
                              setStatus('Uploading cover image...');
                              try {
                                coverImageUrl = await uploadCoverImage(playlistCoverFile);
                              } catch (uploadError) {
                                setStatus(`Upload failed: ${uploadError.message}`);
                                return;
                              }
                            }
                            handleUpdatePlaylist(p.id, name, desc, spotify, youtube, coverImageUrl);
                            setPlaylistCoverFile(null);
                            setPlaylistCoverPreview(null);
                          }}
                          style={{ fontSize: '0.875rem' }}
                        >
                          Save
                        </button>
                        <button 
                          className="form-button" 
                          onClick={() => { setEditingPlaylist(null); setPlaylistCoverFile(null); setPlaylistCoverPreview(null); }}
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
      </div>
    </div>
  );
}








