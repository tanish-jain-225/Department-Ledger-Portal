/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    // Mock firebase-admin so tests that import API routes don't need the package installed
    '^firebase-admin/app$':  '<rootDir>/__mocks__/firebase-admin-app.js',
    '^firebase-admin/auth$': '<rootDir>/__mocks__/firebase-admin-auth.js',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
};
