import { GoogleGenerativeAI } from "@google/generative-ai";

// Simple in-memory rate limiter: max 5 requests per IP per minute
const rateLimitMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = 5;
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }
  if (entry.count >= max) return true;
  rateLimitMap.set(ip, { count: entry.count + 1, start: entry.start });
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }

  const { profile, academic, activities, achievements, placements, projects, skills } = req.body;

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const modelName = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  if (!profile) {
    return res.status(400).json({ error: "Profile data is required" });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
      You are an elite Career Strategist and Senior Placement Officer at a top-tier University.
      Analyze the provided student data to generate a high-fidelity "Placement Readiness Report".
      
      STUDENT METRICS:
      - Name: ${profile?.name}
      - Roll Number: ${profile?.rollNumber}
      - Gender: ${profile?.gender}
      - Alumni Status: ${profile?.alumni ? "Alumni" : "Current Student"}
      
      ACADEMIC PROFILE (GPA, Semesters, Subjects):
      ${JSON.stringify(academic, null, 2)}
      
      TECHNICAL ACTIVITIES & EXTRACURRICULARS:
      ${JSON.stringify(activities, null, 2)}
      
      PROFESSIONAL ACHIEVEMENTS:
      ${JSON.stringify(achievements, null, 2)}
      
      INDUSTRY EXPOSURE (Placements/Internships):
      ${JSON.stringify(placements, null, 2)}
      

      
      TECHNICAL PROJECTS & ARCHITECTURE:
      ${JSON.stringify(projects, null, 2)}
      
      SPECIALIZED SKILLS & COMPETENCIES:
      ${JSON.stringify(skills, null, 2)}

      EVALUATION GUIDELINES:
      - Score (0-100): Be critical. >80 is for students with strong GPA AND industry exposure.
      - Label: "Ready" (Score > 75), "Developing" (50-75), "Needs Attention" (< 50).
      - Strengths: Focus on specific skills mentioned in achievements and projects.
      - Weaknesses: Identify missing critical skills (e.g., if no internships, mention "Lack of practical industry exposure").
      - Recommendations: Provide 3-4 highly specific technical or skill development recommendations.
      - Career Roadmap: A strategic paragraph on the most probable job role (e.g., "Full Stack Dev", "Data Analyst") based on their academic and project history.

      RESPONSE FORMAT: You MUST return ONLY a valid JSON object. No markdown, no preamble.
      {
        "score": number,
        "label": string,
        "summary": "Professional 2-sentence executive summary.",
        "strengths": ["string", "string", "string"],
        "weaknesses": ["string", "string", "string"],
        "recommendations": ["string", "string", "string", "string"],
        "careerRoadmap": "Detailed career trajectory prediction."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Robustly extract JSON object using regex
    let jsonStr = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    } else {
      jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    try {
      const data = JSON.parse(jsonStr);
      res.status(200).json(data);
    } catch (parseErr) {
      console.error("JSON Parse Error. Raw text:", text);
      res.status(500).json({ error: "AI returned invalid JSON format", raw: text });
    }
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze profile" });
  }
}
