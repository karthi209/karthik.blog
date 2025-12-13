import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchBlogs, fetchCategories, fetchBlogArchives } from '../services/api';
import { Filter, Calendar, Tag, Search } from 'lucide-react';
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
        console.error('Error loading blog data:', error);
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
        sortBy: 'date',
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
      console.error('Error filtering blogs:', error);
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
  const filteredBlogs = blogs.filter(blog => {
    const matchesCategory = activeTab === 'all' || blog.category === activeTab;
    const matchesSearch = !searchQuery || 
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (blog.excerpt && blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const groupedBlogs = filteredBlogs.reduce((acc, blog) => {
    const year = blog?.date ? new Date(blog.date).getFullYear() : 'Other';
    if (!acc[year]) acc[year] = [];
    acc[year].push(blog);
    return acc;
  }, {});

  const sortedYears = Object.keys(groupedBlogs)
    .map(y => Number.isNaN(Number(y)) ? y : Number(y))
    .sort((a, b) => (b > a ? 1 : -1));

  return (
    <>
      <div className="blog-header">
        <div>
          <h1 className="page-title">Blogs</h1>
          <p className="page-meta">{blogs.length} POSTS</p>
        </div>
      </div>
      
      <div className="blog-search-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search articles..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
          aria-label="Toggle filters"
        >
          <Filter size={18} />
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
                <div className="list-rows">
                  {groupedBlogs[year].map((blog) => {
                    const dateLabel = blog?.date ? new Date(blog.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
                    const readingTime = blog?.content ? Math.ceil(blog.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200) : 1;
                    const wordCount = blog?.content ? blog.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
                    return (
                      <div 
                        key={blog._id} 
                        className="list-row"
                        onClick={() => navigate(`/blogs/${blog._id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/blogs/${blog._id}`); }}
                      >
                        <div>
                          <div className="list-row-title">{blog.title}</div>
                          <div className="list-row-meta">
                            {blog.category && (
                              <span className="meta-tag">{blog.category.toUpperCase()}</span>
                            )}
                            <span className="meta-detail">{readingTime} MIN READ</span>
                            <span className="meta-detail">{wordCount} WORDS</span>
                          </div>
                        </div>
                        <div className="list-row-right">
                          <span className="date">{dateLabel}</span>
                        </div>
                      </div>
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
