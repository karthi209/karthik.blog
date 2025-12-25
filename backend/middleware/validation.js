// Input validation and sanitization middleware

/**
 * Validates and sanitizes string inputs
 */
export const sanitizeString = (str, maxLength = 10000) => {
  if (typeof str !== 'string') return '';
  // Remove null bytes and trim
  let sanitized = str.replace(/\0/g, '').trim();
  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
};

/**
 * Common field length limits
 */
export const FIELD_LIMITS = {
  TITLE: 255,
  CATEGORY: 100,
  TAG: 50,
  EMAIL: 255,
  URL: 2048,
  COMMENT: 2000,
  CONTENT: 10 * 1024 * 1024, // 10MB equivalent in characters
  DESCRIPTION: 1000,
  SLUG: 255
};

/**
 * Validates integer input
 */
export const sanitizeInteger = (value, min = -Infinity, max = Infinity) => {
  const num = parseInt(value, 10);
  if (isNaN(num)) return null;
  if (num < min || num > max) return null;
  return num;
};

/**
 * Validates category input (whitelist approach)
 */
export const validateCategory = (category, allowedCategories = ['tech', 'life', 'music', 'games', 'movies', 'tv', 'books']) => {
  if (!category || typeof category !== 'string') return null;
  const normalized = category.toLowerCase().trim();
  return allowedCategories.includes(normalized) ? normalized : null;
};

/**
 * Validates URL input
 */
export const validateUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return url;
  } catch {
    return null;
  }
};

/**
 * Validates email input
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
};

/**
 * Middleware to validate request body
 */
export const validateRequestBody = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }
      
      if (value !== undefined && value !== null && value !== '') {
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
          continue;
        }
        
        if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
          errors.push(`${field} must not exceed ${rules.maxLength} characters`);
          continue;
        }
        
        if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
          continue;
        }
        
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
          continue;
        }
        
        // Sanitize string values
        if (typeof value === 'string' && rules.sanitize !== false) {
          req.body[field] = sanitizeString(value, rules.maxLength || FIELD_LIMITS.CONTENT);
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed', 
        errors 
      });
    }
    
    next();
  };
};

