module.exports = {
  // Specify the environment in which tests will run
  testEnvironment: 'node',

  // Define the pattern for test files
  // Jest will look for files ending with .test.js inside any 'tests' folder
  testMatch: ['**/tests/**/*.test.js'],

  // Enable code coverage collection
  collectCoverage: true,

  // Specify which files to include in the coverage report
  // Here, all JS files in 'utils' folder and 'index.js' are included
  collectCoverageFrom: [
    'utils/BenjaminUtils.js',
    'public/js/Benjamin.js',
    'index.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],

  // Directory where coverage reports will be saved
  coverageDirectory: 'coverage/backend',

  // Define the format(s) for coverage reports
  // 'text' outputs to console, 'html' creates a browsable HTML report
  coverageReporters: ['text', 'html'],

  // Set minimum coverage thresholds to enforce test quality
  // Tests will fail if coverage falls below these percentages
  coverageThreshold: {
    global: {
      branches: 80,   // minimum 80% of conditional branches covered
      functions: 80,  // minimum 80% of functions covered
      lines: 80,      // minimum 80% of lines covered
      statements: 80, // minimum 80% of statements covered
    },
  },
};
