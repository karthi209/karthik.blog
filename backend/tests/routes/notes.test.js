import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import noteRoutes from '../../routes/notes.js';
import { Note } from '../../models/Note.js';

// Mock Note model
jest.unstable_mockModule('../../models/Note.js', () => ({
  Note: {
    findAll: jest.fn(),
    findById: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

const app = express();
app.use(express.json());
app.use('/api/notes', noteRoutes);

describe('Note Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notes', () => {
    it('should return paginated notes', async () => {
      const mockNotes = [
        { id: 1, title: 'Note 1', content: 'Content 1', created_at: '2024-01-01' },
        { id: 2, title: 'Note 2', content: 'Content 2', created_at: '2024-01-02' }
      ];

      Note.findAll = jest.fn().mockResolvedValue(mockNotes);
      Note.count = jest.fn().mockResolvedValue(2);

      const response = await request(app)
        .get('/api/notes')
        .query({ page: '1', limit: '10' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should handle empty results', async () => {
      Note.findAll = jest.fn().mockResolvedValue([]);
      Note.count = jest.fn().mockResolvedValue(0);

      const response = await request(app)
        .get('/api/notes')
        .expect(200);

      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should return a single note', async () => {
      const mockNote = {
        id: 1,
        title: 'Test Note',
        content: 'Content',
        created_at: '2024-01-01'
      };
      Note.findById = jest.fn().mockResolvedValue(mockNote);

      const response = await request(app)
        .get('/api/notes/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
    });

    it('should return 404 for non-existent note', async () => {
      Note.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/api/notes/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});

