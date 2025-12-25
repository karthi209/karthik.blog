import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NoteDetail from '../../components/NoteDetail';
import * as views from '../../services/views';
import * as auth from '../../services/auth';

// Mock dependencies
global.fetch = vi.fn();

vi.mock('../../services/views', () => ({
  fetchViewCount: vi.fn()
}));

vi.mock('../../services/auth', async () => {
  const actual = await vi.importActual('../../services/auth');
  return {
    ...actual,
    getStoredAuthToken: vi.fn(() => null),
    getAuthUser: vi.fn(() => null),
    hasSeenAuthDisclaimer: vi.fn(() => false),
    markAuthDisclaimerSeen: vi.fn(),
    startGoogleLogin: vi.fn()
  };
});

// Mock useParams
const mockParams = { id: '3' };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockParams,
    useLocation: () => ({ pathname: '/notes/3' })
  };
});

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('NoteDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    views.fetchViewCount.mockResolvedValue(0);
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 3, title: 'Test Note', content: 'Content' } })
      });

      renderWithRouter(<NoteDetail />);
      // Loading state should be visible
    });
  });

  describe('Note Display', () => {
    it('should display note title and content', async () => {
      const mockNote = {
        id: 3,
        title: 'Test Note',
        content: '<p>This is the note content</p>',
        created_at: '2024-01-15T00:00:00Z'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockNote })
      });
      views.fetchViewCount.mockResolvedValue(5);

      renderWithRouter(<NoteDetail />);

      await waitFor(() => {
        expect(screen.getByText('Test Note')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('This is the note content')).toBeInTheDocument();
      });
    });

    it('should handle backend response format correctly', async () => {
      // Test that component correctly extracts data from {success: true, data: {...}}
      const mockNote = {
        id: 3,
        title: 'Backend Format Test',
        content: '<p>Content</p>',
        created_at: '2024-01-15T00:00:00Z'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockNote })
      });

      renderWithRouter(<NoteDetail />);

      await waitFor(() => {
        expect(screen.getByText('Backend Format Test')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle note not found', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ success: false, message: 'Note not found' })
      });

      renderWithRouter(<NoteDetail />);

      await waitFor(() => {
        expect(screen.getByText(/not found/i)).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API Error'));

      renderWithRouter(<NoteDetail />);

      await waitFor(() => {
        expect(screen.getByText(/API Error/i)).toBeInTheDocument();
      });
    });
  });
});

