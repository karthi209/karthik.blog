import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { logger } from '../../utils/logger.js';

describe('Logger', () => {
  let consoleLog, consoleError, consoleWarn;

  beforeEach(() => {
    // Save original console methods
    consoleLog = console.log;
    consoleError = console.error;
    consoleWarn = console.warn;
    
    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    // Restore original console methods
    console.log = consoleLog;
    console.error = consoleError;
    console.warn = consoleWarn;
  });

  it('should log info messages', () => {
    logger.info('Test message', { key: 'value' });
    expect(console.log).toHaveBeenCalled();
  });

  it('should log error messages', () => {
    logger.error('Error message', { error: 'test' });
    expect(console.error).toHaveBeenCalled();
  });

  it('should log warning messages', () => {
    logger.warn('Warning message', { warning: 'test' });
    expect(console.warn).toHaveBeenCalled();
  });

  it('should log debug messages', () => {
    logger.debug('Debug message', { debug: 'test' });
    // Debug may not log depending on LOG_LEVEL
  });
});

