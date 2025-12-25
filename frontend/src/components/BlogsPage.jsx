import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchBlogs, fetchCategories, fetchBlogArchives, fetchAnthologies, fetchAnthology } from '../services/api';
import '../styles/components/BlogsPage.css';

export default function BlogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [anthologies, setAnthologies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [archives, setArchives] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedAnthology, setSelectedAnthology] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  // activeTab can be: 'timeline' (default), 'anthologies'
  const [activeTab, setActiveTab] = useState(searchParams.get('view') || 'timeline');
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all necessary data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [blogsData, categoriesData, archivesData, anthologiesData] = await Promise.all([
          fetchBlogs(),
          fetchCategories(),
          fetchBlogArchives(),
          fetchAnthologies()
        ]);
        setBlogs(blogsData);
        setCategories(categoriesData);
        setArchives(archivesData);
        setAnthologies(anthologiesData);
      } catch (error) {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      setShowLoader(false);
      return;
    }
    const t = setTimeout(() => setShowLoader(true), 1200);
    return () => clearTimeout(t);
  }, [loading]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ view: tab });
    setSelectedAnthology(null); // Reset selection
  };

  const handleAnthologyClick = async (slug) => {
    setLoading(true);
    try {
      const anthology = await fetchAnthology(slug);
      setSelectedAnthology(anthology);
      setSearchParams({ view: 'anthologies', anthology: slug });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Check URL for anthology param on load
  useEffect(() => {
    const slug = searchParams.get('anthology');
    if (slug && activeTab === 'anthologies' && !selectedAnthology) {
      handleAnthologyClick(slug);
    }
  }, [searchParams, activeTab]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Filter blogs based on category/search (for Timeline view)
  const filteredBlogs = (Array.isArray(blogs) ? blogs : []).filter(blog => {
    const matchesCategory = !selectedCategory || blog.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (blog.excerpt && blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));

    // Date filter
    let matchesDate = true;
    if (selectedDate) {
      const [year, month] = selectedDate.split('-');
      const blogDate = new Date(blog.created_at);
      matchesDate = blogDate.getFullYear() === parseInt(year) && (blogDate.getMonth() + 1) === parseInt(month);
    }

    return matchesCategory && matchesSearch && matchesDate;
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

  // Render Anthology Detail (List of blogs in the anthology)
  const renderAnthologyDetail = () => {
    if (!selectedAnthology) return null;

    const blogs = selectedAnthology.blogs || [];

    return (
      <div className="list-stack fade-in">
        <div className="list-section-header">
          <button className="retro-button-sm" onClick={() => { setSelectedAnthology(null); setSearchParams({ view: 'anthologies' }); }}>← Back</button>
          <h3 className="list-section-title">{selectedAnthology.title}</h3>
        </div>
        <p className="anthology-desc">{selectedAnthology.description}</p>

        <div className="library-entries">
          {blogs.map((blog) => (
            <BlogRow key={blog.id || blog._id} blog={blog} navigate={navigate} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Blogs</h1>
          <div className="blog-tabs">
            <button
              className={`blog-tab ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => handleTabChange('timeline')}
            >
              Timeline
            </button>
            <button
              className={`blog-tab ${activeTab === 'anthologies' ? 'active' : ''}`}
              onClick={() => handleTabChange('anthologies')}
            >
              Anthologies
            </button>
          </div>
        </div>
      </div>

      {(activeTab === 'timeline' || (activeTab === 'anthologies' && !selectedAnthology)) && (
        <div className="blog-search-bar">
          {activeTab === 'timeline' && (
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search articles..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          {activeTab === 'timeline' && (
            <button
              className="filter-toggle-btn retro-button retro-button--icon"
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Toggle filters"
            >
              Filters
            </button>
          )}
        </div>
      )}

      {showFilters && activeTab === 'timeline' && (
        <div className="blog-filters-dropdown">
          <div className="filter-group">
            <label className="filter-label" htmlFor="category-filter">Category</label>
            <select
              id="category-filter"
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor="archive-filter">Archive</label>
            <select
              id="archive-filter"
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
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          {showLoader ? (
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : null}
        </div>
      ) : activeTab === 'anthologies' ? (
        selectedAnthology ? renderAnthologyDetail() : (
          <div className="list-stack">
            {anthologies.length === 0 ? (
              <div className="blog-card-empty">No anthologies found.</div>
            ) : (
              <div className="anthologies-grid">
                {anthologies.map(anthology => (
                  <div key={anthology.id} className="anthology-card" onClick={() => handleAnthologyClick(anthology.slug)}>
                    <h3 className="anthology-title">{anthology.title}</h3>
                    <p className="anthology-count">{anthology.blogs?.length || 0} Stories</p>
                    <p className="anthology-schema-desc">{anthology.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
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
                {groupedBlogs[year].map((blog) => (
                  <BlogRow key={blog._id || blog.id} blog={blog} navigate={navigate} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

const BlogRow = ({ blog, navigate }) => {
  const dateLabel = blog?.created_at ? new Date(blog.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
  const readingTime = blog?.content ? Math.ceil(blog.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200) : 1;

  return (
    <button
      type="button"
      className="library-entry blog-entry"
      onClick={() => navigate(`/blogs/${blog._id || blog.id}`)}
    >
      <span className="library-entry-date">{dateLabel}</span>
      <span>
        <div className="library-entry-title">{blog.title}</div>
        <div className="library-entry-meta">
          {blog.category ? (
            <span className="library-entry-tag">{blog.category.toUpperCase()}</span>
          ) : null}
          <span className="meta-detail">{readingTime} MIN READ</span>
        </div>
      </span>
    </button>
  );
};
