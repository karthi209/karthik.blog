const TOKEN_KEY = 'auth_token';
const AUTH_DISCLAIMER_SEEN_KEY = 'auth_disclaimer_seen_v1';

export const getStoredAuthToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

export const setStoredAuthToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token || '');
  } catch {
  }
};

export const clearStoredAuthToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
  }
};

export const decodeJwtPayload = (token) => {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const getAuthUser = () => {
  const token = getStoredAuthToken();
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.email) return null;
  return {
    email: payload.email,
    role: payload.role || 'user'
  };
};

export const isAdminUser = () => {
  const u = getAuthUser();
  return !!u && u.role === 'admin';
};

const hashString = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const ADJ = [
  'retro', 'quiet', 'wired', 'cosmic', 'paper', 'dusty', 'lucky', 'static',
  'neon', 'soft', 'odd', 'tiny', 'brave', 'foggy', 'atomic', 'midnight'
];

const NOUN = [
  'signal', 'circuit', 'tram', 'map', 'byte', 'satellite', 'thread', 'archive',
  'monorail', 'station', 'notebook', 'relay', 'horizon', 'artifact', 'kernel', 'log'
];

export const aliasFromEmail = (email) => {
  const e = String(email || '').toLowerCase();
  if (!e) return 'Anonymous';
  const h = hashString(e);
  const a = ADJ[h % ADJ.length];
  const n = NOUN[(h >>> 8) % NOUN.length];
  const num = String((h % 900) + 100);
  return `${a}-${n}-${num}`;
};

export const getUserAlias = () => {
  const u = getAuthUser();
  return u?.email ? aliasFromEmail(u.email) : 'Anonymous';
};

export const startGoogleLogin = (redirectPath) => {
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const base = apiBase.endsWith('/api') ? apiBase : `${apiBase}`;
  const redirect = encodeURIComponent(redirectPath || window.location.pathname || '/');
  const authUrl = `${base}/auth/google?redirect=${redirect}`;
  
  console.log('[AUTH] Starting Google login', { 
    apiBase, 
    base, 
    redirectPath, 
    redirect, 
    authUrl,
    currentLocation: window.location.href 
  });
  
  window.location.href = authUrl;
};

export const hasSeenAuthDisclaimer = () => {
  try {
    return localStorage.getItem(AUTH_DISCLAIMER_SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

export const markAuthDisclaimerSeen = () => {
  try {
    localStorage.setItem(AUTH_DISCLAIMER_SEEN_KEY, '1');
  } catch {
  }
};
