import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchBlogs, fetchNotes, fetchProjects, fetchHomepageData } from '../../services/api.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchBlogs', () => {
    it('should fetch blogs successfully', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: 1, title: 'Test Blog', category: 'tech' }]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await fetchBlogs();
      // fetchBlogs extracts data from {success: true, data: [...]} and returns the array
      expect(result).toEqual(mockResponse.data);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/blogs')
      );
    });

    it('should handle fetch errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchBlogs()).rejects.toThrow('Network error');
    });

    it('should handle API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false, // fetch doesn't throw on non-2xx, we need to check response.ok
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ success: false, message: 'Server error' })
      });

      // fetchBlogs throws an error when response.ok is false
      await expect(fetchBlogs()).rejects.toThrow('Failed to fetch blogs');
    });
  });

  describe('fetchNotes', () => {
    it('should fetch notes with filters', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: 1, title: 'Test Note' }]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await fetchNotes({ sortBy: 'created_at', order: 'desc' });
      // fetchNotes extracts data from {success: true, data: [...]} and returns the array
      expect(result).toEqual(mockResponse.data);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/notes')
      );
    });
  });

  describe('fetchProjects', () => {
    it('should fetch projects', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: 1, title: 'Test Project' }]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await fetchProjects();
      // fetchProjects extracts data from {success: true, data: [...]} and returns the array
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchHomepageData', () => {
    it('should fetch homepage data', async () => {
      const mockData = {
        music: [],
        games: [],
        movies: [],
        series: [],
        books: []
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const result = await fetchHomepageData();
      expect(result).toEqual(mockData);
    });
  });
});

