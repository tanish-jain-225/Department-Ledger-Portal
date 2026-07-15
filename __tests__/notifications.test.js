/**
 * Unit tests for lib/notifications.js
 * Mocks Firestore so no live credentials are needed.
 */

// ── Firestore mock setup ──────────────────────────────────────────────────────
const mockAddDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockWriteBatch = jest.fn();
const mockDeleteDoc = jest.fn();

const mockBatch = {
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};

jest.mock("firebase/firestore", () => ({
  addDoc: (...args) => mockAddDoc(...args),
  collection: jest.fn((db, name) => ({ _collection: name })),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
  getDocs: (...args) => mockGetDocs(...args),
  query: jest.fn((...args) => ({ _query: args })),
  where: jest.fn((...args) => ({ _where: args })),
  limit: jest.fn((n) => ({ _limit: n })),
  deleteDoc: (...args) => mockDeleteDoc(...args),
  doc: jest.fn((db, col, id) => ({ _path: `${col}/${id}` })),
  writeBatch: jest.fn(() => mockBatch),
}));

jest.mock("@/lib/firebase", () => ({
  getDb: jest.fn(() => ({ _type: "db" })),
}));

// ── Import after mocks ────────────────────────────────────────────────────────
const {
  createNotification,
  purgeNotifications,
  markAllAsRead,
  clearAllNotifications,
  syncAdminNotifications,
} = require("@/lib/notifications");

// Helper to build a fake QuerySnapshot
function makeSnap(docs = []) {
  return {
    empty: docs.length === 0,
    docs: docs.map((data, i) => ({
      id: `doc${i}`,
      ref: { id: `doc${i}` },
      data: () => data,
    })),
    forEach(fn) {
      this.docs.forEach(fn);
    },
  };
}

// Reset all mocks before each test and restore the default getDb value.
// jest.clearAllMocks() wipes the factory return value set in jest.mock(),
// so we must re-establish the default after each clear.
beforeEach(() => {
  jest.clearAllMocks();
  // Re-establish default: getDb() returns a working db object.
  // Individual tests that need getDb to return null use mockReturnValueOnce(null).
  const { getDb } = require("@/lib/firebase");
  getDb.mockReturnValue({ _type: "db" });
  // Restore batch commit mock (cleared by clearAllMocks)
  mockBatch.commit.mockResolvedValue(undefined);
});

// ─────────────────────────────────────────────────────────────────────────────
describe("createNotification", () => {
  it("writes the correct shape to Firestore", async () => {
    mockAddDoc.mockResolvedValueOnce({ id: "notif1" });

    await createNotification("uid-123", {
      title: "Test",
      message: "Hello",
      type: "info",
      link: "/dashboard",
      relatedId: "role_abc",
    });

    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload).toMatchObject({
      userUid: "uid-123",
      title: "Test",
      message: "Hello",
      type: "info",
      link: "/dashboard",
      relatedId: "role_abc",
      read: false,
    });
  });

  it("throws if Firestore is unavailable", async () => {
    // Require getDb fresh inside the test so mockReturnValueOnce is consumed
    // by exactly this createNotification call, not an earlier one.
    const { getDb } = require("@/lib/firebase");
    getDb.mockReturnValueOnce(null);

    await expect(
      createNotification("uid-x", { title: "T", message: "M" })
    ).rejects.toThrow("[Notification Service] Firestore unavailable.");
  });

  it("applies default values for optional fields", async () => {
    mockAddDoc.mockResolvedValueOnce({});

    await createNotification("uid-456", { title: "T", message: "M" });

    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload.type).toBe("info");
    expect(payload.link).toBeNull();
    expect(payload.relatedId).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("purgeNotifications", () => {
  it("deletes all documents with matching relatedId", async () => {
    mockGetDocs.mockResolvedValueOnce(
      makeSnap([{ relatedId: "role_123" }, { relatedId: "role_123" }])
    );

    await purgeNotifications("role_123");

    // writeBatch().delete should be called for each doc
    expect(mockBatch.delete).toHaveBeenCalledTimes(2);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it("is a no-op when no matching documents exist", async () => {
    mockGetDocs.mockResolvedValueOnce(makeSnap([]));

    await purgeNotifications("role_nonexistent");

    expect(mockBatch.commit).not.toHaveBeenCalled();
  });

  it("returns early if relatedId is falsy", async () => {
    await purgeNotifications(null);
    expect(mockGetDocs).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("markAllAsRead", () => {
  it("updates each unread notification to read:true", async () => {
    mockGetDocs.mockResolvedValueOnce(
      makeSnap([{ read: false }, { read: false }])
    );

    await markAllAsRead("uid-admin");

    expect(mockBatch.update).toHaveBeenCalledTimes(2);
    // Both updates should set read: true
    expect(mockBatch.update.mock.calls[0][1]).toEqual({ read: true });
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it("is a no-op when there are no unread notifications", async () => {
    mockGetDocs.mockResolvedValueOnce(makeSnap([]));

    await markAllAsRead("uid-admin");

    expect(mockBatch.commit).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("clearAllNotifications", () => {
  it("deletes all notifications for the user", async () => {
    mockGetDocs.mockResolvedValueOnce(
      makeSnap([{ userUid: "uid-1" }, { userUid: "uid-1" }, { userUid: "uid-1" }])
    );

    await clearAllNotifications("uid-1");

    expect(mockBatch.delete).toHaveBeenCalledTimes(3);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it("returns early if userUid is falsy", async () => {
    await clearAllNotifications(undefined);
    expect(mockGetDocs).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("syncAdminNotifications — deduplication by relatedId", () => {
  it("only creates notifications whose relatedId is not already present", async () => {
    // Mock: 1 pending role request, 0 deletion requests
    // Mock: existing notification already has relatedId for role_doc0
    mockGetDocs
      .mockResolvedValueOnce(makeSnap([{ email: "a@test.com", requestedRole: "student" }])) // roleRequests
      .mockResolvedValueOnce(makeSnap([]))                                                    // deletionRequests
      .mockResolvedValueOnce(makeSnap([{ relatedId: "role_doc0", userUid: "admin-1" }]));    // existing notifs

    mockAddDoc.mockResolvedValue({});

    await syncAdminNotifications("admin-1");

    // relatedId "role_doc0" already exists, so no new notification should be created
    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it("creates a new notification when the relatedId is absent", async () => {
    // Mock: 1 pending role request with a new ID not in existing notifs
    mockGetDocs
      .mockResolvedValueOnce(makeSnap([{ email: "b@test.com", requestedRole: "faculty" }])) // roleRequests
      .mockResolvedValueOnce(makeSnap([]))                                                   // deletionRequests
      .mockResolvedValueOnce(makeSnap([]));                                                  // no existing notifs

    mockAddDoc.mockResolvedValue({});

    await syncAdminNotifications("admin-2");

    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload.relatedId).toBe("role_doc0");
    expect(payload.type).toBe("info");
  });
});
