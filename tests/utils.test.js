// Import required modules and utilities
const fs = require('fs');
const path = require('path');
const { getApiKey, loadLocalKeys } = require('../utils/BenjaminUtils');

const API_KEYS_PATH = path.join(__dirname, '..', 'utils', 'api_keys.json');

// Test suite for BenjaminUtils - validates API key retrieval from environment variables and local files
describe('Unit Tests for BenjaminUtils', () => {
  // Reset environment variables before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure local api_keys.json is removed so tests control its presence
    if (fs.existsSync(API_KEYS_PATH)) {
      fs.unlinkSync(API_KEYS_PATH);
    }
    // Clear relevant environment variables to prevent test contamination
    delete process.env.TEST_KEY;
    delete process.env.API_KEY;
    delete process.env.API_TEST_KEY;
    delete process.env.MY_KEY;
    delete process.env.API_MY_KEY;
  });

  // Test suite for getApiKey function - validates API key retrieval mechanisms
  describe('getApiKey', () => {
    // Test 1: Verifies getApiKey returns null when no key name is provided
    // Purpose: Ensures function handles missing input gracefully without crashing
    it('should return null if name is not provided', () => {
      const result = getApiKey();
      expect(result).toBeNull();
    });

    // Test 2: Verifies getApiKey successfully retrieves keys from environment variables
    // Purpose: Tests the core functionality - retrieving API keys from process.env
    // Sets TEST_KEY='env-value' and confirms getApiKey can find and return it
    it('should return API key from environment variable', () => {
      process.env.TEST_KEY = 'env-value';
      const result = getApiKey('TEST_KEY', { fallbackToFile: false });
      expect(result).toEqual('env-value');
    });

    // Test 3: Verifies getApiKey checks multiple naming patterns for keys
    // Purpose: Tests that function tries different candidate variable names:
    //          - original name (custom_key)
    //          - uppercase (CUSTOM_KEY)  
    //          - with API_ prefix (API_CUSTOM_KEY)
    // Sets API_CUSTOM_KEY and searches for 'custom_key' to verify it tries all patterns
    it('should check multiple candidate names for environment variable', () => {
      process.env.API_CUSTOM_KEY = 'found-value';
      const result = getApiKey('custom_key', { fallbackToFile: false });
      expect(result).toEqual('found-value');
    });

    // Test 4: Verifies getApiKey returns null when key doesn't exist in environment
    // Purpose: Ensures function properly handles missing keys by returning null
    // rather than returning undefined or throwing errors
    // Disables file fallback to test only environment variable lookup
    it('should return null if key is not found', () => {
      const result = getApiKey('NONEXISTENT_KEY', { fallbackToFile: false });
      expect(result).toBeNull();
    });

    // Test 5: Verifies getApiKey falls back to api_keys.json with exact key
    it('should return API key from api_keys.json when not in env (exact key)', () => {
      const fileKeys = { my_key: 'file-value' };
      fs.writeFileSync(API_KEYS_PATH, JSON.stringify(fileKeys), 'utf8');

      const result = getApiKey('my_key'); // uses default { fallbackToFile: true }
      expect(result).toEqual('file-value');
    });

    // Test 6: Verifies getApiKey falls back to api_keys.json using uppercase key
    it('should return API key from api_keys.json using uppercase key name', () => {
      const fileKeys = { MY_KEY: 'upper-file-value' };
      fs.writeFileSync(API_KEYS_PATH, JSON.stringify(fileKeys), 'utf8');

      const result = getApiKey('my_key');
      expect(result).toEqual('upper-file-value');
    });

    // Test 7: Verifies getApiKey returns null when not in env or file
    it('should return null when key is missing from both env and api_keys.json', () => {
      const fileKeys = { OTHER_KEY: 'something' };
      fs.writeFileSync(API_KEYS_PATH, JSON.stringify(fileKeys), 'utf8');

      const result = getApiKey('missing_key');
      expect(result).toBeNull();
    });
  });

  // Test suite for loadLocalKeys function - validates reading keys from api_keys.json file
  describe('loadLocalKeys', () => {
    // Test 8: Verifies loadLocalKeys returns an empty object when api_keys.json does not exist
    it('should return an empty object if api_keys.json does not exist', () => {
      if (fs.existsSync(API_KEYS_PATH)) fs.unlinkSync(API_KEYS_PATH);
      const result = loadLocalKeys();
      expect(result).toEqual({});
    });

    // Test 9: Verifies loadLocalKeys returns empty object for empty api_keys.json
    it('should return an empty object if api_keys.json is empty', () => {
      fs.writeFileSync(API_KEYS_PATH, '', 'utf8');
      const result = loadLocalKeys();
      expect(result).toEqual({});
    });

    // Test 10: Verifies loadLocalKeys returns parsed object for valid api_keys.json
    it('should return parsed keys when api_keys.json has valid JSON', () => {
      const data = { SOME_KEY: 'value' };
      fs.writeFileSync(API_KEYS_PATH, JSON.stringify(data), 'utf8');

      const result = loadLocalKeys();
      expect(result).toEqual(data);
    });

    // Test 11: Verifies loadLocalKeys handles JSON parse errors gracefully
    it('should handle JSON parse errors and return empty object', () => {
      fs.writeFileSync(API_KEYS_PATH, '{ invalid json', 'utf8');

      const result = loadLocalKeys();
      expect(result).toEqual({});
    });
  });
});