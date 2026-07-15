/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: './jest.babel.config.js' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    // Mock firebase-admin so tests that import API routes don't need the package installed
    '^firebase-admin/app$':  '<rootDir>/__mocks__/firebase-admin-app.js',
    '^firebase-admin/auth$': '<rootDir>/__mocks__/firebase-admin-auth.js',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],

  // ── Coverage ────────────────────────────────────────────────────────────────
  // Collect from lib/ only — pages/ and components/ require browser/firebase env.
  //
  // Files excluded fall into two categories:
  //   1. Firebase SDK / cloud initializers — require live credentials
  //   2. Browser-environment files (print API, download API, React hooks/contexts)
  //      These cannot be meaningfully exercised in jsdom; they are covered by E2E tests.
  collectCoverageFrom: [
    "lib/**/*.{js,jsx}",
    // ── Firebase / cloud initializers ──────────────────────────────────────────
    "!lib/firebase.js",
    "!lib/get-id-token.js",
    "!lib/uploadCloud.js",
    // ── Browser-only / React hook / context files ──────────────────────────────
    "!lib/auth-context.js",        // Firebase Auth + React context hooks
    "!lib/csv-download.js",        // Browser Blob + anchor-click download API
    "!lib/pdf-download.js",        // Browser window.print API
    "!lib/pdf-export.js",          // Complex browser PDF orchestration (~600 lines)
    "!lib/export-utils.js",        // Browser export helpers
    "!lib/toast-context.js",       // React context provider
    "!lib/use-ledger-section.js",  // Custom React hook (requires React rendering)
    "!lib/use-profile-edit.js",    // Custom React hook (requires React rendering)
    "!lib/student-data.js",        // Firebase real-time snapshot hooks
    "!lib/data.js",                // Firebase Firestore read/write operations
    "!lib/error-handler.js",       // Next.js error boundary handler
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  // Thresholds are set for the pure-logic subset above (auth, audit, rate-limit,
  // notifications, analytics, routing, security). The excluded browser/hook files
  // are validated by E2E tests instead.
  coverageThreshold: {
    global: {
      statements: 55,
      branches:   48,
      functions:  60,
      lines:      55,
    },
  },

};
