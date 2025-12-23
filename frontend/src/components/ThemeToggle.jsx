import { useEffect, useMemo, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const THEMES = [
  { key: 'dark', label: 'Dark' },
  { key: 'light', label: 'Light' }
];

export default function ThemeToggle({ className = '', iconOnly = false }) {
  const [theme, setTheme] = useState(() => {
    if (typeof document === 'undefined') return 'dark';
    const saved = (() => {
      try {
        return localStorage.getItem('theme');
      } catch {
        return null;
      }
    })();

    if (saved && THEMES.some(t => t.key === saved)) return saved;

    return document.documentElement.getAttribute('data-theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);

  const nextTheme = () => {
    const idx = THEMES.findIndex(t => t.key === theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    setTheme(next.key);
  };

  const current = THEMES.find(t => t.key === theme) || THEMES[0];
  const next = useMemo(() => {
    const idx = THEMES.findIndex(t => t.key === theme);
    return THEMES[(idx + 1) % THEMES.length];
  }, [theme]);

  return (
    <button
      type="button"
      className={`theme-toggle ${iconOnly ? 'theme-toggle--icon-only' : ''} ${className}`}
      aria-label={`Switch to ${next.label} theme`}
      onClick={nextTheme}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
      </span>
      {!iconOnly ? <span className="theme-toggle-label">{current.label}</span> : null}
    </button>
  );
}
