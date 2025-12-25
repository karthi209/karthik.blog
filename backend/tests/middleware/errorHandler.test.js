import { describe, it, expect, jest } from '@jest/globals';
import { errorHandler, asyncHandler } from '../../middleware/errorHandler.js';

describe('Error Handler Middleware', () => {
  describe('errorHandler', () => {
    it('should handle generic errors', () => {
      const req = { path: '/test', method: 'GET' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      const err = new Error('Test error');
      err.status = 500;

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String)
        })
      );
    });

    it('should handle validation errors', () => {
      const req = { path: '/test', method: 'POST' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      const err = new Error('Validation failed');
      err.name = 'ValidationError';

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed'
        })
      );
    });

    it('should handle unauthorized errors', () => {
      const req = { path: '/test', method: 'GET' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      const err = new Error('Unauthorized');
      err.name = 'UnauthorizedError';

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required'
        })
      );
    });
  });

  describe('asyncHandler', () => {
    it('should catch async errors', async () => {
      const req = {};
      const res = {};
      const next = jest.fn();
      const asyncFn = async () => {
        throw new Error('Async error');
      };

      const handler = asyncHandler(asyncFn);
      await handler(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should pass through successful requests', async () => {
      const req = {};
      const res = { json: jest.fn() };
      const next = jest.fn();
      const asyncFn = async (req, res) => {
        res.json({ success: true });
      };

      const handler = asyncHandler(asyncFn);
      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true });
      expect(next).not.toHaveBeenCalled();
    });
  });
});

