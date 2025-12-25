import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import BlogsPage from '../../components/BlogsPage';
import * as api from '../../services/api';

// Mock the API
vi.mock('../../services/api', () => ({
  fetchBlogs: vi.fn(),
  fetchCategories: vi.fn(),
  fetchBlogArchives: vi.fn(),
  fetchAnthologies: vi.fn(),
  fetchAnthology: vi.fn()
}));

// Mock useNavigate and useSearchParams
const mockNavigate = vi.fn();
const mockSetSearchParams = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => {
      mockSearchParams = new URLSearchParams();
      return [mockSearchParams, mockSetSearchParams];
    }
  };
});

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('BlogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  describe('Initial Load', () => {
    it('should render the page title', () => {
      api.fetchBlogs.mockResolvedValue({ data: [] });
      api.fetchCategories.mockResolvedValue([]);
      api.fetchBlogArchives.mockResolvedValue([]);
      api.fetchAnthologies.mockResolvedValue([]);

      renderWithRouter(<BlogsPage />);
      expect(screen.getByText('Blogs')).toBeInTheDocument();
    });

    it('should show timeline tab by default', () => {
      api.fetchBlogs.mockResolvedValue({ data: [] });
      api.fetchCategories.mockResolvedValue([]);
      api.fetchBlogArchives.mockResolvedValue([]);
      api.fetchAnthologies.mockResolvedValue([]);

      renderWithRouter(<BlogsPage />);
      const timelineTab = screen.getByText('Timeline');
      expect(timelineTab).toBeInTheDocument();
      expect(timelineTab.closest('button')).toHaveClass('active');
    });

    it('should fetch all required data on mount', async () => {
      api.fetchBlogs.mockResolvedValue({ data: [] });
      api.fetchCategories.mockResolvedValue(['tech', 'life']);
      api.fetchBlogArchives.mockResolvedValue([]);
      api.fetchAnthologies.mockResolvedValue([]);

      renderWithRouter(<BlogsPage />);

      await waitFor(() => {
        expect(api.fetchBlogs).toHaveBeenCalled();
        expect(api.fetchCategories).toHaveBeenCalled();
        expect(api.fetchBlogArchives).toHaveBeenCalled();
        expect(api.fetchAnthologies).toHaveBeenCalled();
      });
    });
  });

  describe('Blog Display', () => {
    it('should display blogs when data is available', async () => {
      const mockBlogs = [
        {
          id: 1,
          _id: 1,
          title: 'Test Blog 1',
          category: 'tech',
          content: 'Test content',
          created_at: '2024-01-15T00:00:00Z'
        },
        {
          id: 2,
          _id: 2,
          title: 'Test Blog 2',
          category: 'life',
          content: 'More content',
          created_at: '2024-02-20T00:00:00Z'
        }
      ];

      api.fetchBlogs.mockResolvedValue(mockBlogs);
      api.fetchCategories.mockResolvedValue(['tech', 'life']);
      api.fetchBlogArchives.mockResolvedValue([]);
      api.fetchAnthologies.mockResolvedValue([]);

      renderWithRouter(<BlogsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Blog 1')).toBeInTheDocument();
        expect(screen.getByText('Test Blog 2')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should show "No posts found" when no blogs match filters', async () => {
      api.fetchBlogs.mockResolvedValue([]);
      api.fetchCategories.mockResolvedValue([]);
      api.fetchBlogArchives.mockResolvedValue([]);
      api.fetchAnthologies.mockResolvedValue([]);

      renderWithRouter(<BlogsPage />);

      await waitFor(() => {
        expect(screen.getByText(/No posts found matching your criteria/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle array response format', async () => {
      const mockBlogs = [
        {
          id: 1,
          _id: 1,
          title: 'Array Format Blog',
          category: 'tech',
          content: 'Content',
          created_at: '2024-01-15T00:00:00Z'
        }
      ];

      api.fetchBlogs.mockResolvedValue(mockBlogs);
      api.fetchCategories.mockResolvedValue(['tech']);
      api.fetchBlogArchives.mockResolvedValue([]);
      api.fetchAnthologies.mockResolvedValue([]);

      renderWithRouter(<BlogsPage />);

      await waitFor(() => {
        expect(screen.getByText('Array Format Blog')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter blogs by search query', async () => {
      const mockBlogs = [
        {
          id: 1,
          _id: 1,
          title: 'React Tutorial',
          category: 'tech',
          content: 'Content',
          created_at: '2024-01-15T00:00:00Z'
        },
        {
          id: 2,
          _id: 2,
          title: 'Vue Guide',
          category: 'tech',
          content: 'Content',
          created_at: '2024-02-20T00:00:00Z'
        }
      ];

      api.fetchBlogs.mockResolvedValue(mockBlogs);
      api.fetchCategories.mockResolvedValue(['tech']);
      api.fetchBlogArchives.mockResolvedValue([]);
      api.fetchAnthologies.mockResolvedValue([]);

      renderWithRouter(<BlogsPage />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('React Tutorial')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search articles...');
      await user.type(searchInput, 'React');

      await waitFor(() => {
        expect(screen.getByText('React Tutorial')).toBeInTheDocument();
        expect(screen.queryByText('Vue Guide')).not.toBeInTheDocument();
      });
    });
  });

  describe('Category Filter', () => {
    it('should filter blogs by category', async () => {
      const mockBlogs = [
        {
          id: 1,
          _id: 1,
          title: 'Tech Blog',
          category: 'tech',
          content: 'Content',
          created_at: '2024-01-15T00:00:00Z'
        },
        {
          id: 2,
          _id: 2,
          title: 'Life Blog',
          category: 'life',
          content: 'Content',
          created_at: '2024-02-20T00:00:00Z'
        }
      ];

      api.fetchBlogs.mockResolvedValue(mockBlogs);
      api.fetchCategories.mockResolvedValue(['tech', 'life']);
      api.fetchBlogArchives.mockResolvedValue([]);
      api.fetchAnthologies.mockResolvedValue([]);

      renderWithRouter(<BlogsPage />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Tech Blog')).toBeInTheDocument();
      });

      // Open filters
      const filterButton = screen.getByText('Filters');
      await user.click(filterButton);

      // Wait for filters to appear and select category
      await waitFor(() => {
        const categorySelect = screen.getByLabelText('Category');
        expect(categorySelect).toBeInTheDocument();
      });
      
      const categorySelect = screen.getByLabelText('Category');
      await user.selectOptions(categorySelect, 'tech');

      await waitFor(() => {
        expect(screen.getByText('Tech Blog')).toBeInTheDocument();
        expect(screen.queryByText('Life Blog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Tab Switching', () => {
    it('should switch to anthologies tab', async () => {
      api.fetchBlogs.mockResolvedValue({ data: [] });
      api.fetchCategories.mockResolvedValue([]);
      api.fetchBlogArchives.mockResolvedValue([]);
      api.fetchAnthologies.mockResolvedValue([]);

      renderWithRouter(<BlogsPage />);
      const user = userEvent.setup();

      const anthologiesTab = screen.getByText('Anthologies');
      await user.click(anthologiesTab);

      expect(mockSetSearchParams).toHaveBeenCalledWith({ view: 'anthologies' });
    });

    it('should display anthologies when tab is active', async () => {
      const mockAnthologies = [
        {
          id: 1,
          slug: 'test-anthology',
          title: 'Test Anthology',
          description: 'Test description',
          blogs: []
        }
      ];

      api.fetchBlogs.mockResolvedValue({ data: [] });
      api.fetchCategories.mockResolvedValue([]);
      api.fetchBlogArchives.mockResolvedValue([]);
      api.fetchAnthologies.mockResolvedValue(mockAnthologies);

      renderWithRouter(<BlogsPage />);
      const user = userEvent.setup();

      await waitFor(() => {
        const anthologiesTab = screen.getByText('Anthologies');
        user.click(anthologiesTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Anthology')).toBeInTheDocument();
      });
    });
  });

  describe('BlogRow Component', () => {
    it('should navigate to blog detail on click', async () => {
      const mockBlogs = [
        {
          id: 1,
          _id: 1,
          title: 'Clickable Blog',
          category: 'tech',
          content: 'Content',
          created_at: '2024-01-15T00:00:00Z'
        }
      ];

      api.fetchBlogs.mockResolvedValue(mockBlogs);
      api.fetchCategories.mockResolvedValue(['tech']);
      api.fetchBlogArchives.mockResolvedValue([]);
      api.fetchAnthologies.mockResolvedValue([]);

      renderWithRouter(<BlogsPage />);
      const user = userEvent.setup();

      await waitFor(() => {
        const blogButton = screen.getByText('Clickable Blog');
        user.click(blogButton);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/blogs/1');
      });
    });

    it('should display reading time', async () => {
      const longContent = 'word '.repeat(500); // ~500 words = ~2.5 min read
      const mockBlogs = [
        {
          id: 1,
          _id: 1,
          title: 'Long Blog',
          category: 'tech',
          content: longContent,
          created_at: '2024-01-15T00:00:00Z'
        }
      ];

      api.fetchBlogs.mockResolvedValue(mockBlogs);
      api.fetchCategories.mockResolvedValue(['tech']);
      api.fetchBlogArchives.mockResolvedValue([]);
      api.fetchAnthologies.mockResolvedValue([]);

      renderWithRouter(<BlogsPage />);

      await waitFor(() => {
        expect(screen.getByText(/MIN READ/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      api.fetchBlogs.mockRejectedValue(new Error('API Error'));
      api.fetchCategories.mockResolvedValue([]);
      api.fetchBlogArchives.mockResolvedValue([]);
      api.fetchAnthologies.mockResolvedValue([]);

      renderWithRouter(<BlogsPage />);

      await waitFor(() => {
        // Should still render the page, just with no blogs
        expect(screen.getByText('Blogs')).toBeInTheDocument();
      });
    });
  });
});

