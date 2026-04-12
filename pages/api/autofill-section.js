import { GoogleGenerativeAI } from "@google/generative-ai";
import { RATE_LIMIT } from "@/lib/constants";
import { isRateLimited } from "@/lib/rate-limit";
import { verifyAuthToken } from "@/lib/api-auth";
import { parseAiJson, isValidAiJsonResponse } from "@/lib/parse-ai-json";

const ALLOWED_ORIGINS = new Set([
  "https://department-ledger-portal.vercel.app",
  "http://localhost:3000",
]);
const GEMINI_TIMEOUT_MS = 30_000;

const VALID_SECTIONS = ["academic", "achievement", "activity", "placement", "project", "skill"];
const VALID_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "text/plain",
]);

const SECTION_FIELDS = {
  academic: ["year", "semester", "gpa", "subjects", "branch", "rollNumber"],
  achievement: ["title", "issuer", "level", "date"],
  activity: ["type", "title", "date", "description"],
  placement: ["company", "role", "status", "package"],
  project: ["title", "techStack", "description"],
  skill: ["name", "category", "proficiency"],
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "12mb",
    },
  },
};

function isAllowedRequestOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  return ALLOWED_ORIGINS.has(origin);
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isValidExistingRecord(record) {
  if (!isPlainObject(record)) return false;
  return Object.values(record).every((v) =>
    v == null || typeof v === "string" || typeof v === "number" || typeof v === "boolean"
  );
}

function sanitizeExistingDataForSection(section, existingData = []) {
  const fields = SECTION_FIELDS[section] || [];
  if (!Array.isArray(existingData) || fields.length === 0) return [];

  return existingData
    .filter(isPlainObject)
    .map((record) => {
      const sanitized = {};
      for (const field of fields) {
        const value = record[field];
        if (value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          sanitized[field] = value;
        }
      }
      return sanitized;
    })
    .filter((record) => Object.keys(record).length > 0);
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

  return { status: status >= 400 && status < 600 ? status : 500, message: "Smart Analysis failed." };
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

function looksLikeBase64(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  // Remove whitespace that some encoders may inject for wrapping.
  const normalized = value.replace(/\s+/g, "");
  return /^[A-Za-z0-9+/]*={0,2}$/.test(normalized);
}

export function buildPrompt(section, existingData = [], fileContext = "") {
  const fields = SECTION_FIELDS[section];
  const existingJson = JSON.stringify(existingData, null, 2);

  const fileSection = fileContext
    ? `\nThe student has also uploaded a document with the following content:\n${fileContext}\n`
    : "";

  return `You are a helpful academic assistant helping a student fill in their ${section} profile section.

The student's existing ${section} records are:
${existingJson}
${fileSection}
Based on all available information, extract or suggest realistic values for a NEW ${section} entry with these fields: ${fields.join(", ")}.
Avoid duplicating any existing entries.

Return ONLY a valid JSON object with exactly these keys: ${fields.join(", ")}.
No markdown, no explanation, no preamble. Just the JSON object.

Example format:
{
${fields.map((f) => `  "${f}": "suggested value"`).join(",\n")}
}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAllowedRequestOrigin(req)) {
    return res.status(403).json({ error: "Origin not allowed." });
  }

  // ── Auth check ──────────────────────────────────────────────────────────────
  const uid = await verifyAuthToken(req, res);
  if (!uid) return;

  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "unknown";
  if (await isRateLimited(`autofill:${ip}`, RATE_LIMIT.AUTOFILL, RATE_LIMIT.WINDOW_MS)) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }

  const { section, existingData = [], fileData, fileMimeType } = req.body || {};

  if (!section || !VALID_SECTIONS.includes(section)) {
    return res.status(400).json({ error: `Invalid section: ${section}. Must be one of: ${VALID_SECTIONS.join(", ")}` });
  }

  if (!fileData || !fileMimeType) {
    return res.status(400).json({ error: "A file is required for Smart Analysis." });
  }

  if (!Array.isArray(existingData)) {
    return res.status(400).json({ error: "existingData must be an array." });
  }

  const sanitizedExistingData = existingData.every(isValidExistingRecord)
    ? existingData
    : sanitizeExistingDataForSection(section, existingData);

  if (!VALID_MIME_TYPES.has(fileMimeType)) {
    return res.status(400).json({
      error: `Unsupported file type: ${fileMimeType}. Allowed: ${Array.from(VALID_MIME_TYPES).join(", ")}`,
    });
  }

  if (!looksLikeBase64(fileData)) {
    return res.status(400).json({ error: "fileData must be a valid base64 string." });
  }

  const estimatedBytes = (fileData.length * 3) / 4;
  if (estimatedBytes > MAX_FILE_BYTES) {
    return res.status(413).json({ error: "File too large. Maximum size is 10MB." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL;

  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
  }
  if (!modelName) {
    return res.status(500).json({ error: "GEMINI_MODEL is not configured." });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const fields = SECTION_FIELDS[section];
    const existingJson = JSON.stringify(sanitizedExistingData, null, 2);

    const hasExisting = sanitizedExistingData.length > 0;
    const existingNote = hasExisting
      ? `The student already has these ${section} records saved - DO NOT repeat or duplicate any of them:
${existingJson}

Your job is to extract a NEW, DIFFERENT entry from the document that is not already in the list above.
If the document contains multiple entries, pick the one that is NOT already saved.
If all entries from the document are already saved, suggest the most logical NEXT entry based on the pattern.`
      : `The student has no existing ${section} records yet.`;

    const prompt = `You are a helpful academic assistant. The student has uploaded a document.
Extract information from the document to fill in a NEW ${section} profile entry.

${existingNote}

Extract values for these fields: ${fields.join(", ")}.

Return ONLY a valid JSON object with exactly these keys: ${fields.join(", ")}.
No markdown, no explanation, no preamble. Just the JSON object.`;

    const result = await withTimeout(model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: fileMimeType,
          data: fileData,
        },
      },
    ]), GEMINI_TIMEOUT_MS);

    const text = result.response.text();
    const data = parseAiJson(text);

    if (!isValidAiJsonResponse(data, fields)) {
      return res.status(500).json({ error: "AI returned invalid JSON format" });
    }

    return res.status(200).json(data);
  } catch (error) {
    const { status, message } = sanitizeApiError(error);
    return res.status(status).json({ error: message });
  }
}
