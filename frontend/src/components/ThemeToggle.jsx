import { useEffect, useState } from 'react';

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(() => {
    if (typeof document === 'undefined') return 'dark';
    return document.body.getAttribute('data-theme') || 'dark';
  });

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    // persist preference
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) setTheme(saved);
    } catch {}
  }, []);

  return (
    <button
      className={`nav-item ${className}`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      style={{ gap: '0.5rem' }}
    >
      <span style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        border: '1px solid var(--color-border)',
        background: theme === 'dark' ? 'var(--color-text)' : 'var(--color-background)'
      }} />
      <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  );
}
