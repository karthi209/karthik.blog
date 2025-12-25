import { useEffect, useState, useCallback, useRef } from 'react';
import { adminCreateBlog, getStoredAdminToken, clearStoredAdminToken, adminListBlogs, adminUpdateBlog, adminDeleteBlog } from '../services/admin';
import { adminListNotes, adminCreateNote, adminUpdateNote, adminDeleteNote } from '../services/notes-admin';
import { adminCreatePlaylist, adminUpdatePlaylist, adminDeletePlaylist, adminAddSong, adminAddSongsBulk, adminDeleteSong, fetchPlaylists } from '../services/playlists-admin';
import { adminListAnthologies, adminCreateAnthology, adminUpdateAnthology, adminDeleteAnthology } from '../services/anthologies-admin';
import ReactQuill from 'react-quill';
import "quill/dist/quill.snow.css";
import '../styles/components/AdminPanel.css';
import AuthRequiredModal from './AuthRequiredModal';
import { hasSeenAuthDisclaimer, markAuthDisclaimerSeen } from '../services/auth';

const API = import.meta.env.VITE_API_URL || '/api';

const LIBRARY_CATEGORIES = [
  { value: 'games', label: 'Games' },
  { value: 'movies', label: 'Movies' },
  { value: 'tv', label: 'TV Series' },
  { value: 'books', label: 'Books' },
  { value: 'music', label: 'Music' }
];

