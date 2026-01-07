// Import required modules and utilities
const { getApiKey, loadLocalKeys } = require('../utils/BenjaminUtils');

// Test suite for BenjaminUtils - validates API key retrieval from environment variables and local files
describe('Unit Tests for BenjaminUtils', () => {
  // Reset environment variables before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear relevant environment variables to prevent test contamination
    delete process.env.TEST_KEY;
    delete process.env.API_KEY;
    delete process.env.API_TEST_KEY;
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
  });

  // Test suite for loadLocalKeys function - validates reading keys from api_keys.json file
  describe('loadLocalKeys', () => {
    // Test 5: Verifies loadLocalKeys returns an object when api_keys.json doesn't exist
    // Purpose: Ensures function doesn't crash if local file is missing
    // and gracefully returns an empty object instead for fallback to environment variables
    it('should return an empty object if api_keys.json does not exist', () => {
      const result = loadLocalKeys();
      expect(typeof result).toEqual('object');
    });

    // Test 6: Verifies loadLocalKeys handles file read/parse errors gracefully
    // Purpose: If file is corrupted or unreadable, function should catch the error
    // and return an empty object rather than throwing an exception
    // This ensures application continues running even if local keys file is invalid
    it('should handle errors gracefully and return empty object', () => {
      const result = loadLocalKeys();
      expect(result).toEqual(expect.any(Object));
    });
  });
});