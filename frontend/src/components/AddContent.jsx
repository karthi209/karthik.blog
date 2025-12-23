import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function AddContent({ type, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: type === 'blogs' ? 'tech' : '',
    tags: '',
    rating: '',
    status: '',
    completion: '',
    author: '',
    type: type === 'logs' ? 'games' : undefined // for logs only
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileUpload = async (file) => {
    if (file.type !== 'text/markdown' && !file.name.endsWith('.md')) {
      alert('Please upload a Markdown file (.md)');
      return;
    }

    try {
      const text = await file.text();
      
      // Try to extract title from frontmatter or first heading
      let title = '';
      let content = text;
      let category = formData.category || 'tech';
      
      // Check for frontmatter
      if (text.startsWith('---')) {
        const frontmatterEnd = text.indexOf('---', 3);
        if (frontmatterEnd > 0) {
          const frontmatter = text.substring(3, frontmatterEnd);
          const rest = text.substring(frontmatterEnd + 3).trim();
          
          const titleMatch = frontmatter.match(/title:\s*(.+)/i);
          const categoryMatch = frontmatter.match(/category:\s*(.+)/i);
          const tagsMatch = frontmatter.match(/tags:\s*\[(.+)\]/i);
          
          if (titleMatch) title = titleMatch[1].replace(/['"]/g, '').trim();
          if (categoryMatch) category = categoryMatch[1].replace(/['"]/g, '').trim();
          if (tagsMatch) {
            const tagsStr = tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')).join(', ');
            setFormData(prev => ({ ...prev, tags: tagsStr }));
          }
          
          content = rest;
        }
      }
      
      // If no title from frontmatter, try first H1
      if (!title) {
        const h1Match = content.match(/^#\s+(.+)$/m);
        if (h1Match) {
          title = h1Match[1];
          content = content.replace(/^#\s+.+$/m, '').trim();
        } else {
          title = file.name.replace('.md', '').replace(/-/g, ' ');
        }
      }
      
      setFormData({
        ...formData,
        title: title || formData.title,
        content: content,
        category: category
      });
      
      alert('Markdown file loaded successfully!');
    } catch (error) {
      alert('Error reading file: ' + error.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.content) {
      alert('Title and content are required!');
      return;
    }

    if (type === 'blogs' && !formData.category) {
      alert('Category is required for blog posts!');
      return;
    }

    // Convert tags string to array if provided
    const submitData = { ...formData };
    if (submitData.tags) {
      submitData.tags = submitData.tags.split(',').map(t => t.trim()).filter(t => t);
    }

    // Submit the form
    try {
      await onSubmit(submitData);
      // Reset form after successful submission
      setFormData({
        title: '',
        content: '',
        category: type === 'blogs' ? 'tech' : '',
        tags: '',
        rating: '',
        status: '',
        completion: '',
        author: '',
        type: type === 'logs' ? 'games' : undefined
      });
      onClose();
    } catch (error) {
      alert('Error saving the post: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-content-form">
      <div className="form-group">
        <label className="form-label">Title *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>

      {type === 'blogs' && (
        <>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Select category...</option>
              <option value="tech">Tech</option>
              <option value="personal">Personal</option>
              <option value="gaming">Gaming</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g. javascript, nodejs, programming"
            />
          </div>
        </>
      )}

      {type === 'logs' && (
        <>
          <div className="form-group">
            <label className="form-label">Rating</label>
            <input
              type="text"
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              placeholder="e.g. 8/10"
              className="form-input"
            />
          </div>

          {formData.type === 'games' && (
            <div className="form-group">
              <label className="form-label">Completion Status</label>
              <input
                type="text"
                name="completion"
                value={formData.completion}
                onChange={handleChange}
                placeholder="e.g. Finished, In Progress"
                className="form-input"
              />
            </div>
          )}

          {formData.type === 'books' && (
            <div className="form-group">
              <label className="form-label">Author</label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          )}
        </>
      )}
      
      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <label className="form-label" style={{ margin: 0 }}>Content *</label>
          <div style={{ display: 'flex', gap: 'var(--space-xs)', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="form-button form-button-secondary"
              style={{ padding: 'var(--space-2xs) var(--space-xs)', fontSize: 'var(--size-small)', whiteSpace: 'nowrap' }}
            >
              {showPreview ? 'Edit' : 'Preview'}
            </button>
            <label
              className="form-button form-button-secondary"
              style={{ padding: 'var(--space-2xs) var(--space-xs)', fontSize: 'var(--size-small)', cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}
            >
              Upload .md
              <input
                type="file"
                accept=".md,text/markdown"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
        
        {showPreview ? (
          <div 
            className="form-textarea"
            style={{ 
              minHeight: '200px',
              overflow: 'auto',
              backgroundColor: 'var(--color-background)',
              border: 'var(--border-thin) solid var(--color-border)',
              padding: 'var(--space-md)',
              fontFamily: 'var(--font-body)'
            }}
          >
            <ReactMarkdown>{formData.content || '*No content to preview*'}</ReactMarkdown>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              border: isDragging 
                ? '2px dashed var(--color-accent)' 
                : '2px dashed var(--color-border)',
              borderRadius: 'var(--border-radius)',
              padding: isDragging ? 'var(--space-md)' : '0',
              backgroundColor: isDragging ? 'var(--color-hover)' : 'transparent',
              transition: 'all var(--transition-speed) ease'
            }}
          >
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              className="form-textarea"
              placeholder="You can use Markdown formatting here:

# Heading 1
## Heading 2

- List item 1
- List item 2

**Bold text** and *italic text*

[Link text](https://example.com)

Or drag and drop a .md file here!"
              required
              style={{ border: 'none' }}
            />
          </div>
        )}
        
        {!showPreview && (
          <div style={{ fontSize: 'var(--size-caption)', color: 'var(--color-text-light)', marginTop: 'var(--space-2xs)' }}>
            Tip: Drag & drop a .md file or click "Upload .md" to import from file
          </div>
        )}
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="form-button form-button-primary"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          className="form-button form-button-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
} 