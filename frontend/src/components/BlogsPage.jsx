import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchBlogs, fetchCategories, fetchBlogArchives } from '../services/api';
import './BlogsPage.css';

export default function BlogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [archives, setArchives] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedDate, setSelectedDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all necessary data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [blogsData, categoriesData, archivesData] = await Promise.all([
          fetchBlogs(),
          fetchCategories(),
          fetchBlogArchives()
        ]);
        setBlogs(blogsData);
        setCategories(categoriesData);
        setArchives(archivesData);
      } catch (error) {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Apply filters and sorting
  const handleFilter = async () => {
    try {
      const filters = {
        category: selectedCategory,
        sortBy: 'created_at',
        order: sortOrder
      };
      if (selectedDate) {
        const [year, month] = selectedDate.split('-');
        filters.startDate = new Date(year, month - 1, 1);
        filters.endDate = new Date(year, month, 0);
      }
      const filteredBlogs = await fetchBlogs(filters);
      setBlogs(filteredBlogs);
    } catch (error) {
      // Silently fail
    }
  };

  // Handle tab change
  const handleCategoryChange = (category) => {
    setActiveTab(category);
    setSelectedCategory(category === 'all' ? '' : category);
    if (category === 'all') {
      setSearchParams({ tab: 'all' });
    } else {
      setSearchParams({ tab: category, category: category });
    }
  };

  // Re-fetch when category or sort changes
  useEffect(() => {
    handleFilter();
  }, [selectedCategory, sortOrder, selectedDate]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Filter blogs based on active tab and search query
  const filteredBlogs = (Array.isArray(blogs) ? blogs : []).filter(blog => {
    const matchesCategory = activeTab === 'all' || blog.category === activeTab;
    const matchesSearch = !searchQuery || 
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (blog.excerpt && blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const groupedBlogs = filteredBlogs.reduce((acc, blog) => {
    const year = blog?.created_at ? new Date(blog.created_at).getFullYear() : 'Other';
    if (!acc[year]) acc[year] = [];
    acc[year].push(blog);
    return acc;
  }, {});

  const sortedYears = Object.keys(groupedBlogs)
    .map(y => Number.isNaN(Number(y)) ? y : Number(y))
    .sort((a, b) => (b > a ? 1 : -1));

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Blogs</h1>
          <p className="page-meta">{blogs.length} POSTS</p>
        </div>
      </div>
      
      <div className="blog-search-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search articles..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          className="filter-toggle-btn retro-button retro-button--icon"
          onClick={() => setShowFilters(!showFilters)}
          aria-label="Toggle filters"
        >
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="blog-filters-dropdown">
          <div className="filter-group">
            <label className="filter-label">Category</label>
            <select 
              className="filter-select"
              value={activeTab} 
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="all">All</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Archive</label>
            <select 
              className="filter-select"
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              <option value="">All Time</option>
              {archives.map(archive => (
                <option key={`${archive._id?.year || archive.year}-${archive._id?.month || archive.month}`} value={`${archive._id?.year || archive.year}-${archive._id?.month || archive.month}`}>
                  {monthNames[(archive._id?.month || archive.month) - 1]} {archive._id?.year || archive.year}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Sort</label>
            <select 
              className="filter-select"
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Newest</option>
              <option value="asc">Oldest</option>
            </select>
          </div>
        </div>
      )}

        {loading ? (
          <div className="loading-container">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p className="loading-text">loading posts...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="blog-card-empty">
            <p>No posts found matching your criteria.</p>
          </div>
        ) : (
          <div className="list-stack">
            {sortedYears.map((year) => (
              <section key={year} className="list-section">
                <div className="list-section-header">
                  <h3 className="list-section-title">{year}</h3>
                  <span className="meta-small">{groupedBlogs[year].length} {groupedBlogs[year].length === 1 ? 'post' : 'posts'}</span>
                </div>
                <div className="library-entries">
                  {groupedBlogs[year].map((blog) => {
                    const dateLabel = blog?.created_at ? new Date(blog.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
                    const readingTime = blog?.content ? Math.ceil(blog.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200) : 1;
                    const wordCount = blog?.content ? blog.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
                    return (
                      <button
                        key={blog._id}
                        type="button"
                        className="library-entry blog-entry"
                        onClick={() => navigate(`/blogs/${blog._id}`)}
                      >
                        <span className="library-entry-date">{dateLabel}</span>
                        <span>
                          <div className="library-entry-title">{blog.title}</div>
                          <div className="library-entry-meta">
                            {blog.category ? (
                              <span className="library-entry-tag">{blog.category.toUpperCase()}</span>
                            ) : null}
                            <span className="meta-detail">{readingTime} MIN READ</span>
                            <span className="meta-detail">{wordCount} WORDS</span>
                          </div>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
    </>
  );
}
