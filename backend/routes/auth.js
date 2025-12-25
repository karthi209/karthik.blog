import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { requireUserJwt } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

const JWT_SECRET = process.env.JWT_SECRET || '';

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

const normalizeFrontendUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return 'http://localhost:5173';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
};

const frontendBase = normalizeFrontendUrl(frontendUrl);

const safeRedirectPath = (raw) => {
  if (!raw || typeof raw !== 'string') return '/';
  // only allow site-internal absolute paths
  if (!raw.startsWith('/')) return '/';
  // collapse multiple leading slashes to a single slash
  const normalized = raw.replace(/^\/+/, '/');
  // avoid redirect loops to oauth endpoints
  if (normalized.startsWith('/api/')) return '/';
  return normalized;
};

if (googleClientId && googleClientSecret) {
  passport.use(new GoogleStrategy(
    {
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: googleCallbackUrl
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile?.emails?.[0]?.value?.toLowerCase() || '';
        if (!email) {
          return done(null, false, { message: 'No email returned from Google' });
        }

        if (!JWT_SECRET) {
          return done(new Error('JWT_SECRET is not configured'));
        }

        const isAdmin = ADMIN_EMAILS.includes(email);

        return done(null, {
          email,
          role: isAdmin ? 'admin' : 'user',
          name: profile?.displayName || email
        });
      } catch (err) {
        return done(err);
      }
    }
  ));
}

router.get('/google', (req, res, next) => {
  logger.debug('Google OAuth initiated', { query: req.query });
  if (!googleClientId || !googleClientSecret) {
    logger.warn('Google OAuth not configured - missing credentials');
    return res.status(500).json({ error: 'Google OAuth is not configured' });
  }

  const redirectPath = safeRedirectPath(req.query.redirect);
  logger.debug('OAuth redirect path', { redirectPath });
  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    session: false,
    state: Buffer.from(JSON.stringify({ redirect: redirectPath })).toString('base64')
  })(req, res, next);
});

router.get(
  '/google/callback',
  (req, res, next) => {
    logger.debug('Google OAuth callback received', { query: req.query });
    if (!googleClientId || !googleClientSecret) {
      logger.warn('Google OAuth not configured in callback');
      return res.redirect(`${frontendBase}/?error=oauth_not_configured`);
    }

    let redirectPath = '/';
    try {
      if (req.query.state) {
        const parsed = JSON.parse(Buffer.from(String(req.query.state), 'base64').toString('utf8'));
        redirectPath = safeRedirectPath(parsed?.redirect);
      }
    } catch {
      redirectPath = '/';
    }
    logger.debug('OAuth callback redirect path', { redirectPath });

    return passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        logger.error('OAuth callback error', { error: err.message });
        return res.redirect(`${frontendBase}${redirectPath}?error=oauth_failed`);
      }
      if (!user) {
        logger.warn('OAuth callback - no user returned');
        return res.redirect(`${frontendBase}${redirectPath}?error=not_authorized`);
      }

      try {
        const token = jwt.sign(
          { email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '12h' }
        );
        logger.info('Token generated successfully', { email: user.email });
        return res.redirect(`${frontendBase}${redirectPath}?token=${encodeURIComponent(token)}`);
      } catch (e) {
        logger.error('JWT sign error', { error: e.message });
        return res.redirect(`${frontendBase}${redirectPath}?error=token_failed`);
      }
    })(req, res, next);
  }
);

router.get('/verify', requireUserJwt, (req, res) => {
  res.json({ ok: true, user: req.user || null });
});

router.get('/me', requireUserJwt, (req, res) => {
  res.json({ ok: true, user: req.user || null });
});

export default router;
