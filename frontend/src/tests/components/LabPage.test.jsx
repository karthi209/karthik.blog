import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LabPage from '../../components/LabPage';

// Mock global fetch
global.fetch = vi.fn();

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('LabPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      });

      renderWithRouter(<LabPage />);
      expect(screen.getByText(/loading projects/i)).toBeInTheDocument();
    });
  });

  describe('Projects Display', () => {
    it('should display projects when data is available', async () => {
      const mockProjects = [
        {
          id: 1,
          title: 'Test Project 1',
          description: 'Description 1',
          status: 'completed',
          tech: 'React, Node.js'
        },
        {
          id: 2,
          title: 'Test Project 2',
          description: 'Description 2',
          status: 'in-progress',
          tech: 'Vue, Python'
        }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockProjects })
      });

      renderWithRouter(<LabPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    });

    it('should handle backend response format correctly', async () => {
      // Test that component correctly extracts data array from {success: true, data: [...]}
      const mockProjects = [
        { id: 1, title: 'Backend Format Test', description: 'Test', status: 'completed' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockProjects })
      });

      renderWithRouter(<LabPage />);

      await waitFor(() => {
        expect(screen.getByText('Backend Format Test')).toBeInTheDocument();
      });
    });

    it('should handle empty projects array', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      });

      renderWithRouter(<LabPage />);

      await waitFor(() => {
        expect(screen.getByText(/no projects listed yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API Error'));

      renderWithRouter(<LabPage />);

      await waitFor(() => {
        expect(screen.getByText(/no projects listed yet/i)).toBeInTheDocument();
      });
    });

    it('should handle non-array response gracefully', async () => {
      // Test that component handles unexpected response format
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: null })
      });

      renderWithRouter(<LabPage />);

      await waitFor(() => {
        expect(screen.getByText(/no projects listed yet/i)).toBeInTheDocument();
      });
    });
  });
});

