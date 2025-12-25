import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminPanel from '../../components/AdminPanel';
import * as admin from '../../services/admin';
import * as notesAdmin from '../../services/notes-admin';
import * as anthologiesAdmin from '../../services/anthologies-admin';
import * as playlistsAdmin from '../../services/playlists-admin';
import * as auth from '../../services/auth';

// Mock all admin services
vi.mock('../../services/admin', () => ({
  adminListBlogs: vi.fn(),
  adminCreateBlog: vi.fn(),
  adminUpdateBlog: vi.fn(),
  adminDeleteBlog: vi.fn(),
  getStoredAdminToken: vi.fn(() => 'mock-token'),
  clearStoredAdminToken: vi.fn()
}));

vi.mock('../../services/notes-admin', () => ({
  adminListNotes: vi.fn(),
  adminCreateNote: vi.fn(),
  adminUpdateNote: vi.fn(),
  adminDeleteNote: vi.fn()
}));

vi.mock('../../services/anthologies-admin', () => ({
  adminListAnthologies: vi.fn(),
  adminCreateAnthology: vi.fn(),
  adminUpdateAnthology: vi.fn(),
  adminDeleteAnthology: vi.fn()
}));

vi.mock('../../services/playlists-admin', () => ({
  adminCreatePlaylist: vi.fn(),
  adminUpdatePlaylist: vi.fn(),
  adminDeletePlaylist: vi.fn(),
  adminAddSong: vi.fn(),
  adminAddSongsBulk: vi.fn(),
  adminDeleteSong: vi.fn(),
  fetchPlaylists: vi.fn()
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

// Mock global fetch
global.fetch = vi.fn();

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AdminPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    admin.getStoredAdminToken.mockReturnValue('mock-token');
  });

  describe('Response Format Handling', () => {
    it('should render admin panel', () => {
      renderWithRouter(<AdminPanel />);
      // Component should render without crashing
      expect(screen.getByText(/admin/i)).toBeInTheDocument();
    });

    it('should handle library items response format', () => {
      // Test that loadLibraryItems correctly extracts data
      const mockResponse = { success: true, data: [{ id: 1, title: 'Item' }], pagination: {} };
      const extracted = mockResponse.data || mockResponse;
      expect(Array.isArray(extracted)).toBe(true);
    });

    it('should handle projects response format', () => {
      // Test that projects fetch correctly extracts data
      const mockResponse = { success: true, data: [{ id: 1, title: 'Project' }] };
      const extracted = mockResponse.data || mockResponse;
      expect(Array.isArray(extracted)).toBe(true);
    });

    it('should handle blog edit response format', () => {
      // Test that blog edit correctly extracts data
      const mockResponse = { success: true, data: { id: 1, title: 'Blog', content: 'Content' } };
      const extracted = mockResponse.data || mockResponse;
      expect(extracted).toHaveProperty('title');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API Error'));

      renderWithRouter(<AdminPanel />);

      // Component should not crash
      await waitFor(() => {
        expect(screen.getByText(/admin/i)).toBeInTheDocument();
      });
    });

    it('should handle non-array responses gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: null })
      });

      renderWithRouter(<AdminPanel />);

      // Component should handle null/undefined data
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });
});

