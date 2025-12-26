let API_URL = import.meta.env.VITE_API_URL || '/api';

export const fetchBlogs = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.category) queryParams.append('category', filters.category);
  if (filters.startDate) queryParams.append('startDate', filters.startDate);
  if (filters.endDate) queryParams.append('endDate', filters.endDate);
  if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
  if (filters.order) queryParams.append('order', filters.order);

  const response = await fetch(`${API_URL}/blogs?${queryParams}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch blogs: ${response.statusText}`);
  }
  const result = await response.json();
  // Backend returns {success: true, data: [...], pagination: {...}}
  return result.data || result;
};

export const fetchCategories = async () => {
  const response = await fetch(`${API_URL}/blogs/categories`);
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }
  const result = await response.json();
  return Array.isArray(result) ? result : (result.data || []);
};

export const fetchBlogsByCategory = async (category) => {
  const response = await fetch(`${API_URL}/blogs/category/${category}`);
  return response.json();
};

export const fetchBlogArchives = async () => {
  const response = await fetch(`${API_URL}/blogs/archives`);
  if (!response.ok) {
    throw new Error(`Failed to fetch archives: ${response.statusText}`);
  }
  const result = await response.json();
  return Array.isArray(result) ? result : (result.data || []);
};

export const fetchHomepageData = async () => {
  const response = await fetch(`${API_URL}/logs/combined/homepage`);
  return response.json();
};

export const fetchProjects = async () => {
  const response = await fetch(`${API_URL}/projects`);
  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.statusText}`);
  }
  const result = await response.json();
  // Backend returns {success: true, data: [...]}
  return result.data || result;
};

export const fetchLogs = async (type) => {
  const response = await fetch(`${API_URL}/logs/${type}`);
  return response.json();
};

export const fetchNotes = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
  if (filters.order) queryParams.append('order', filters.order);
  const qs = queryParams.toString();
  const response = await fetch(`${API_URL}/notes${qs ? `?${qs}` : ''}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch notes: ${response.statusText}`);
  }
  const result = await response.json();
  // Backend returns {success: true, data: [...], pagination: {...}}
  return result.data || result;
};

export const fetchNote = async (id) => {
  const response = await fetch(`${API_URL}/notes/${id}`);
  return response.json();
};

export const fetchGalleryPhotos = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
  if (filters.order) queryParams.append('order', filters.order);
  if (filters.page) queryParams.append('page', filters.page);
  if (filters.limit) queryParams.append('limit', filters.limit);
  const qs = queryParams.toString();
  const response = await fetch(`${API_URL}/gallery${qs ? `?${qs}` : ''}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch gallery photos: ${response.statusText}`);
  }
  const result = await response.json();
  // Backend returns {success: true, data: [...], pagination: {...}}
  return result.data || result;
};

export const addBlog = async (blog) => {
  try {
    const response = await fetch(`${API_URL}/blogs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(blog),
    });

    if (!response.ok) {
      throw new Error('Failed to create blog post');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding blog:', error);
    throw error;
  }
};

export const addLog = async (log) => {
  const response = await fetch(`${API_URL}/logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(log),
  });
  return response.json();
};

// Fetch all anthologies
export const fetchAnthologies = async () => {
  try {
    const response = await fetch(`${API_URL}/anthologies`);
    if (!response.ok) throw new Error('Failed to fetch anthologies');
    const result = await response.json();
    // Backend may return array directly or wrapped in {success: true, data: [...]}
    return Array.isArray(result) ? result : (result.data || []);
  } catch (error) {
    console.error('Error fetching anthologies:', error);
    return [];
  }
};

// Fetch single anthology
export const fetchAnthology = async (slug) => {
  try {
    const response = await fetch(`${API_URL}/anthologies/${slug}`);
    if (!response.ok) throw new Error('Failed to fetch anthology');
    const result = await response.json();
    // Backend may return object directly or wrapped in {success: true, data: {...}}
    return result.data || result;
  } catch (error) {
    console.error('Error fetching anthology:', error);
    return null;
  }
}; 