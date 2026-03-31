export default function handler(req, res) {
  const projectId  = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const geminiKey  = !!process.env.GEMINI_API_KEY;
  const firebase   = projectId ? "configured" : "missing_project_id";
  const ok         = firebase === "configured" && geminiKey;

  res.status(ok ? 200 : 503).json({
    ok,
    service:  "student-ledger-portal",
    time:     new Date().toISOString(),
    firebase,
    gemini:   geminiKey,
  });
}
