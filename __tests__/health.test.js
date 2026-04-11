import handler from "@/pages/api/health";

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe("GET /api/health", () => {
  const env = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...env };
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-project";
    process.env.GEMINI_API_KEY = "demo-key";
    process.env.GEMINI_MODEL = "gemini-2.5-flash";
    delete process.env.HEALTHCHECK_DEBUG_TOKEN;
  });

  afterAll(() => {
    process.env = env;
  });

  it("returns minimal public response without debug token", () => {
    const req = { headers: {} };
    const res = createRes();

    handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      service: "student-ledger-portal",
    });
    expect(res.body).not.toHaveProperty("details");
  });

  it("returns debug details only with matching debug token header", () => {
    process.env.HEALTHCHECK_DEBUG_TOKEN = "secret-token";

    const req = { headers: { "x-health-debug-token": "secret-token" } };
    const res = createRes();

    handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("details");
    expect(res.body.details).toEqual({
      firebase: "configured",
      gemini: {
        apiKey: "configured",
        model: "configured",
      },
    });
  });
});
