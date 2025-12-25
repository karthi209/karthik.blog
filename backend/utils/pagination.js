/**
 * Pagination utilities
 */

/**
 * Parse pagination parameters from request query
 */
export const parsePagination = (req, defaultLimit = 20, maxLimit = 100) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  let limit = parseInt(req.query.limit) || defaultLimit;
  
  // Enforce max limit
  if (limit > maxLimit) limit = maxLimit;
  if (limit < 1) limit = defaultLimit;
  
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

/**
 * Create paginated response
 */
export const createPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalItems: total, // Alias for consistency with tests
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

