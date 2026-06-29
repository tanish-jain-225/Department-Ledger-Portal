import { getAdminApp, getAdminAuth, getAdminDb, verifyAuthToken } from "@/lib/api-auth";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

jest.mock("firebase-admin/app", () => {
  const actual = jest.requireActual("../__mocks__/firebase-admin-app.js");
  return {
    ...actual,
    getApps: jest.fn(() => []),
    initializeApp: jest.fn(() => ({})),
  };
});

jest.mock("firebase-admin/auth", () => {
  const actual = jest.requireActual("../__mocks__/firebase-admin-auth.js");
  return {
    ...actual,
    getAuth: jest.fn(() => ({
      verifyIdToken: jest.fn(),
    })),
  };
});

describe("api-auth utility", () => {
  const env = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...env,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "test-project-id",
    };
  });

  afterAll(() => {
    process.env = env;
  });

  it("getAdminApp initializes and returns firebase admin app instance", () => {
    const app = getAdminApp();
    expect(initializeApp).toHaveBeenCalledWith({ projectId: "test-project-id" });
    expect(app).toBeDefined();
  });

  it("getAdminAuth returns auth instance using admin app", () => {
    const auth = getAdminAuth();
    expect(getAuth).toHaveBeenCalled();
    expect(auth).toBeDefined();
  });

  it("getAdminDb returns null if no firebase credentials are set in environment", () => {
    const db = getAdminDb();
    expect(db).toBeNull();
  });

  it("verifyAuthToken rejects when authorization header is missing", async () => {
    const req = { headers: {} };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; },
    };

    const uid = await verifyAuthToken(req, res);
    expect(uid).toBeNull();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized: missing token" });
  });

  it("verifyAuthToken validates token and returns uid on success", async () => {
    const mockVerifyIdToken = jest.fn().mockResolvedValue({ uid: "test-uid-123" });
    getAuth.mockReturnValueOnce({ verifyIdToken: mockVerifyIdToken });

    const req = { headers: { authorization: "Bearer valid-token" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    const uid = await verifyAuthToken(req, res);
    expect(uid).toBe("test-uid-123");
    expect(mockVerifyIdToken).toHaveBeenCalledWith("valid-token");
  });

  it("verifyAuthToken rejects on verifyIdToken failure", async () => {
    const mockVerifyIdToken = jest.fn().mockRejectedValue(new Error("invalid signature"));
    getAuth.mockReturnValueOnce({ verifyIdToken: mockVerifyIdToken });

    const req = { headers: { authorization: "Bearer invalid-token" } };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.body = payload; return this; },
    };

    const uid = await verifyAuthToken(req, res);
    expect(uid).toBeNull();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized: invalid or expired token" });
  });
});
