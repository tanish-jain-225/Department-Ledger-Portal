import handler from "@/pages/api/analyze-readiness";
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
            score: 88,
            label: "ready",
            summary: "Strong profile across projects and academics.",
            strengths: ["Consistent GPA", "Project depth", "Communication"],
            weaknesses: ["Cloud deployment exposure"],
            recommendations: ["Do internship", "Add deployed project", "Practice DSA"],
            careerRoadmap: "Target backend internships for the next semester.",
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
      profile: { name: "Student", branch: "CSE", year: "3" },
      academic: [{ gpa: 8.2 }],
      activities: [],
      achievements: [],
      placements: [],
      projects: [],
      skills: [],
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

describe("POST /api/analyze-readiness", () => {
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
    expect(res.body.error).toMatch(/Rate limit exceeded/i);
  });

  it("requires profile object", async () => {
    const req = createReq({ body: { profile: null } });
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Profile required" });
  });

  it("rejects invalid GPA values", async () => {
    const req = createReq({
      body: {
        profile: { name: "Student" },
        academic: [{ gpa: 12 }],
      },
    });
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Invalid GPA value/i);
  });

  it("returns 500 when AI env vars are missing", async () => {
    delete process.env.GEMINI_API_KEY;

    const req = createReq();
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "AI environment not configured." });
  });

  it("returns sanitized readiness report for valid requests", async () => {
    const req = createReq();
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      score: 88,
      label: "Ready",
      summary: "Strong profile across projects and academics.",
    });
    expect(res.body.strengths.length).toBeGreaterThan(0);
    expect(res.body.weaknesses.length).toBeGreaterThan(0);
    expect(res.body.recommendations.length).toBeGreaterThan(0);
  });

  it("maps AI quota errors to 429", async () => {
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: () => ({
        generateContent: async () => {
          const err = new Error("quota exceeded");
          err.status = 429;
          throw err;
        },
      }),
    }));

    const req = createReq();
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(429);
    expect(res.body.error).toMatch(/quota/i);
  });
});
