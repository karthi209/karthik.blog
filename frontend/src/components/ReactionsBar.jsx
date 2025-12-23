import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchReactions, sendReaction } from '../services/reactions';

export default function ReactionsBar({ reactions }) {
  const location = useLocation();
  const choices = useMemo(() => {
    const list = Array.isArray(reactions) ? reactions : null;
    return list && list.length > 0 ? list : ['Useful', 'Made me think', 'Lol'];
  }, [reactions]);

  const [counts, setCounts] = useState(() => Object.create(null));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const rows = await fetchReactions(location.pathname);
        if (cancelled) return;

        const map = Object.create(null);
        for (const r of rows) {
          map[r.reaction] = typeof r.count === 'number' ? r.count : Number(r.count || 0);
        }
        setCounts(map);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const onReact = async (reaction) => {
    try {
      const res = await sendReaction(location.pathname, reaction);
      if (res && typeof res.count === 'number') {
        setCounts(prev => ({ ...prev, [reaction]: res.count }));
      } else {
        const rows = await fetchReactions(location.pathname);
        const map = Object.create(null);
        for (const r of rows) {
          map[r.reaction] = typeof r.count === 'number' ? r.count : Number(r.count || 0);
        }
        setCounts(map);
      }
    } catch {
    }
  };

  return (
    <div className="reactions-bar" aria-label="Reactions">
      <div className="reactions-title">React</div>
      <div className="reactions-actions">
        {choices.map((r) => (
          <button
            key={r}
            type="button"
            className="reaction-btn"
            onClick={() => onReact(r)}
            disabled={loading}
          >
            <span className="reaction-label">{r}</span>
            <span className="reaction-count">{String(counts?.[r] ?? 0)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
