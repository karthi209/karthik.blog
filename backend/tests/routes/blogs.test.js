import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import blogRoutes from '../../routes/blogs.js';
import { Blog } from '../../models/Blog.js';
import { BlogComment } from '../../models/BlogComment.js';
import { BlogLike } from '../../models/BlogLike.js';
import cache from '../../cache.js';

// Mock dependencies
jest.unstable_mockModule('../../models/Blog.js', () => ({
  Blog: {
    findAll: jest.fn(),
    findById: jest.fn(),
    count: jest.fn()
  }
}));

jest.unstable_mockModule('../../models/BlogComment.js', () => ({
  BlogComment: {
    findByBlogId: jest.fn(),
    create: jest.fn()
  }
}));

jest.unstable_mockModule('../../models/BlogLike.js', () => ({
  BlogLike: {
    getLikeCount: jest.fn(),
    toggleLike: jest.fn()
  }
}));

jest.unstable_mockModule('../../cache.js', () => ({
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  }
}));

const app = express();
app.use(express.json());
app.use('/api/blogs', blogRoutes);

describe('Blog Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/blogs', () => {
    it('should return paginated blogs', async () => {
      const mockBlogs = [
        { id: 1, title: 'Blog 1', category: 'tech', created_at: '2024-01-01' },
        { id: 2, title: 'Blog 2', category: 'life', created_at: '2024-01-02' }
      ];

      Blog.findAll = jest.fn().mockResolvedValue(mockBlogs);
      Blog.count = jest.fn().mockResolvedValue(2);

      const response = await request(app)
        .get('/api/blogs')
        .query({ page: '1', limit: '10' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
    });

    it('should filter by category', async () => {
      const mockBlogs = [{ id: 1, title: 'Tech Blog', category: 'tech', created_at: '2024-01-01' }];
      Blog.findAll = jest.fn().mockResolvedValue(mockBlogs);
      Blog.count = jest.fn().mockResolvedValue(1);

      const response = await request(app)
        .get('/api/blogs')
        .query({ category: 'tech' })
        .expect(200);

      expect(Blog.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'tech' })
      );
      expect(response.body.data[0].category).toBe('tech');
    });

    it('should handle empty results', async () => {
      Blog.findAll = jest.fn().mockResolvedValue([]);
      Blog.count = jest.fn().mockResolvedValue(0);

      const response = await request(app)
        .get('/api/blogs')
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.totalItems).toBe(0);
    });
  });

  describe('GET /api/blogs/:id', () => {
    it('should return a single blog', async () => {
      const mockBlog = {
        id: 1,
        title: 'Test Blog',
        content: 'Content',
        category: 'tech',
        created_at: '2024-01-01'
      };
      Blog.findById = jest.fn().mockResolvedValue(mockBlog);

      const response = await request(app)
        .get('/api/blogs/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(Blog.findById).toHaveBeenCalledWith(1);
    });

    it('should return 404 for non-existent blog', async () => {
      Blog.findById = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/api/blogs/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/blogs/categories', () => {
    it('should return list of categories', async () => {
      const response = await request(app)
        .get('/api/blogs/categories')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });
});



