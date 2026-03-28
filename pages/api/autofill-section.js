import { GoogleGenerativeAI } from "@google/generative-ai";
import { RATE_LIMIT } from "@/lib/constants";

const VALID_SECTIONS = ["academic", "achievement", "activity", "placement", "project", "skill"];

const SECTION_FIELDS = {
  academic: ["year", "semester", "gpa", "subjects", "branch", "rollNumber"],
  achievement: ["title", "issuer", "level", "date"],
  activity: ["type", "title", "date", "description"],
  placement: ["company", "role", "status", "package"],
  project: ["title", "techStack", "description"],
  skill: ["name", "category", "proficiency"],
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const rateLimitMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_LIMIT.WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT.AUTOFILL) return true;
  rateLimitMap.set(ip, { count: entry.count + 1, start: entry.start });
  return false;
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

  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }

  const { section, existingData = [], fileData, fileMimeType } = req.body || {};

  if (!section || !VALID_SECTIONS.includes(section)) {
    return res.status(400).json({ error: `Invalid section: ${section}. Must be one of: ${VALID_SECTIONS.join(", ")}` });
  }

  if (!fileData || !fileMimeType) {
    return res.status(400).json({ error: "A file is required for Smart Analysis." });
  }

  const estimatedBytes = (fileData.length * 3) / 4;
  if (estimatedBytes > MAX_FILE_BYTES) {
    return res.status(413).json({ error: "File too large. Maximum size is 10MB." });
  }

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const modelName = process.env.NEXT_PUBLIC_GEMINI_MODEL;

  if (!apiKey) {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    let result;

    // File is always present — send as inline data part
    const fields = SECTION_FIELDS[section];
    const existingJson = JSON.stringify(existingData, null, 2);

    const hasExisting = existingData.length > 0;
    const existingNote = hasExisting
      ? `The student already has these ${section} records saved — DO NOT repeat or duplicate any of them:
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

    result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: fileMimeType,
          data: fileData,
        },
      },
    ]);

    const text = result.response.text();

    let jsonStr = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    } else {
      jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    try {
      const data = JSON.parse(jsonStr);
      return res.status(200).json(data);
    } catch {
      return res.status(500).json({ error: "AI returned invalid JSON format" });
    }
  } catch (error) {
    const msg = error?.message || "Failed to generate suggestions";
    if (error?.status === 429) {
      return res.status(429).json({ error: "AI quota exceeded. Please try again later." });
    }
    return res.status(500).json({ error: msg });
  }
}
