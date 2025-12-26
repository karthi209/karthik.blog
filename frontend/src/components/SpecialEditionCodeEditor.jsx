import { useRef } from 'react';
import { getStoredAdminToken } from '../services/admin';

const API = import.meta.env.VITE_API_URL || '/api';

export default function SpecialEditionCodeEditor({ value, onChange, onStatusChange }) {
  const textareaRef = useRef(null);

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        if (onStatusChange) onStatusChange('Uploading image...');
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
        // Insert image tag at cursor position
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const imageTag = `<img src="${imageUrl}" alt="" />`;
          const newContent = value.substring(0, start) + imageTag + value.substring(end);
          onChange(newContent);
          // Set cursor after inserted image tag
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + imageTag.length, start + imageTag.length);
          }, 0);
        }
        if (onStatusChange) {
          onStatusChange('Image uploaded! Inserted at cursor position.');
          setTimeout(() => onStatusChange(''), 2000);
        }
      } catch (err) {
        if (onStatusChange) onStatusChange(`Upload error: ${err.message}`);
      }
    };
    input.click();
  };

  return (
    <div className="admin-code-editor-wrapper">
      <div className="admin-code-editor-header">
        <span className="admin-code-editor-label">HTML/CSS Editor (Special Edition Mode)</span>
        <button
          type="button"
          className="admin-btn admin-btn-sm"
          onClick={handleImageUpload}
        >
          📷 Upload Image
        </button>
      </div>
      <div className="admin-code-editor">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your HTML/CSS here. Include &lt;style&gt; tags for CSS. Example:&#10;&#10;&lt;style&gt;&#10;  body { background: #000; color: #fff; }&#10;&lt;/style&gt;&#10;&#10;&lt;article&gt;&#10;  &lt;h1&gt;My Special Post&lt;/h1&gt;&#10;  &lt;p&gt;Content here...&lt;/p&gt;&#10;&lt;/article&gt;"
          spellCheck={false}
          style={{
            width: '100%',
            minHeight: '500px',
            fontFamily: 'monospace',
            fontSize: '14px',
            padding: '1rem',
            background: 'var(--color-background)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            lineHeight: '1.6',
            resize: 'vertical'
          }}
        />
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
        💡 Tip: Write complete HTML with embedded CSS. Use &lt;style&gt; tags for styling. Images uploaded will be inserted as &lt;img&gt; tags.
      </p>
    </div>
  );
}

