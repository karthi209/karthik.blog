import { describe, it, expect, jest } from '@jest/globals';
import { sanitizeString, validateCategory, validateUrl, validateEmail, FIELD_LIMITS, validateRequestBody } from '../../middleware/validation.js';

describe('Validation Utils', () => {
  describe('sanitizeString', () => {
    it('should sanitize string', () => {
      expect(sanitizeString('  test  ')).toBe('test');
      expect(sanitizeString('test\0null')).toBe('testnull');
    });

    it('should enforce max length', () => {
      const longString = 'a'.repeat(100);
      const result = sanitizeString(longString, 50);
      expect(result.length).toBe(50);
    });
  });

  describe('validateCategory', () => {
    it('should validate allowed categories', () => {
      expect(validateCategory('tech')).toBe('tech');
      expect(validateCategory('TECH')).toBe('tech');
      expect(validateCategory('invalid')).toBe(null);
    });
  });

  describe('validateUrl', () => {
    it('should validate URLs', () => {
      expect(validateUrl('https://example.com')).toBe('https://example.com');
      expect(validateUrl('http://example.com')).toBe('http://example.com');
      expect(validateUrl('ftp://example.com')).toBe(null);
      expect(validateUrl('not-a-url')).toBe(null);
    });
  });

  describe('validateEmail', () => {
    it('should validate emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
    });
  });

  describe('FIELD_LIMITS', () => {
    it('should have correct limits', () => {
      expect(FIELD_LIMITS.TITLE).toBe(255);
      expect(FIELD_LIMITS.COMMENT).toBe(2000);
      expect(FIELD_LIMITS.URL).toBe(2048);
    });
  });

  describe('validateRequestBody middleware', () => {
    it('should validate required fields', () => {
      const req = { body: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = validateRequestBody({
        title: { type: 'string', required: true }
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: expect.arrayContaining([expect.stringContaining('title is required')])
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should validate field types', () => {
      const req = { body: { title: 123 } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      const middleware = validateRequestBody({
        title: { type: 'string', required: true }
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass validation for valid data', () => {
      const req = { body: { title: 'Valid Title' } };
      const res = {};
      const next = jest.fn();

      const middleware = validateRequestBody({
        title: { type: 'string', required: true }
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should sanitize string values', () => {
      const req = { body: { title: '  Test Title  ' } };
      const res = {};
      const next = jest.fn();

      const middleware = validateRequestBody({
        title: { type: 'string', required: true }
      });

      middleware(req, res, next);

      expect(req.body.title).toBe('Test Title');
      expect(next).toHaveBeenCalled();
    });
  });
});