const ITEMS_PER_PAGE = 10;

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('blogs');
  const [subTab, setSubTab] = useState('blogs_list');
  const [status, setStatus] = useState('');
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const quillRef = useRef(null);

  // === BLOG STATE ===
  const [blogTitle, setBlogTitle] = useState('');
  const [blogCategory, setBlogCategory] = useState('');
  const [blogTags, setBlogTags] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogIsDraft, setBlogIsDraft] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const [editingBlog, setEditingBlog] = useState(null);
  const [showManageBlogs, setShowManageBlogs] = useState(false);
  const [blogSearchTerm, setBlogSearchTerm] = useState('');
  const [blogCurrentPage, setBlogCurrentPage] = useState(1);
  const [selectedAnthologyForBlog, setSelectedAnthologyForBlog] = useState('');

  // === ANTHOLOGY STATE ===
  const [anthologies, setAnthologies] = useState([]);
  const [editingAnthology, setEditingAnthology] = useState(null);
  const [showManageAnthologies, setShowManageAnthologies] = useState(false);
  const [anthologyTitle, setAnthologyTitle] = useState('');
  const [anthologySlug, setAnthologySlug] = useState('');
  const [anthologyDesc, setAnthologyDesc] = useState('');
  const [anthologyPublic, setAnthologyPublic] = useState(true);

  // === NOTE STATE ===
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState('');
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [showManageNotes, setShowManageNotes] = useState(false);

  // === LIBRARY STATE (UNIFIED) ===
  const [libraryCategory, setLibraryCategory] = useState('games');
  const [libraryTitle, setLibraryTitle] = useState('');
  const [libraryContent, setLibraryContent] = useState('');
  const [libraryRating, setLibraryRating] = useState(10);
  const [libraryCoverFile, setLibraryCoverFile] = useState(null);
  const [libraryCoverPreview, setLibraryCoverPreview] = useState(null);
  const [libraryStatus, setLibraryStatus] = useState('completed');

  // Category-specific fields
  const [libraryPlatform, setLibraryPlatform] = useState('');
  const [libraryGenre, setLibraryGenre] = useState('');
  const [libraryReleaseYear, setLibraryReleaseYear] = useState('');
  const [libraryHoursPlayed, setLibraryHoursPlayed] = useState('');
  const [libraryDirector, setLibraryDirector] = useState('');
  const [libraryDeveloper, setLibraryDeveloper] = useState(''); // New
  const [libraryArtist, setLibraryArtist] = useState('');       // New
  const [libraryYear, setLibraryYear] = useState('');
  const [libraryAuthor, setLibraryAuthor] = useState('');
  const [libraryDescription, setLibraryDescription] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [youtubeMusicUrl, setYoutubeMusicUrl] = useState('');

  // Project specific
  const [projectTech, setProjectTech] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [projectGithubUrl, setProjectGithubUrl] = useState('');

  // Music (playlist) specific
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songAlbum, setSongAlbum] = useState('');
  const [songYear, setSongYear] = useState('');
  const [bulkSongs, setBulkSongs] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);

  // Library management
  const [libraryItems, setLibraryItems] = useState([]);
  const [showManageLibrary, setShowManageLibrary] = useState(false);
  const [editingLibraryItem, setEditingLibraryItem] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    const token = getStoredAdminToken();
    if (token) {
      verifyToken(token);
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      if (urlToken) {
        setStoredAdminToken(urlToken);
        verifyToken(urlToken);
        window.history.replaceState({}, document.title, '/admin');
      } else {
        setLoginModalOpen(true);
      }
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${API}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        clearStoredAdminToken();
        setLoginError('Session expired. Please login again.');
        setLoginModalOpen(true);
      }
    } catch {
      clearStoredAdminToken();
      setLoginModalOpen(true);
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

  // === IMAGE UPLOAD ===
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
        const formData = new FormData();
        formData.append('image', file);
        const token = getStoredAdminToken();
        const response = await fetch(`${API}/upload/image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        const imageUrl = data.filePath;

        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection();
          quill.insertEmbed(range?.index || 0, 'image', imageUrl);
        }
        setStatus('Image uploaded!');
        setTimeout(() => setStatus(''), 2000);
      } catch (err) {
        setStatus(`Upload error: ${err.message}`);
      }
    };
  }, []);

  const quillModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean']
      ],
      handlers: { image: handleImageUpload }
    }
  };

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
    if (!res.ok) throw new Error('Cover upload failed');
    const data = await res.json();
    return data.cover_image_url;
  };

  // === BLOG FUNCTIONS ===


  // === ANTHOLOGY FUNCTIONS ===
  const loadAnthologies = async () => {
    try {
      const result = await adminListAnthologies();
      // adminListAnthologies now returns data array directly
      setAnthologies(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error(error);
    }
  };

  const submitBlog = async (e, saveAsDraft = false) => {
    e.preventDefault();
    try {
      const isDraftValue = saveAsDraft || blogIsDraft;
      const tagsArray = blogTags ? blogTags.split(',').map((t) => t.trim()).filter(Boolean) : null;

      let blogResult;
      if (editingBlog) {
        setStatus('Updating blog...');
        blogResult = await adminUpdateBlog(editingBlog.id, {
          title: blogTitle,
          content: blogContent,
          category: blogCategory?.toUpperCase(),
          tags: tagsArray,
          is_draft: isDraftValue
        });
        setStatus('Blog updated!');
        setEditingBlog(null);
      } else {
        setStatus(isDraftValue ? 'Saving draft...' : 'Publishing blog...');
        blogResult = await adminCreateBlog({
          title: blogTitle,
          content: blogContent,
          category: blogCategory?.toUpperCase(),
          tags: tagsArray,
          is_draft: isDraftValue
        });
        setStatus(isDraftValue ? 'Draft saved!' : 'Blog published!');
      }

      // Handle Anthology Association
      if (selectedAnthologyForBlog) {
        setStatus('Linking to anthology...');
        const anthology = anthologies.find(a => a.id === parseInt(selectedAnthologyForBlog));
        if (anthology) {
          const currentBlogs = anthology.blogs || [];
          // Extract ID from response (which wraps it in 'blog' property) or direct object
          const newBlogId = blogResult.blog ? (blogResult.blog.id || blogResult.blog._id) : (blogResult.id || blogResult._id);

          if (newBlogId && !currentBlogs.includes(newBlogId)) {
            await adminUpdateAnthology(anthology.id, {
              ...anthology,
              blogs: [...currentBlogs, newBlogId]
            });
            setStatus('Linked to anthology!');
          }
        }
      }

      setBlogTitle('');
      setBlogCategory('');
      setBlogTags('');
      setBlogContent('');
      setBlogIsDraft(false);
      setSelectedAnthologyForBlog('');
      if (showManageBlogs) loadBlogs();
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setStatus(`Error: ${err.message || 'Failed'}`);
    }
  };

  const loadBlogs = async () => {
    try {
      const result = await adminListBlogs();
      // adminListBlogs now returns data array directly
      setBlogs(Array.isArray(result) ? result : []);
    } catch (error) {
      setStatus('Failed to load blogs');
    }
  };

  const handleEditBlog = async (blog) => {
    try {
      const response = await fetch(`${API}/blogs/${blog.id}`);
      if (!response.ok) throw new Error('Failed to fetch blog');
      const result = await response.json();
      // Backend returns {success: true, data: {...}}
      const fullBlog = result.data || result;
      setBlogTitle(fullBlog.title);
      setBlogCategory(fullBlog.category);
      setBlogTags(fullBlog.tags ? fullBlog.tags.join(', ') : '');
      setBlogContent(fullBlog.content);
      setBlogIsDraft(fullBlog.is_draft || false);
      setEditingBlog(blog);
      setShowManageBlogs(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setStatus('Failed to load blog');
    }
  };

  const handleDeleteBlog = async (id) => {
    if (!confirm('Delete this blog?')) return;
    try {
      setStatus('Deleting...');
      await adminDeleteBlog(id);
      setStatus('Blog deleted!');
      loadBlogs();
      setTimeout(() => setStatus(''), 2000);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const cancelEditBlog = () => {
    setEditingBlog(null);
    setBlogTitle('');
    setBlogCategory('');
    setBlogTags('');
    setBlogContent('');
    setBlogIsDraft(false);
  };

  // Filter and paginate blogs
  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(blogSearchTerm.toLowerCase()) ||
    blog.category?.toLowerCase().includes(blogSearchTerm.toLowerCase())
  );

  const totalBlogPages = Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE);
  const paginatedBlogs = filteredBlogs.slice(
    (blogCurrentPage - 1) * ITEMS_PER_PAGE,
    blogCurrentPage * ITEMS_PER_PAGE
  );

  const submitAnthology = async (e) => {
    e.preventDefault();
    if (!anthologyTitle || !anthologySlug) {
      setStatus('Title and Slug required');
      return;
    }
    try {
      if (editingAnthology) {
        setStatus('Updating anthology...');
        await adminUpdateAnthology(editingAnthology.id, {
          title: anthologyTitle,
          slug: anthologySlug,
          description: anthologyDesc,
          is_public: anthologyPublic,
          blogs: editingAnthology.blogs
        });
        setStatus('Anthology updated!');
      } else {
        setStatus('Creating anthology...');
        await adminCreateAnthology({
          title: anthologyTitle,
          slug: anthologySlug,
          description: anthologyDesc,
          is_public: anthologyPublic,
          blogs: []
        });
        setStatus('Anthology created!');
      }
      resetAnthologyForm();
      loadAnthologies();
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const resetAnthologyForm = () => {
    setEditingAnthology(null);
    setAnthologyTitle('');
    setAnthologySlug('');
    setAnthologyDesc('');
    setAnthologyPublic(true);
  };

  const handleEditAnthology = (anth) => {
    setEditingAnthology(anth);
    setAnthologyTitle(anth.title);
    setAnthologySlug(anth.slug);
    setAnthologyDesc(anth.description || '');
    setAnthologyPublic(anth.is_public);
    setShowManageAnthologies(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAnthology = async (id) => {
    if (!confirm('Delete this anthology?')) return;
    try {
      await adminDeleteAnthology(id);
      setStatus('Anthology deleted');
      loadAnthologies();
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  // === NOTE FUNCTIONS ===
  const submitNote = async (e) => {
    e.preventDefault();
    try {
      if (!noteTitle.trim()) {
        setStatus('Error: Title is required');
        return;
      }

      const tagsArray = noteTags ? noteTags.split(',').map(t => t.trim()).filter(Boolean) : null;

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

  const loadNotes = async () => {
    try {
      const result = await adminListNotes();
      // adminListNotes now returns data array directly
      setNotes(Array.isArray(result) ? result : []);
    } catch (error) {
      setStatus('Failed to load notes');
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
    if (!confirm('Delete this note?')) return;
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

  const cancelEditNote = () => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteTags('');
  };

  // === LIBRARY FUNCTIONS ===
  const handleLibraryCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLibraryCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLibraryCoverPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const submitLibrary = async (e) => {
    e.preventDefault();
    try {
      const isEditing = !!editingLibraryItem;
      setStatus(isEditing ? `Updating ${libraryCategory} entry...` : `Creating ${libraryCategory} entry...`);

      let coverImageUrl = null;
      if (libraryCoverFile) {
        setStatus('Uploading cover...');
        coverImageUrl = await uploadCoverImage(libraryCoverFile);
      } else if (isEditing && libraryCoverPreview) {
        // Keep existing cover if preview exists but no new file
        // (Logic handled by backend usually, but here we might need to pass the existing URL if we had it stored)
        // For simplicity, if no new file is uploaded, we don't send cover_image_url unless we want to change it.
        // But our API might expect it. Let's see. 
        // Actually, if we don't send it, it might nullify it or keep it depending on backend.
        // Let's assume backend keeps it if undefined, or we should have stored the original URL.
        // We'll see how handleEdit populates it.
        if (editingLibraryItem.cover_image_url) {
          coverImageUrl = editingLibraryItem.cover_image_url;
        }
      }

      const token = getStoredAdminToken();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };

      const payload = {
        title: libraryTitle,
        category: libraryCategory, // Changed from type to category for consistency with backend
        // Common fields
        rating: libraryRating ? String(libraryRating) : null,
        content: libraryContent, // mapped to Review/Thoughts
        cover_image_url: coverImageUrl,

        // Category specific (will be merged into metadata by backend)
        platform: libraryCategory === 'games' ? libraryPlatform : undefined,
        developer: libraryCategory === 'games' ? libraryDeveloper : undefined, // New
        genre: libraryGenre,
        release_year: libraryReleaseYear,
        hours_played: libraryHoursPlayed,
        status: libraryStatus,
        played_on: libraryCategory === 'games' ? new Date().toISOString().split('T')[0] : undefined,

        director: (libraryCategory === 'movies' || libraryCategory === 'tv') ? libraryDirector : undefined,
        year: (libraryCategory === 'movies' || libraryCategory === 'tv' || libraryCategory === 'books') ? libraryYear : undefined,

        author: libraryCategory === 'books' ? libraryAuthor : undefined,

        // Music specific
        artist: libraryCategory === 'music' ? libraryArtist : undefined, // New
        description: libraryCategory === 'music' ? libraryDescription : undefined,
        spotify_url: libraryCategory === 'music' ? spotifyUrl : undefined,
        youtube_music_url: libraryCategory === 'music' ? youtubeMusicUrl : undefined,

        // Project specific
        tech: libraryCategory === 'projects' ? projectTech.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        url: libraryCategory === 'projects' ? projectUrl : undefined,
        github_url: libraryCategory === 'projects' ? projectGithubUrl : undefined
      };

      // Clean undefined
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      let response;
      if (isEditing) {
        // Update
        const endpoint = libraryCategory === 'music'
          // Music might still be special if playlists table used? No, migrated.
          // But generic endpoint should be PUT /api/logs/:id
          ? `${API}/logs/${editingLibraryItem.log_id || editingLibraryItem.id}`
          : `${API}/logs/${editingLibraryItem.log_id || editingLibraryItem.id}`;

        response = await fetch(endpoint, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        // Create
        // Unified creation using payload directly
        response = await fetch(`${API}/logs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            category: libraryCategory,
            ...payload
          })
        });
      }

      if (response && !response.ok) throw new Error('Operation failed');

      setStatus(`${libraryCategory} entry ${isEditing ? 'updated' : 'created'}!`);
      resetLibraryForm();
      setEditingLibraryItem(null);
      if (showManageLibrary) {
        if (libraryCategory === 'music') loadPlaylists();
        else loadLibraryItems();
      }
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message || 'Failed'}`);
    }
  };

  const resetLibraryForm = () => {
    setLibraryTitle('');
    setLibraryContent('');
    setLibraryRating(10);
    setLibraryCoverFile(null);
    setLibraryCoverPreview(null);
    setLibraryStatus('completed');
    setLibraryPlatform('');
    setLibraryGenre('');
    setLibraryReleaseYear('');
    setLibraryHoursPlayed('');
    setLibraryDirector('');
    setLibraryDeveloper(''); // New
    setLibraryArtist('');    // New
    setLibraryYear('');
    setLibraryAuthor('');
    setLibraryDescription('');
    setSpotifyUrl('');
    setYoutubeMusicUrl('');
    setProjectTech('');
    setProjectUrl('');
    setProjectGithubUrl('');
    setEditingLibraryItem(null);
  };

  const handleEditLibraryItem = (item) => {
    setEditingLibraryItem(item);
    setLibraryTitle(item.title || '');
    // Fix preview URL handling
    const imgUrl = item.image || item.cover_image || item.cover_image_url;
    let previewUrl = imgUrl;
    if (imgUrl && imgUrl.startsWith('/') && !imgUrl.startsWith('http')) {
      const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
      previewUrl = `${apiBase}${imgUrl}`;
    }
    setLibraryCoverPreview(previewUrl || null);
    setLibraryRating(item.rating ? parseInt(item.rating) : 10);

    // Details might be flattened or in details object depending on how we fetched it
    // The list endpoint likely returns flattened structure from view or raw columns
    // Let's assume flattened for now based on previous code

    const details = item.details || {}; // Fallback if fields are inside details
    setLibraryContent(item.content || item.description || details.review || '');
    setLibraryPlatform(item.platform || details.platform || '');
    setLibraryGenre(item.genre || details.genre || '');
    setLibraryReleaseYear(item.release_year || details.release_year || '');
    setLibraryHoursPlayed(item.hours_played || details.hours_played || '');
    setLibraryStatus(item.status || details.status || 'completed');

    setLibraryDirector(item.director || details.director || (item.metadata && item.metadata.director) || '');
    setLibraryYear(item.year || details.year || '');

    setLibraryAuthor(item.author || details.author || '');

    setLibraryDeveloper(item.developer || details.developer || (item.metadata && item.metadata.developer) || ''); // New
    setLibraryArtist(item.artist || details.artist || (item.metadata && item.metadata.artist) || '');       // New

    // Music
    setLibraryDescription(item.description || details.description || '');
    setSpotifyUrl(item.spotify_url || details.spotify_url || '');
    setYoutubeMusicUrl(item.youtube_music_url || details.youtube_music_url || '');

    setProjectTech(item.tech ? (Array.isArray(item.tech) ? item.tech.join(', ') : item.tech) : (details.tech ? (Array.isArray(details.tech) ? details.tech.join(', ') : details.tech) : ''));
    setProjectUrl(item.url || details.url || '');
    setProjectGithubUrl(item.github_url || details.github_url || '');

    setShowManageLibrary(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditLibrary = () => {
    resetLibraryForm();
  };

  const loadLibraryItems = async (category) => {
    try {
      const cat = category || libraryCategory;
      const response = await fetch(`${API}/logs/${cat}`);
      if (!response.ok) throw new Error('Failed to fetch library items');
      const result = await response.json();
      // Backend returns {success: true, data: [...], pagination: {...}}
      const data = result.data || result;
      setLibraryItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setStatus('Failed to load library items');
    }
  };

  const loadPlaylists = async () => {
    try {
      const data = await fetchPlaylists();
      setLibraryItems(data);
    } catch (error) {
      // Silent fail
    }
  };

  const handleDeleteLibraryItem = async (logId) => {
    if (!confirm('Delete this library item?')) return;
    try {
      setStatus('Deleting...');
      const token = getStoredAdminToken();
      const response = await fetch(`${API}/logs/${logId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Delete failed');
      setStatus('Library item deleted!');
      loadLibraryItems();
      setTimeout(() => setStatus(''), 2000);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };


  const handleAddSong = async (playlistId) => {
    if (!songTitle.trim() || !songArtist.trim()) {
      setStatus('Song title and artist required');
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
        setStatus('No valid songs. Format: Title | Artist | Album | Year');
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
    if (!confirm('Remove this song?')) return;
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
      <div className="admin-panel">
        <AuthRequiredModal
          open={loginModalOpen}
          title="Admin Login"
          message="Login is only required for admin actions. Reading is always open."
          showFirstTimeDisclaimer={!hasSeenAuthDisclaimer()}
          onClose={() => setLoginModalOpen(false)}
          onLogin={() => {
            if (!hasSeenAuthDisclaimer()) markAuthDisclaimerSeen();
            handleLogin({ preventDefault: () => { } });
          }}
        />
        <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Admin Login</h2>
          {loginError && (
            <div style={{ color: 'var(--color-accent)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
              {loginError}
            </div>
          )}
          <button onClick={handleLogin} className="admin-btn admin-btn-primary" style={{ width: '100%' }}>
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  // Main admin panel
  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1 className="admin-title">Admin Panel</h1>
        <button onClick={handleLogout} className="admin-btn">Logout</button>
      </div>

      {status && (
        <div className="admin-status">{status}</div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        {['blogs', 'notes', 'projects', 'library'].map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab === 'blogs') setSubTab('blogs_list');
            }}
            className={`admin-tab ${activeTab === tab ? 'active' : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* BLOGS TAB */}
      {activeTab === 'blogs' && (
        <div>
          {/* Sub Tabs for Blogs */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
            <button
              onClick={() => setSubTab('blogs_list')}
              style={{
                background: 'none',
                border: 'none',
                color: subTab === 'blogs_list' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontWeight: subTab === 'blogs_list' ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Posts
            </button>
            <button
              onClick={() => setSubTab('anthologies')}
              style={{
                background: 'none',
                border: 'none',
                color: subTab === 'anthologies' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontWeight: subTab === 'anthologies' ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Anthology
            </button>
          </div>

          {subTab === 'anthologies' ? (
            <div>
              {showManageAnthologies ? (
                <div className="admin-manage">
                  <div className="admin-manage-header">
                    <h3 className="admin-manage-title">Manage Series</h3>
                    <div>
                      <button onClick={loadAnthologies} className="admin-btn" style={{ marginRight: '0.5rem' }}>Refresh</button>
                      <button onClick={() => setShowManageAnthologies(false)} className="admin-btn">Hide</button>
                    </div>
                  </div>
                  <div className="admin-item-list">
                    {anthologies.map(anth => (
                      <div key={anth.id} className="admin-item">
                        <div className="admin-item-info">
                          <div className="admin-item-title">{anth.title}</div>
                          <div className="admin-item-meta">{anth.slug} ({anth.blogs?.length || 0} blogs)</div>
                        </div>
                        <div className="admin-item-actions">
                          <button onClick={() => handleEditAnthology(anth)} className="admin-link-btn">Edit</button>
                          <button onClick={() => handleDeleteAnthology(anth.id)} className="admin-link-btn danger">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <button onClick={() => { setShowManageAnthologies(true); loadAnthologies(); }} className="admin-btn" style={{ marginBottom: '2rem' }}>
                  Manage Series ({anthologies.length})
                </button>
              )}

              <form onSubmit={submitAnthology} className="admin-form">
                {editingAnthology && (
                  <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--color-accent-bg)', borderRadius: '4px', fontSize: '0.9rem' }}>
                    Editing: <strong>{editingAnthology.title}</strong>
                    <button type="button" onClick={resetAnthologyForm} className="admin-link-btn" style={{ marginLeft: '1rem' }}>Cancel</button>
                  </div>
                )}
                <div className="admin-form-group">
                  <label className="admin-label">Title *</label>
                  <input
                    type="text"
                    value={anthologyTitle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAnthologyTitle(val);
                      if (!editingAnthology) {
                        const slug = val.toLowerCase().trim()
                          .replace(/[^\w\s-]/g, '')
                          .replace(/[\s_-]+/g, '-')
                          .replace(/^-+|-+$/g, '');
                        setAnthologySlug(slug);
                      }
                    }}
                    required
                    className="admin-input"
                    placeholder="Series Title"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Description</label>
                  <textarea value={anthologyDesc} onChange={(e) => setAnthologyDesc(e.target.value)} rows="3" className="admin-textarea" placeholder="Optional description..." />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">
                    <input type="checkbox" checked={anthologyPublic} onChange={(e) => setAnthologyPublic(e.target.checked)} style={{ marginRight: '0.5rem' }} />
                    Publicly Visible
                  </label>
                </div>
                <div className="admin-btn-group">
                  <button type="submit" className="admin-btn admin-btn-primary">
                    {editingAnthology ? 'Update Series' : 'Create Series'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              {editingBlog && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--color-accent-bg)', borderRadius: '4px', fontSize: '0.9rem' }}>
                  Editing: <strong>{editingBlog.title}</strong>
                  <button onClick={cancelEditBlog} className="admin-link-btn" style={{ marginLeft: '1rem' }}>Cancel</button>
                </div>
              )}
              {/* REST OF BLOG FORM (hidden/shown by subTab check implictly by else block) */}

              {/* Move existing blog list/form here... */}


              {showManageBlogs && (
                <div className="admin-manage">
                  <div className="admin-manage-header">
                    <h3 className="admin-manage-title">Manage Blogs</h3>
                    <button onClick={() => setShowManageBlogs(false)} className="admin-btn">Hide</button>
                  </div>

                  <div className="admin-search">
                    <input
                      type="text"
                      placeholder="Search blogs by title or category..."
                      value={blogSearchTerm}
                      onChange={(e) => {
                        setBlogSearchTerm(e.target.value);
                        setBlogCurrentPage(1);
                      }}
                      className="admin-search-input"
                    />
                  </div>

                  {filteredBlogs.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                      {blogSearchTerm ? 'No blogs found matching your search.' : 'No blogs yet. Create your first one!'}
                    </p>
                  ) : (
                    <>
                      <div className="admin-item-list">
                        {paginatedBlogs.map(blog => (
                          <div key={blog.id} className="admin-item">
                            <div className="admin-item-info">
                              <div className="admin-item-title">
                                {blog.title}
                                {blog.is_draft && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--color-accent)' }}>(Draft)</span>}
                              </div>
                              <div className="admin-item-meta">
                                {blog.category} • {new Date(blog.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="admin-item-actions">
                              <button onClick={() => handleEditBlog(blog)} className="admin-link-btn">Edit</button>
                              <button onClick={() => handleDeleteBlog(blog.id)} className="admin-link-btn danger">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {totalBlogPages > 1 && (
                        <div className="admin-pagination">
                          <button
                            onClick={() => setBlogCurrentPage(p => Math.max(1, p - 1))}
                            disabled={blogCurrentPage === 1}
                            className="admin-page-btn"
                          >
                            Previous
                          </button>
                          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            Page {blogCurrentPage} of {totalBlogPages}
                          </span>
                          <button
                            onClick={() => setBlogCurrentPage(p => Math.min(totalBlogPages, p + 1))}
                            disabled={blogCurrentPage === totalBlogPages}
                            className="admin-page-btn"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  <button onClick={loadBlogs} className="admin-btn" style={{ marginTop: '1rem' }}>Refresh List</button>
                </div>
              )}

              {!showManageBlogs && (
                <button onClick={() => { setShowManageBlogs(true); loadBlogs(); }} className="admin-btn" style={{ marginBottom: '2rem' }}>
                  Manage Blogs ({blogs.length})
                </button>
              )}

              <form onSubmit={submitBlog} className="admin-form">
                <div className="admin-form-group">
                  <label className="admin-label">Title *</label>
                  <input
                    type="text"
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    required
                    className="admin-input"
                    placeholder="Enter blog title"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Category *</label>
                  <input
                    type="text"
                    value={blogCategory}
                    onChange={(e) => setBlogCategory(e.target.value)}
                    required
                    placeholder="e.g., TECH, PERSONAL, THOUGHTS"
                    className="admin-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Add to Anthology (Optional)</label>
                  <select
                    value={selectedAnthologyForBlog}
                    onChange={(e) => setSelectedAnthologyForBlog(e.target.value)}
                    className="admin-select"
                  >
                    <option value="">-- None --</option>
                    {anthologies.map(a => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    Append this blog to the selected anthology.
                  </p>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Content *</label>
                  <div className="admin-editor">
                    <ReactQuill
                      ref={quillRef}
                      theme="snow"
                      value={blogContent}
                      onChange={setBlogContent}
                      modules={quillModules}
                    />
                  </div>
                </div>

                <div className="admin-btn-group">
                  <button type="submit" className="admin-btn admin-btn-primary">
                    {editingBlog ? 'Update Blog' : 'Publish Blog'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* NOTES TAB */}
      {activeTab === 'notes' && (
        <div>
          {editingNote && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--color-accent-bg)', borderRadius: '4px', fontSize: '0.9rem' }}>
              Editing: <strong>{editingNote.title}</strong>
              <button onClick={cancelEditNote} className="admin-link-btn" style={{ marginLeft: '1rem' }}>Cancel</button>
            </div>
          )}

          {showManageNotes && (
            <div className="admin-manage">
              <div className="admin-manage-header">
                <h3 className="admin-manage-title">Manage Notes</h3>
                <button onClick={() => setShowManageNotes(false)} className="admin-btn">Hide</button>
              </div>

              {notes.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                  No notes yet. Create your first one!
                </p>
              ) : (
                <div className="admin-item-list">
                  {notes.map(note => (
                    <div key={note.id} className="admin-item">
                      <div className="admin-item-info">
                        <div className="admin-item-title">{note.title}</div>
                        <div className="admin-item-meta">
                          {new Date(note.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="admin-item-actions">
                        <button onClick={() => handleEditNote(note)} className="admin-link-btn">Edit</button>
                        <button onClick={() => handleDeleteNote(note.id)} className="admin-link-btn danger">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={loadNotes} className="admin-btn" style={{ marginTop: '1rem' }}>Refresh List</button>
            </div>
          )}

          {!showManageNotes && (
            <button onClick={() => { setShowManageNotes(true); loadNotes(); }} className="admin-btn" style={{ marginBottom: '2rem' }}>
              Manage Notes ({notes.length})
            </button>
          )}

          <form onSubmit={submitNote} className="admin-form">
            <div className="admin-form-group">
              <label className="admin-label">Title *</label>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                required
                className="admin-input"
                placeholder="Enter note title"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Content</label>
              <div className="admin-editor">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={noteContent}
                  onChange={setNoteContent}
                  modules={quillModules}
                />
              </div>
            </div>

            <div className="admin-btn-group">
              <button type="submit" className="admin-btn admin-btn-primary">
                {editingNote ? 'Update Note' : 'Create Note'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PROJECTS TAB */}
      {activeTab === 'projects' && (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Manage Projects</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Showcase your experiments and builds on the /lab page.</p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={async () => {
                setShowManageLibrary(!showManageLibrary);
                if (!showManageLibrary) {
                  try {
                    const response = await fetch(`${API}/projects`);
                    if (!response.ok) throw new Error('Failed to fetch projects');
                    const result = await response.json();
                    // Backend returns {success: true, data: [...]}
                    const data = result.data || result;
                    setLibraryItems(Array.isArray(data) ? data : []);
                  } catch (error) {
                    setStatus('Failed to load projects');
                  }
                }
              }}
              className="admin-btn"
            >
              {showManageLibrary ? 'Hide' : 'Manage'} Projects
            </button>
          </div>

          {showManageLibrary && (
            <div className="admin-manage">
              <h3 className="admin-manage-title" style={{ marginBottom: '1rem' }}>
                Manage Projects
              </h3>

              {libraryItems.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                  No projects found.
                </p>
              ) : (
                <div className="admin-item-list">
                  {libraryItems.map(item => (
                    <div key={item.id} className="admin-item">
                      <div className="admin-item-info">
                        <div className="admin-item-title">{item.title}</div>
                        <div className="admin-item-meta">{item.status || 'project'}</div>
                      </div>
                      <div className="admin-item-actions">
                        <button onClick={() => {
                          handleEditLibraryItem(item);
                        }} className="admin-link-btn">
                          Edit
                        </button>
                        <button onClick={async () => {
                          if (!confirm('Delete this project?')) return;
                          try {
                            setStatus('Deleting...');
                            const token = getStoredAdminToken();
                            const response = await fetch(`${API}/projects/${item.id}`, {
                              method: 'DELETE',
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            if (!response.ok) throw new Error('Delete failed');
                            setStatus('Project deleted!');
                            const refreshResponse = await fetch(`${API}/projects`);
                            if (!refreshResponse.ok) throw new Error('Failed to refresh projects');
                            const refreshResult = await refreshResponse.json();
                            // Backend returns {success: true, data: [...]}
                            const data = refreshResult.data || refreshResult;
                            setLibraryItems(Array.isArray(data) ? data : []);
                            setTimeout(() => setStatus(''), 2000);
                          } catch (error) {
                            setStatus(`Error: ${error.message}`);
                          }
                        }} className="admin-link-btn danger">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={async () => {
                try {
                  const response = await fetch(`${API}/projects`);
                  if (!response.ok) throw new Error('Failed to fetch projects');
                  const result = await response.json();
                  // Backend returns {success: true, data: [...]}
                  const data = result.data || result;
                  setLibraryItems(Array.isArray(data) ? data : []);
                } catch (error) {
                  setStatus('Failed to load projects');
                }
              }} className="admin-btn" style={{ marginTop: '1rem' }}>
                Refresh
              </button>
            </div>
          )}

          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const isEditing = !!editingLibraryItem;
              setStatus(isEditing ? 'Updating project...' : 'Creating project...');

              const token = getStoredAdminToken();
              const payload = {
                title: libraryTitle,
                description: libraryContent,
                tech: projectTech ? projectTech.split(',').map(t => t.trim()).filter(Boolean) : [],
                url: projectUrl || null,
                github_url: projectGithubUrl || null,
                status: libraryStatus
              };

              const response = await fetch(
                isEditing ? `${API}/projects/${editingLibraryItem.id}` : `${API}/projects`,
                {
                  method: isEditing ? 'PUT' : 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                  },
                  body: JSON.stringify(payload)
                }
              );

              if (!response.ok) throw new Error('Operation failed');

              setStatus(`Project ${isEditing ? 'updated' : 'created'}!`);
              resetLibraryForm();
              setEditingLibraryItem(null);

              if (showManageLibrary) {
                const refreshResponse = await fetch(`${API}/projects`);
                if (!refreshResponse.ok) throw new Error('Failed to refresh projects');
                const refreshResult = await refreshResponse.json();
                // Backend returns {success: true, data: [...]}
                const data = refreshResult.data || refreshResult;
                setLibraryItems(Array.isArray(data) ? data : []);
              }
              setTimeout(() => setStatus(''), 2000);
            } catch (err) {
              console.error(err);
              setStatus(`Error: ${err.message || 'Failed'}`);
            }
          }} className="admin-form">
            {editingLibraryItem && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--color-accent-bg)', borderRadius: '4px', fontSize: '0.9rem' }}>
                Editing: <strong>{editingLibraryItem.title}</strong>
                <button type="button" onClick={cancelEditLibrary} className="admin-link-btn" style={{ marginLeft: '1rem' }}>Cancel</button>
              </div>
            )}

            <div className="admin-form-group">
              <label className="admin-label">Project Title *</label>
              <input
                type="text"
                value={libraryTitle}
                onChange={(e) => setLibraryTitle(e.target.value)}
                required
                className="admin-input"
                placeholder="Enter project title"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Tech Stack (comma-separated)</label>
              <input type="text" value={projectTech} onChange={(e) => setProjectTech(e.target.value)} placeholder="e.g. React, Node.js, AI" className="admin-input" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="admin-form-group">
                <label className="admin-label">Project URL</label>
                <input type="url" value={projectUrl} onChange={(e) => setProjectUrl(e.target.value)} placeholder="https://..." className="admin-input" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">GitHub URL</label>
                <input type="url" value={projectGithubUrl} onChange={(e) => setProjectGithubUrl(e.target.value)} placeholder="https://github.com/..." className="admin-input" />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Status</label>
              <select value={libraryStatus} onChange={(e) => setLibraryStatus(e.target.value)} className="admin-select">
                <option value="work_in_progress">Work in Progress</option>
                <option value="idea">Idea</option>
                <option value="maintained">Maintained</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Description *</label>
              <textarea
                value={libraryContent}
                onChange={(e) => setLibraryContent(e.target.value)}
                rows="6"
                className="admin-textarea"
                placeholder="Enter project description"
                required
              />
            </div>



            <div className="admin-btn-group">
              <button type="submit" className="admin-btn admin-btn-primary">
                {editingLibraryItem ? 'Update' : 'Create'} Project
              </button>
              {editingLibraryItem && (
                <button type="button" onClick={cancelEditLibrary} className="admin-btn">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* LIBRARY TAB */}
      {activeTab === 'library' && (
        <div>
          <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={libraryCategory}
              onChange={(e) => {
                setLibraryCategory(e.target.value);
                resetLibraryForm();
                if (e.target.value === 'music') loadPlaylists();
              }}
              className="admin-select"
              style={{ maxWidth: '200px' }}
            >
              {LIBRARY_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setShowManageLibrary(!showManageLibrary);
                if (!showManageLibrary) {
                  loadLibraryItems();
                }
              }}
              className="admin-btn"
            >
              {showManageLibrary ? 'Hide' : 'Manage'} {LIBRARY_CATEGORIES.find(c => c.value === libraryCategory)?.label}
            </button>
          </div>

          {showManageLibrary && (
            <div className="admin-manage">
              <h3 className="admin-manage-title" style={{ marginBottom: '1rem' }}>
                Manage {LIBRARY_CATEGORIES.find(c => c.value === libraryCategory)?.label}
              </h3>

              {libraryItems.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                  No items found.
                </p>
              ) : (
                <div className="admin-item-list">
                  {libraryItems.map(item => (
                    <div key={item.id} className="admin-item">
                      <div className="admin-item-info">
                        <div className="admin-item-title">{item.title}</div>
                        {item.rating && <div className="admin-item-meta">★ {item.rating}/10</div>}
                      </div>
                      <div className="admin-item-actions">
                        <button onClick={() => handleEditLibraryItem(item)} className="admin-link-btn">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteLibraryItem(item.log_id || item.id)} className="admin-link-btn danger">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => loadLibraryItems()} className="admin-btn" style={{ marginTop: '1rem' }}>
                Refresh
              </button>
            </div>
          )}

          <form onSubmit={submitLibrary} className="admin-form">
            {editingLibraryItem && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--color-accent-bg)', borderRadius: '4px', fontSize: '0.9rem' }}>
                Editing: <strong>{editingLibraryItem.title}</strong>
                <button type="button" onClick={cancelEditLibrary} className="admin-link-btn" style={{ marginLeft: '1rem' }}>Cancel</button>
              </div>
            )}

            <div className="admin-form-group">
              <label className="admin-label">Title *</label>
              <input
                type="text"
                value={libraryTitle}
                onChange={(e) => setLibraryTitle(e.target.value)}
                required
                className="admin-input"
                placeholder={`Enter ${libraryCategory} title`}
              />
            </div>

            {libraryCategory === 'music' && (
              <div className="admin-form-group">
                <label className="admin-label">Artist</label>
                <input
                  type="text"
                  value={libraryArtist}
                  onChange={(e) => setLibraryArtist(e.target.value)}
                  placeholder="Artist Name"
                  className="admin-input"
                />
              </div>
            )}

            {libraryCategory === 'games' && (
              <div className="admin-form-group">
                <label className="admin-label">Developer</label>
                <input
                  type="text"
                  value={libraryDeveloper}
                  onChange={(e) => setLibraryDeveloper(e.target.value)}
                  placeholder="Developer Studio"
                  className="admin-input"
                />
              </div>
            )}
            {libraryCategory === 'games' && (
              <div className="admin-form-group">
                <label className="admin-label">Platform</label>
                <input
                  type="text"
                  value={libraryPlatform}
                  onChange={(e) => setLibraryPlatform(e.target.value)}
                  placeholder="e.g. PC, PS5, Switch"
                  className="admin-input"
                />
              </div>
            )}

            {(libraryCategory === 'movies' || libraryCategory === 'tv') && (
              <div className="admin-form-group">
                <label className="admin-label">Director</label>
                <input
                  type="text"
                  value={libraryDirector}
                  onChange={(e) => setLibraryDirector(e.target.value)}
                  placeholder="Director Name"
                  className="admin-input"
                />
              </div>
            )}

            <div className="admin-form-group">
              <label className="admin-label">Year of Release</label>
              <input
                type="text"
                value={libraryYear}
                onChange={(e) => setLibraryYear(e.target.value)}
                placeholder="e.g., 2023"
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Rating (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={libraryRating}
                onChange={(e) => setLibraryRating(parseInt(e.target.value))}
                className="admin-input"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Review / Thoughts</label>
              <div className="admin-editor">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={libraryContent}
                  onChange={setLibraryContent}
                  modules={quillModules}
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Cover Image</label>
              <input type="file" accept="image/*" onChange={handleLibraryCoverChange} style={{ display: 'block', marginBottom: '0.5rem' }} />
              {libraryCoverPreview && (
                <img src={libraryCoverPreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '300px', border: '1px solid var(--color-border)', borderRadius: '4px', marginTop: '0.5rem' }} />
              )}
            </div>

            <div className="admin-btn-group">
              <button type="submit" className="admin-btn admin-btn-primary">
                {editingLibraryItem ? 'Update' : 'Create'} {LIBRARY_CATEGORIES.find(c => c.value === libraryCategory)?.label} Entry
              </button>
              {editingLibraryItem && (
                <button type="button" onClick={cancelEditLibrary} className="admin-btn">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
