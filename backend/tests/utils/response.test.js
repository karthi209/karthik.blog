import { successResponse, errorResponse, createResponse, updateResponse, deleteResponse } from '../../utils/response.js';

describe('Response Utils', () => {
  describe('successResponse', () => {
    it('should create success response', () => {
      const { response, statusCode } = successResponse({ id: 1 });
      expect(response.success).toBe(true);
      expect(response.data.id).toBe(1);
      expect(statusCode).toBe(200);
    });

    it('should include message if provided', () => {
      const { response } = successResponse({ id: 1 }, 'Success');
      expect(response.message).toBe('Success');
    });
  });

  describe('errorResponse', () => {
    it('should create error response', () => {
      const { response, statusCode } = errorResponse('Error occurred');
      expect(response.success).toBe(false);
      expect(response.message).toBe('Error occurred');
      expect(statusCode).toBe(400);
    });

    it('should include errors array', () => {
      const { response } = errorResponse('Validation failed', ['Field required']);
      expect(response.errors).toEqual(['Field required']);
    });
  });

  describe('createResponse', () => {
    it('should create response with 201 status', () => {
      const { response, statusCode } = createResponse({ id: 1 });
      expect(statusCode).toBe(201);
      expect(response.message).toBe('Created successfully');
    });
  });

  describe('updateResponse', () => {
    it('should create update response', () => {
      const { response } = updateResponse({ id: 1 });
      expect(response.message).toBe('Updated successfully');
    });
  });

  describe('deleteResponse', () => {
    it('should create delete response', () => {
      const { response } = deleteResponse();
      expect(response.message).toBe('Deleted successfully');
      expect(response.data).toBe(null);
      expect(response.success).toBe(true);
    });
  });
});

