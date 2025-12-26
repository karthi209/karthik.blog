import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import projectRoutes from '../../routes/projects.js';
import pool from '../../db.js';

// Mock database
jest.unstable_mockModule('../../db.js', () => ({
  default: {
    query: jest.fn()
  }
}));

const app = express();
app.use(express.json());
app.use('/api/projects', projectRoutes);

describe('Project Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects', () => {
    it('should return all projects', async () => {
      const mockProjects = [
        { id: 1, title: 'Project 1', status: 'completed' },
        { id: 2, title: 'Project 2', status: 'in-progress' }
      ];

      pool.query = jest.fn().mockResolvedValue({ rows: mockProjects });

      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should handle empty results', async () => {
      pool.query = jest.fn().mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return a single project', async () => {
      const mockProject = {
        id: 1,
        title: 'Test Project',
        description: 'Description',
        status: 'completed'
      };

      pool.query = jest.fn().mockResolvedValue({ rows: [mockProject] });

      const response = await request(app)
        .get('/api/projects/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
    });

    it('should return 404 for non-existent project', async () => {
      pool.query = jest.fn().mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/api/projects/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});


