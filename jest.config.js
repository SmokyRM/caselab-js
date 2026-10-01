export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    'src/services/**/*.js',
    'src/middlewares/**/*.js',
    'src/controllers/**/*.js',
    'src/routes/**/*.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
