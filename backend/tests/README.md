# Testing Guide

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

- `tests/utils/` - Utility function tests
- `tests/middleware/` - Middleware tests
- `tests/routes/` - Route/API endpoint tests (to be added)
- `tests/models/` - Model tests (to be added)

## Writing Tests

Tests use Jest framework. Example:

```javascript
describe('Feature Name', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

## Test Results

All tests are currently passing:
- ✅ Pagination utilities (6 tests)
- ✅ Validation utilities (6 tests)
- ✅ Response utilities (7 tests)

**Total: 19 tests passing**

## Coverage Goals

- Aim for 80%+ coverage on critical paths
- Focus on business logic and utilities
- Integration tests for API endpoints

## Requirements

- Node.js 16+ (Jest 28 compatible)
- Tests use ES modules (experimental VM modules)

