export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-health-debug-token");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const geminiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL;
  const ok = Boolean(projectId && geminiKey && geminiModel);

  // Public response intentionally omits environment-detail breakdown
  // to avoid leaking internal configuration state.
  const publicResponse = {
    ok,
    service: "student-ledger-portal",
    time: new Date().toISOString(),
  };

  const debugToken = process.env.HEALTHCHECK_DEBUG_TOKEN;
  const debugHeader = req.headers["x-health-debug-token"];

  if (debugToken && debugHeader === debugToken) {
    return res.status(ok ? 200 : 503).json({
      ...publicResponse,
      details: {
        firebase: projectId ? "configured" : "missing_project_id",
        gemini: {
          apiKey: geminiKey ? "configured" : "missing_api_key",
          model: geminiModel ? "configured" : "missing_model",
        },
      },
    });
  }

  return res.status(ok ? 200 : 503).json(publicResponse);
}
