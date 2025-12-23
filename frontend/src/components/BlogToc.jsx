import { useEffect, useMemo, useState } from 'react';

const slugify = (raw) => {
  return String(raw || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export default function BlogToc({ containerSelector = '.blog-post-body' }) {
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) {
      setItems([]);
      return;
    }

    const headings = Array.from(container.querySelectorAll('h2, h3'));
    const used = new Map();

    const nextItems = headings
      .map((h) => {
        const level = h.tagName.toLowerCase() === 'h2' ? 2 : 3;
        const text = (h.textContent || '').trim();
        if (!text) return null;

        let id = h.getAttribute('id') || slugify(text);
        if (!id) return null;

        const count = (used.get(id) || 0) + 1;
        used.set(id, count);
        if (count > 1) id = `${id}-${count}`;

        h.setAttribute('id', id);
        return { id, text, level };
      })
      .filter(Boolean);

    setItems(nextItems);
  }, [containerSelector]);

  useEffect(() => {
    if (!items.length) return;

    const els = items
      .map(it => document.getElementById(it.id))
      .filter(Boolean);

    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top));

        if (visible.length > 0) {
          const id = visible[0].target.getAttribute('id') || '';
          if (id) setActiveId(id);
        }
      },
      {
        root: null,
        rootMargin: '0px 0px -70% 0px',
        threshold: [0, 1]
      }
    );

    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  const hasItems = items.length > 0;

  const onClick = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    try {
      window.history.replaceState({}, '', `#${id}`);
    } catch {
    }
  };

  const grouped = useMemo(() => items, [items]);

  if (!hasItems) return null;

  return (
    <aside className="blog-toc" aria-label="Table of contents">
      <div className="blog-toc-title">Table of Contents</div>
      <nav className="blog-toc-nav">
        {grouped.map((it) => (
          <button
            key={it.id}
            type="button"
            className={`blog-toc-item level-${it.level} ${activeId === it.id ? 'is-active' : ''}`}
            onClick={() => onClick(it.id)}
          >
            {it.text}
          </button>
        ))}
      </nav>
    </aside>
  );
}
