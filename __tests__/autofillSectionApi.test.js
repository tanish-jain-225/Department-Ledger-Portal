import handler from "@/pages/api/autofill-section";
import { verifyAuthToken } from "@/lib/api-auth";
import { isRateLimited } from "@/lib/rate-limit";
import { GoogleGenerativeAI } from "@google/generative-ai";

jest.mock("@/lib/api-auth", () => ({
  verifyAuthToken: jest.fn(),
}));

jest.mock("@/lib/rate-limit", () => ({
  isRateLimited: jest.fn(),
}));

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            title: "Smart Attendance Tracker",
            techStack: "Next.js, Firebase",
            description: "Built and deployed a dashboard",
          }),
        },
      }),
    }),
  })),
}));

function createReq(overrides = {}) {
  return {
    method: "POST",
    headers: { origin: "http://localhost:3000" },
    socket: { remoteAddress: "127.0.0.1" },
    body: {
      section: "project",
      existingData: [],
      fileData: "U29tZSB2YWxpZCBiYXNlNjQ=",
      fileMimeType: "application/pdf",
    },
    ...overrides,
  };
}

function createRes() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      return this;
    },
  };
}

describe("POST /api/autofill-section", () => {
  const env = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...env,
      GEMINI_API_KEY: "test-key",
      GEMINI_MODEL: "gemini-2.5-flash",
    };

    verifyAuthToken.mockResolvedValue("uid-1");
    isRateLimited.mockResolvedValue(false);
  });

  afterAll(() => {
    process.env = env;
  });

  it("rejects non-POST methods", async () => {
    const req = createReq({ method: "GET" });
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ error: "Method not allowed" });
  });

  it("allows any origin with universal CORS", async () => {
    const req = createReq({ headers: { origin: "https://malicious.example" } });
    const res = createRes();

    await handler(req, res);

    expect(res.headers["Access-Control-Allow-Origin"]).toBe("*");
    expect(res.statusCode).toBe(200);
  });

  it("returns early when auth fails", async () => {
    verifyAuthToken.mockImplementation(async (_req, res) => {
      res.status(401).json({ error: "Unauthorized" });
      return null;
    });

    const req = createReq();
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("enforces rate limits", async () => {
    isRateLimited.mockResolvedValue(true);

    const req = createReq();
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(429);
    expect(res.body.error).toMatch(/Too many requests/i);
  });

  it("validates section and file metadata", async () => {
    const req = createReq({
      body: {
        section: "unknown",
        existingData: [],
        fileData: "U29tZQ==",
        fileMimeType: "application/pdf",
      },
    });
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Invalid section/i);
  });

  it("rejects malformed base64 payload", async () => {
    const req = createReq({
      body: {
        section: "project",
        existingData: [],
        fileData: "not-base64$$$",
        fileMimeType: "application/pdf",
      },
    });
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "fileData must be a valid base64 string." });
  });

  it("rejects oversized uploads", async () => {
    const oversized = "A".repeat(15 * 1024 * 1024);
    const req = createReq({
      body: {
        section: "project",
        existingData: [],
        fileData: oversized,
        fileMimeType: "application/pdf",
      },
    });
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(413);
    expect(res.body.error).toMatch(/Maximum size is 10MB/i);
  });

  it("returns parsed AI response for valid requests", async () => {
    const req = createReq();
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      title: "Smart Attendance Tracker",
      techStack: "Next.js, Firebase",
      description: "Built and deployed a dashboard",
    });
  });

  it("returns 500 when AI response is not valid JSON object with required keys", async () => {
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: () => ({
        generateContent: async () => ({
          response: {
            text: () => "{\"title\":\"OnlyTitle\"}",
          },
        }),
      }),
    }));

    const req = createReq();
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "AI returned invalid JSON format" });
  });
});
