import { GoogleGenerativeAI } from "@google/generative-ai";
import { RATE_LIMIT } from "@/lib/constants";
import { isRateLimited } from "@/lib/rate-limit";
import { verifyAuthToken } from "@/lib/api-auth";
import { parseAiJson, isValidAiJsonResponse } from "@/lib/parse-ai-json";

const GEMINI_TIMEOUT_MS = 30_000;

/** Resolves the value for Access-Control-Allow-Origin based on the request origin.
 * Allows: configured ALLOWED_ORIGIN, any localhost port, and falls back to * when unset.
 * @param {string|undefined} requestOrigin - The Origin header from the request.
 * @returns {string} The allowed origin string to reflect.
 */
function resolveAllowedOrigin(requestOrigin) {
  const configured = process.env.ALLOWED_ORIGIN;
  // Always allow localhost / 127.0.0.1 for local development
  if (requestOrigin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin)) {
    return requestOrigin;
  }
  if (configured) {
    // Exact match against the configured production origin
    return requestOrigin === configured ? configured : configured;
  }
  // No ALLOWED_ORIGIN configured — open (matches previous behaviour)
  return "*";
}
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function sanitizeApiError(error) {
  const raw = String(error?.message || "");
  const status = Number(error?.status) || 500;

  if (status === 429 || /429|quota/i.test(raw)) {
    return { status: 429, message: "AI service quota is currently exceeded. Please retry shortly." };
  }
  if (status === 503 || /503|high demand|unavailable/i.test(raw)) {
    return { status: 503, message: "AI service is temporarily unavailable. Please try again." };
  }
  if (/timeout/i.test(raw)) {
    return { status: 504, message: "AI request timed out. Please try again." };
  }

  return { status: status >= 400 && status < 600 ? status : 500, message: "Readiness analysis failed." };
}

async function withTimeout(promise, timeoutMs) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("AI request timeout")), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

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

export function normalizeLabel(label, score) {
  const raw = String(label || "").trim().toLowerCase();
  if (raw === "ready") return "Ready";
  if (raw === "developing") return "Developing";
  if (raw === "needs attention" || raw === "needs_attention") return "Needs Attention";

  if (score > 75) return "Ready";
  if (score >= 50) return "Developing";
  return "Needs Attention";
}

export function toStringArray(value, minItems) {
  const arr = Array.isArray(value) ? value : [];
  const cleaned = arr
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .slice(0, 8);
  if (cleaned.length >= minItems) return cleaned;
  return null;
}

export function sanitizeReadinessReport(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;

  const numericScore = Number(data.score);
  if (!Number.isFinite(numericScore)) return null;
  const score = Math.max(0, Math.min(100, Math.round(numericScore)));

  const summary = String(data.summary || "").trim();
  const careerRoadmap = String(data.careerRoadmap || "").trim();
  const strengths = toStringArray(data.strengths, 1);
  const weaknesses = toStringArray(data.weaknesses, 1);
  const recommendations = toStringArray(data.recommendations, 1);

  if (!summary || !careerRoadmap || !strengths || !weaknesses || !recommendations) {
    return null;
  }

  return {
    score,
    label: normalizeLabel(data.label, score),
    summary,
    strengths,
    weaknesses,
    recommendations,
    careerRoadmap,
  };
}

export default async function handler(req, res) {
  const allowedOrigin = resolveAllowedOrigin(req.headers.origin);
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const origin = req.headers.origin;
  const isLocalhost = origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (process.env.ALLOWED_ORIGIN && origin && allowedOrigin !== origin && !isLocalhost) {
    console.warn(`[CORS Audit] Blocked request execution from disallowed origin: ${origin}`);
    return res.status(403).json({ error: "Access Forbidden: Disallowed origin." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Auth check ──────────────────────────────────────────────────────────────
  const uid = await verifyAuthToken(req, res);
  if (!uid) return;

  if (await isRateLimited(`analyze:${uid}`, RATE_LIMIT.ANALYZE, RATE_LIMIT.WINDOW_MS)) {
    console.warn(`[Rate Limit Audit] User ${uid} triggered rate limit on analyze-readiness`);
    return res.status(429).json({ error: "Rate limit exceeded. Protocol paused." });
  }

  const { profile, academic, activities, achievements, placements, projects, skills } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL;

  if (!apiKey || !modelName) {
    return res.status(500).json({ error: "AI environment not configured." });
  }

  if (!isPlainObject(profile)) {
    return res.status(400).json({ error: "Profile required" });
  }

  // ── Input validation ────────────────────────────────────────────────────────
  const gpaError = validateAcademic(academic);
  if (gpaError) return res.status(400).json({ error: gpaError });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Prune and project data to avoid token bloat while maintaining context
    const context = {
      profile: {
        name: profile.name,
        gender: profile.gender,
        branch: profile.branch,
        year: profile.year,
        isAlumni: !!profile.alumni
      },
      academic: prune(academic, 8).map(r => r ? { gpa: r.gpa, year: r.year, semester: r.semester, subjects: r.subjects } : {}),
      activities: prune(activities, 10).map(r => r ? { type: r.type, title: r.title, date: r.date, description: r.description } : {}),
      achievements: prune(achievements, 10).map(r => r ? { title: r.title, issuer: r.issuer, level: r.level, date: r.date } : {}),
      placements: prune(placements, 6).map(r => r ? { company: r.company, role: r.role, status: r.status, package: r.package } : {}),
      projects: prune(projects, 8).map(r => r ? { title: r.title, techStack: r.techStack, description: r.description } : {}),
      skills: prune(skills, 20).map(r => r ? { name: r.name, category: r.category, proficiency: r.proficiency } : {})
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

    const result = await withTimeout(model.generateContent(prompt), GEMINI_TIMEOUT_MS);
    const text = result.response.text();
    const data = parseAiJson(text);

    if (!isValidAiJsonResponse(data, requiredResponseKeys)) {
      throw new Error("Invalid AI model response format.");
    }

    const normalized = sanitizeReadinessReport(data);
    if (!normalized) {
      throw new Error("AI model response failed validation.");
    }

    res.status(200).json(normalized);
  } catch (error) {
    const { status, message } = sanitizeApiError(error);
    console.error(`[API Error Audit] Analyze-readiness request failed with status ${status}:`, error);
    return res.status(status).json({ error: message });
  }
}
