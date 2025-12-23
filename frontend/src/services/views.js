const getApiBase = () => {
  return import.meta.env.VITE_API_URL || '/api';
};

const normalizePath = (path) => {
  if (!path || typeof path !== 'string') return '/';
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  if (withSlash !== '/' && withSlash.endsWith('/')) return withSlash.slice(0, -1);
  return withSlash;
};

export const fetchViewCount = async (path) => {
  const normalized = normalizePath(path);
  const apiUrl = getApiBase();
  const res = await fetch(`${apiUrl}/views?path=${encodeURIComponent(normalized)}`);
  if (!res.ok) throw new Error('Failed to fetch view count');
  return await res.json();
};

export const trackView = async (path) => {
  const normalized = normalizePath(path);
  if (!normalized) throw new Error('path is required');

  const key = `viewed:${normalized}`;
  try {
    if (typeof sessionStorage !== 'undefined') {
      const already = sessionStorage.getItem(key);
      if (already) {
        return await fetchViewCount(normalized);
      }
    }
  } catch {
  }

  const apiUrl = getApiBase();
  const res = await fetch(`${apiUrl}/views/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: normalized })
  });

  if (!res.ok) throw new Error('Failed to track view');

  const data = await res.json();

  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(key, '1');
    }
  } catch {
  }

  return data;
};
