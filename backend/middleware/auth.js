import jwt from 'jsonwebtoken';

export const authenticateApiKey = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const secret = process.env.JWT_SECRET || '';

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!secret) {
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, secret);
    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
};

export const requireAdminJwt = authenticateApiKey;

export const requireUserJwt = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const secret = process.env.JWT_SECRET || '';

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!secret) {
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, secret);
    if (!decoded || !decoded.email) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
};
