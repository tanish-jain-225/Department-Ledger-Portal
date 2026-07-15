/**
 * Unit tests for lib/audit.js
 * Verifies correct shape of audit entries and that failures are swallowed silently.
 */

// ── Firestore mock setup ──────────────────────────────────────────────────────
const mockAddDoc = jest.fn();

jest.mock("firebase/firestore", () => ({
  addDoc: (...args) => mockAddDoc(...args),
  collection: jest.fn((db, name) => ({ _collection: name })),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
}));

jest.mock("@/lib/firebase", () => ({
  getDb: jest.fn(() => ({ _type: "db" })),
}));

// Import after mocks
const { logAudit } = require("@/lib/audit");

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("logAudit — shape validation", () => {
  it("writes the correct document shape to the auditLogs collection", async () => {
    mockAddDoc.mockResolvedValueOnce({ id: "audit-1" });

    await logAudit({
      action: "student_updated",
      actorUid: "uid-actor",
      targetUid: "uid-target",
      description: "Profile updated by student",
      details: { field: "name" },
    });

    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const [collectionRef, payload] = mockAddDoc.mock.calls[0];
    expect(collectionRef._collection).toBe("auditLogs");
    expect(payload).toMatchObject({
      action: "student_updated",
      actionLabel: "Student Updated",
      sector: "STUDENT",
      actorUid: "uid-actor",
      targetUid: "uid-target",
      description: "Profile updated by student",
      details: { field: "name" },
    });
  });

  it("derives actionLabel correctly from underscore-separated action string", async () => {
    mockAddDoc.mockResolvedValueOnce({});

    await logAudit({ action: "user_role_assigned", actorUid: "uid-a" });

    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload.actionLabel).toBe("User Role Assigned");
  });

  it("derives the sector from the first segment of the action string", async () => {
    mockAddDoc.mockResolvedValueOnce({});

    await logAudit({ action: "achievements_deleted", actorUid: "uid-a" });

    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload.sector).toBe("ACHIEVEMENTS");
  });

  it("defaults missing optional fields to null or empty object", async () => {
    mockAddDoc.mockResolvedValueOnce({});

    await logAudit({ action: "profile_updated" });

    const payload = mockAddDoc.mock.calls[0][1];
    expect(payload.actorUid).toBeNull();
    expect(payload.targetUid).toBeNull();
    expect(payload.description).toBeNull();
    expect(payload.details).toEqual({});
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("logAudit — resilience", () => {
  it("returns early without throwing when Firestore is unavailable (getDb returns null)", async () => {
    const { getDb } = require("@/lib/firebase");
    getDb.mockReturnValueOnce(null);

    // Should NOT throw even though db is null
    await expect(
      logAudit({ action: "profile_updated", actorUid: "uid-a" })
    ).resolves.toBeUndefined();

    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it("does NOT throw when Firestore write fails — failure is swallowed silently", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockAddDoc.mockRejectedValueOnce(new Error("Network error"));

    // This must NOT reject — the error should be caught and console.error'd internally
    await expect(
      logAudit({ action: "student_updated", actorUid: "uid-a" })
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Audit Service] Stream interruption: Network error")
    );
    consoleSpy.mockRestore();
  });

  it("emits a console.error with the underlying error message on failure", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockAddDoc.mockRejectedValueOnce(new Error("Quota exceeded"));

    await logAudit({ action: "profile_updated", actorUid: "uid-a" });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const [msg] = consoleSpy.mock.calls[0];
    expect(msg).toContain("Quota exceeded");
    consoleSpy.mockRestore();
  });
});
