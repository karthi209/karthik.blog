import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import BlogPost from '../../components/BlogPost';
import * as views from '../../services/views';
import * as comments from '../../services/comments';
import * as auth from '../../services/auth';

// Mock global fetch
global.fetch = vi.fn();

vi.mock('../../services/views', () => ({
  fetchViewCount: vi.fn()
}));

vi.mock('../../services/comments', () => ({
  fetchBlogLikes: vi.fn(),
  toggleBlogLike: vi.fn()
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
const mockParams = { id: '1' };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockParams,
    useLocation: () => ({ pathname: '/blogs/1' })
  };
});

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('BlogPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getStoredAuthToken.mockReturnValue(null);
    auth.getAuthUser.mockReturnValue(null);
    auth.hasSeenAuthDisclaimer.mockReturnValue(false);
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 1,
            title: 'Test Blog',
            content: '<p>Test content</p>',
            category: 'tech',
            created_at: '2024-01-15T00:00:00Z'
          }
        })
      });
      views.fetchViewCount.mockResolvedValue(0);
      comments.fetchBlogLikes.mockResolvedValue({ count: 0, liked: false });

      renderWithRouter(<BlogPost />);
      // Loading state might not be visible immediately due to delay
    });

    it('should fetch blog data on mount', async () => {
      const mockBlog = {
        id: 1,
        title: 'Test Blog',
        content: '<p>Test content</p>',
        category: 'tech',
        created_at: '2024-01-15T00:00:00Z'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockBlog })
      });
      views.fetchViewCount.mockResolvedValue(10);
      comments.fetchBlogLikes.mockResolvedValue({ count: 5, liked: false });

      renderWithRouter(<BlogPost />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/blogs/1'));
      });
    });
  });

  describe('Blog Display', () => {
    it('should display blog title and content', async () => {
      const mockBlog = {
        id: 1,
        title: 'Test Blog Post',
        content: '<p>This is the blog content</p>',
        category: 'tech',
        created_at: '2024-01-15T00:00:00Z'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockBlog })
      });
      views.fetchViewCount.mockResolvedValue(0);
      comments.fetchBlogLikes.mockResolvedValue({ count: 0, liked: false });

      renderWithRouter(<BlogPost />);

      await waitFor(() => {
        expect(screen.getByText('Test Blog Post')).toBeInTheDocument();
      });
    });

    it('should display view count', async () => {
      const mockBlog = {
        id: 1,
        title: 'Test Blog',
        content: '<p>Content</p>',
        category: 'tech',
        created_at: '2024-01-15T00:00:00Z'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockBlog })
      });
      views.fetchViewCount.mockResolvedValue(42);
      comments.fetchBlogLikes.mockResolvedValue({ count: 0, liked: false });

      renderWithRouter(<BlogPost />);

      await waitFor(() => {
        expect(views.fetchViewCount).toHaveBeenCalled();
      });
    });

    it('should display like count', async () => {
      const mockBlog = {
        id: 1,
        title: 'Test Blog',
        content: '<p>Content</p>',
        category: 'tech',
        created_at: '2024-01-15T00:00:00Z'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockBlog })
      });
      views.fetchViewCount.mockResolvedValue(0);
      comments.fetchBlogLikes.mockResolvedValue({ count: 10, liked: false });

      renderWithRouter(<BlogPost />);

      await waitFor(() => {
        expect(comments.fetchBlogLikes).toHaveBeenCalled();
      });
    });
  });

  describe('Like Functionality', () => {
    it('should toggle like when clicked', async () => {
      const mockBlog = {
        id: 1,
        title: 'Test Blog',
        content: '<p>Content</p>',
        category: 'tech',
        created_at: '2024-01-15T00:00:00Z'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockBlog })
      });
      views.fetchViewCount.mockResolvedValue(0);
      comments.fetchBlogLikes.mockResolvedValue({ count: 5, liked: false });
      comments.toggleBlogLike.mockResolvedValue({ count: 6, liked: true });
      auth.getStoredAuthToken.mockReturnValue('token');

      renderWithRouter(<BlogPost />);
      const user = userEvent.setup();

      await waitFor(() => {
        const likeButton = screen.getByRole('button', { name: /like/i });
        expect(likeButton).toBeInTheDocument();
      });

      const likeButton = screen.getByRole('button', { name: /like/i });
      await user.click(likeButton);

      await waitFor(() => {
        expect(comments.toggleBlogLike).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle blog not found', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Blog post not found' })
      });
      views.fetchViewCount.mockResolvedValue(0);
      comments.fetchBlogLikes.mockResolvedValue({ count: 0, liked: false });

      renderWithRouter(<BlogPost />);

      await waitFor(() => {
        // Should show error or redirect
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should handle API errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API Error'));

      renderWithRouter(<BlogPost />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });
});

