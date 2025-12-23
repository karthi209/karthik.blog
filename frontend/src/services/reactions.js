const getApiBase = () => {
  return import.meta.env.VITE_API_URL || '/api';
};

const normalizePath = (path) => {
  if (!path || typeof path !== 'string') return '/';
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  if (withSlash !== '/' && withSlash.endsWith('/')) return withSlash.slice(0, -1);
  return withSlash;
};

export const fetchReactions = async (path) => {
  const normalized = normalizePath(path);
  const apiUrl = getApiBase();
  const res = await fetch(`${apiUrl}/reactions?path=${encodeURIComponent(normalized)}`);
  if (!res.ok) throw new Error('Failed to fetch reactions');
  const data = await res.json();
  return Array.isArray(data?.rows) ? data.rows : [];
};

export const sendReaction = async (path, reaction) => {
  const normalized = normalizePath(path);
  if (!reaction || typeof reaction !== 'string') throw new Error('reaction is required');

  const key = `reacted:${normalized}:${reaction}`;
  try {
    if (typeof sessionStorage !== 'undefined') {
      const already = sessionStorage.getItem(key);
      if (already) {
        return { isNewUnique: false };
      }
    }
  } catch {
  }

  const apiUrl = getApiBase();
  const res = await fetch(`${apiUrl}/reactions/react`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: normalized, reaction })
  });

  if (!res.ok) throw new Error('Failed to react');
  const data = await res.json();

  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(key, '1');
    }
  } catch {
  }

  return data;
};
