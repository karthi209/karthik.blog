import { parsePagination, createPaginatedResponse } from '../../utils/pagination.js';

describe('Pagination Utils', () => {
  describe('parsePagination', () => {
    it('should parse default pagination', () => {
      const req = { query: {} };
      const result = parsePagination(req);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('should parse custom pagination', () => {
      const req = { query: { page: '2', limit: '10' } };
      const result = parsePagination(req);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(10);
    });

    it('should enforce max limit', () => {
      const req = { query: { limit: '200' } };
      const result = parsePagination(req, 20, 100);
      expect(result.limit).toBe(100);
    });

    it('should handle invalid page numbers', () => {
      const req = { query: { page: '0' } };
      const result = parsePagination(req);
      expect(result.page).toBe(1);
    });
  });

  describe('createPaginatedResponse', () => {
    it('should create paginated response', () => {
      const data = [1, 2, 3];
      const result = createPaginatedResponse(data, 25, 2, 10);
      
      expect(result.data).toEqual(data);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should handle first page', () => {
      const result = createPaginatedResponse([], 10, 1, 10);
      expect(result.pagination.hasPrev).toBe(false);
      expect(result.pagination.hasNext).toBe(false);
    });
  });
});

