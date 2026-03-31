/**
 * Integration-style tests for listStudentsForDashboard.
 * Firestore is mocked so no real network calls are made.
 * Verifies the function returns { rows, lastDoc } and applies filters correctly.
 */

// ── Firestore mock ────────────────────────────────────────────────────────────
const mockDocs = (items) =>
  items.map((data, i) => ({
    id: `doc-${i}`,
    data: () => data,
  }));

const mockGetDocs = jest.fn();
const mockQuery   = jest.fn((...args) => args);
const mockWhere   = jest.fn((...args) => args);
const mockOrderBy = jest.fn((...args) => args);
const mockLimit   = jest.fn((n) => n);
const mockStartAfter = jest.fn((d) => d);
const mockCollection = jest.fn(() => "users-ref");

jest.mock("firebase/firestore", () => ({
  collection:  (...args) => mockCollection(...args),
  query:       (...args) => mockQuery(...args),
  where:       (...args) => mockWhere(...args),
  orderBy:     (...args) => mockOrderBy(...args),
  limit:       (n)       => mockLimit(n),
  startAfter:  (d)       => mockStartAfter(d),
  getDocs:     (...args) => mockGetDocs(...args),
  // other exports used elsewhere
  addDoc: jest.fn(), deleteDoc: jest.fn(), doc: jest.fn(),
  updateDoc: jest.fn(), serverTimestamp: jest.fn(), where: (...a) => a,
}));

jest.mock("@/lib/firebase", () => ({
  getDb: () => ({ _isMock: true }),
}));

jest.mock("@/lib/audit", () => ({ logAudit: jest.fn() }));
jest.mock("@/lib/constants", () => ({
  PAGE_SIZE: { DEFAULT: 20, DASHBOARD: 50, ADMIN_DIRECTORY: 100 },
  USER_SUB_COLLECTIONS: [],
}));

import { listStudentsForDashboard } from "@/lib/data";

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe("listStudentsForDashboard", () => {
  it("returns { rows, lastDoc } shape", async () => {
    const students = [
      { name: "Alice", role: "student", email: "a@uni.edu" },
      { name: "Bob",   role: "student", email: "b@uni.edu" },
    ];
    mockGetDocs.mockResolvedValue({ docs: mockDocs(students) });

    const result = await listStudentsForDashboard({ search: "", pageSize: 50 });

    expect(result).toHaveProperty("rows");
    expect(result).toHaveProperty("lastDoc");
    expect(Array.isArray(result.rows)).toBe(true);
  });

  it("rows contain id field from document", async () => {
    mockGetDocs.mockResolvedValue({
      docs: mockDocs([{ name: "Alice", role: "student" }]),
    });

    const { rows } = await listStudentsForDashboard({});
    expect(rows[0]).toHaveProperty("id");
  });

  it("lastDoc is null when no documents returned", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });

    const { rows, lastDoc } = await listStudentsForDashboard({});
    expect(rows).toHaveLength(0);
    expect(lastDoc).toBeNull();
  });

  it("lastDoc is the last document snapshot when results exist", async () => {
    const docs = mockDocs([
      { name: "Alice", role: "student" },
      { name: "Bob",   role: "student" },
    ]);
    mockGetDocs.mockResolvedValue({ docs });

    const { lastDoc } = await listStudentsForDashboard({});
    expect(lastDoc).toBe(docs[docs.length - 1]);
  });

  it("returns empty rows and null lastDoc when db is unavailable", async () => {
    jest.resetModules();
    jest.doMock("@/lib/firebase", () => ({ getDb: () => null }));
    const { listStudentsForDashboard: fn } = await import("@/lib/data");
    const result = await fn({});
    expect(result).toEqual({ rows: [], lastDoc: null });
  });

  it("falls back to in-memory filter when Firestore throws failed-precondition", async () => {
    const err = new Error("index required");
    err.code = "failed-precondition";
    mockGetDocs
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce({
        docs: mockDocs([
          { name: "Alice", role: "student" },
          { name: "Bob",   role: "student" },
        ]),
      });

    const { rows } = await listStudentsForDashboard({ search: "alice" });
    expect(rows.some(r => r.name === "Alice")).toBe(true);
  });
});
