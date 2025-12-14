// Simple admin password authentication middleware
export const authenticateApiKey = async (req, res, next) => {
  try {
    const providedKey = req.headers['x-api-key'] || req.query.api_key;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    // Security: Don't allow empty admin password in production
    if (!adminPassword || adminPassword === 'admin123') {
      console.error('⚠️  WARNING: Using default or no admin password! Set ADMIN_PASSWORD in environment.');
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ message: 'Server configuration error' });
      }
    }
    
    if (!providedKey) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Constant-time comparison to prevent timing attacks
    if (providedKey.length !== adminPassword.length) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    let match = true;
    for (let i = 0; i < providedKey.length; i++) {
      if (providedKey[i] !== adminPassword[i]) {
        match = false;
      }
    }
    
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};
