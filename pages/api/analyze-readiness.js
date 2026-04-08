import { GoogleGenerativeAI } from "@google/generative-ai";
import { RATE_LIMIT } from "@/lib/constants";
import { isRateLimited } from "@/lib/rate-limit";
import { verifyAuthToken } from "@/lib/api-auth";
import { parseAiJson, isValidAiJsonResponse } from "@/lib/parse-ai-json";

// ── Token Management ──────────────────────────────────────────────────────────

/**
 * Prunes an array to a safe size to prevent Gemini API "Payload Too Large" errors.
 * Preserves the most recent entries (assuming they are sorted by date).
 */
function prune(arr, limit = 12) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, limit);
}

/**
 * Validates and sanitises the academic array before sending to Gemini.
 */
function validateAcademic(academic) {
  if (!Array.isArray(academic)) return null;
  for (const r of academic) {
    if (r.gpa !== undefined && r.gpa !== "") {
      const gpa = parseFloat(r.gpa);
      if (isNaN(gpa) || gpa < 0 || gpa > 10) {
        return `Invalid GPA value "${r.gpa}" - must range 0-10.`;
      }
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Auth check ──────────────────────────────────────────────────────────────
  const uid = await verifyAuthToken(req, res);
  if (!uid) return;

  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(`analyze:${ip}`, RATE_LIMIT.ANALYZE, RATE_LIMIT.WINDOW_MS)) {
    return res.status(429).json({ error: "Rate limit exceeded. Protocol paused." });
  }

  const { profile, academic, activities, achievements, placements, projects, skills } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL;

  if (!apiKey || !modelName) {
    return res.status(500).json({ error: "AI environment not configured." });
  }

  if (!profile) return res.status(400).json({ error: "Profile required" });

  // ── Input validation ────────────────────────────────────────────────────────
  const gpaError = validateAcademic(academic);
  if (gpaError) return res.status(400).json({ error: gpaError });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Prune data to avoid token bloat while maintaining context
    const context = {
      profile: {
        name: profile.name,
        gender: profile.gender,
        branch: profile.branch,
        year: profile.year,
        isAlumni: !!profile.alumni
      },
      academic: prune(academic, 8),
      activities: prune(activities, 10),
      achievements: prune(achievements, 10),
      placements: prune(placements, 6),
      projects: prune(projects, 8),
      skills: prune(skills, 20)
    };

    const prompt = `
      You are an elite University Placement Strategist. Use the following Student Ledger data to generate a high-precision Readiness Report.
      
      STUDENT CONTEXT:
      ${JSON.stringify(context.profile)}
      
      LEDGER DATA (PRUNED FOR TOKEN EFFICIENCY):
      - Academics: ${JSON.stringify(context.academic)}
      - Activities: ${JSON.stringify(context.activities)}
      - Achievements: ${JSON.stringify(context.achievements)}
      - Industry: ${JSON.stringify(context.placements)}
      - Projects: ${JSON.stringify(context.projects)}
      - Skills: ${JSON.stringify(context.skills)}

      EVALUATION PARAMETERS:
      1. Score (0-100): Critical assessment. >80 requires strong technical projects + verified skills.
      2. Verdict: "Ready" (>75), "Developing" (50-75), "Needs Attention" (<50).
      3. Strengths: 3-word bullet points of top competitive advantages.
      4. Weaknesses: Actionable gaps (e.g. "Lack of Live Project experience").
      5. Roadmap: A strategic paragraph on the target job profile based on their portfolio.

      JSON-ONLY RESPONSE:
      {
        "score": number,
        "label": string,
        "summary": "2-sentence executive summary.",
        "strengths": ["string", "string", "string"],
        "weaknesses": ["string", "string", "string"],
        "recommendations": ["string", "string", "string", "string"],
        "careerRoadmap": "string"
      }
    `;

    const requiredResponseKeys = ["score", "label", "summary", "strengths", "weaknesses", "recommendations", "careerRoadmap"];

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = parseAiJson(text);

    if (!isValidAiJsonResponse(data, requiredResponseKeys)) {
      throw new Error("Invalid AI model response format.");
    }

    res.status(200).json(data);
  } catch (error) {
    const msg = error?.message || "AI Analysis Fault";
    const status = error?.status || 500;
    return res.status(status).json({ error: msg });
  }
}
