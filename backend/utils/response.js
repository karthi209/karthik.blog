/**
 * Standardized API response utilities
 */

/**
 * Standard success response
 */
export const successResponse = (data, message = null, statusCode = 200) => {
  const response = {
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data })
  };
  return { response, statusCode };
};

/**
 * Standard error response
 */
export const errorResponse = (message, errors = null, statusCode = 400) => {
  const response = {
    success: false,
    message,
    ...(errors && { errors })
  };
  return { response, statusCode };
};

/**
 * Standard paginated response (already handled by pagination utils, but for consistency)
 */
export const paginatedResponse = (data, pagination) => {
  return {
    success: true,
    data,
    pagination
  };
};

/**
 * Standard create response
 */
export const createResponse = (data, message = 'Created successfully') => {
  return successResponse(data, message, 201);
};

/**
 * Standard update response
 */
export const updateResponse = (data, message = 'Updated successfully') => {
  return successResponse(data, message, 200);
};

/**
 * Standard delete response
 */
export const deleteResponse = (message = 'Deleted successfully') => {
  return {
    response: {
      success: true,
      message,
      data: null
    },
    statusCode: 200
  };
};

