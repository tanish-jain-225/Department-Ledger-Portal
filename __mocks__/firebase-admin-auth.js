// Mock for firebase-admin/auth — used in Jest so tests don't require the package
module.exports = {
  getAuth: () => ({
    verifyIdToken: async () => ({ uid: "test-uid" }),
  }),
};
