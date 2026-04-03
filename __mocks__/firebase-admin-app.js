// Mock for firebase-admin/app - used in Jest so tests don't require the package
module.exports = {
  getApps: () => [],
  initializeApp: () => ({}),
  cert: (config) => config,
};
