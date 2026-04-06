export default function handler(req, res) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const geminiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL;
  const firebase = projectId ? "configured" : "missing_project_id";
  const ok = firebase === "configured" && geminiKey && geminiModel;

  const details = {
    ok,
    service: "student-ledger-portal",
    time: new Date().toISOString(),
    firebase,
    gemini: {
      apiKey: geminiKey ? "configured" : "missing_api_key",
      model: geminiModel ? "configured" : "missing_model",
    },
  };

  res.status(ok ? 200 : 503).json(details);
}
