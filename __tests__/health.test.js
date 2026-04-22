import handler from "@/pages/api/health";

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
    const req = { method: "GET", headers: {} };
    const res = createRes();

    handler(req, res);

    expect(res.headers["Access-Control-Allow-Origin"]).toBe("*");
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      service: "student-ledger-portal",
    });
    expect(res.body).not.toHaveProperty("details");
  });

  it("returns debug details only with matching debug token header", () => {
    process.env.HEALTHCHECK_DEBUG_TOKEN = "secret-token";

    const req = { method: "GET", headers: { "x-health-debug-token": "secret-token" } };
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

  it("does not return debug details when token does not match", () => {
    process.env.HEALTHCHECK_DEBUG_TOKEN = "secret-token";

    const req = { method: "GET", headers: { "x-health-debug-token": "wrong-token" } };
    const res = createRes();

    handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true, service: "student-ledger-portal" });
    expect(res.body).not.toHaveProperty("details");
  });

  it("returns 503 when required environment variables are missing", () => {
    delete process.env.GEMINI_MODEL;

    const req = { method: "GET", headers: {} };
    const res = createRes();

    handler(req, res);

    expect(res.statusCode).toBe(503);
    expect(res.body).toMatchObject({
      ok: false,
      service: "student-ledger-portal",
    });
    expect(res.body).not.toHaveProperty("details");
  });
});
