let API_URL = import.meta.env.VITE_API_URL || '/api';

export const fetchBlogs = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.category) queryParams.append('category', filters.category);
  if (filters.startDate) queryParams.append('startDate', filters.startDate);
  if (filters.endDate) queryParams.append('endDate', filters.endDate);
  if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
  if (filters.order) queryParams.append('order', filters.order);

  const response = await fetch(`${API_URL}/blogs?${queryParams}`);
  return response.json();
};

export const fetchCategories = async () => {
  const response = await fetch(`${API_URL}/blogs/categories`);
  return response.json();
};

export const fetchBlogsByCategory = async (category) => {
  const response = await fetch(`${API_URL}/blogs/category/${category}`);
  return response.json();
};

export const fetchBlogArchives = async () => {
  const response = await fetch(`${API_URL}/blogs/archives`);
  return response.json();
};

export const fetchHomepageData = async () => {
  const response = await fetch(`${API_URL}/logs/combined/homepage`);
  return response.json();
};

export const fetchLogs = async (type) => {
  const response = await fetch(`${API_URL}/logs/${type}`);
  return response.json();
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