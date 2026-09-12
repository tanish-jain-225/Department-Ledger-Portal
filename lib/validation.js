import { z } from "zod";

/**
 * Valid section types supported by the Smart Analysis autofill engine.
 */
export const VALID_SECTIONS = [
  "academic",
  "achievement",
  "activity",
  "placement",
  "project",
  "skill",
];

/**
 * Valid MIME types supported for document analysis.
 */
export const VALID_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "text/plain",
];

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Helper to check whether a string looks like valid base64 encoding.
 */
export function isBase64String(val) {
  if (typeof val !== "string" || !val.trim()) return false;
  const normalized = val.replace(/\s+/g, "");
  return /^[A-Za-z0-9+/]*={0,2}$/.test(normalized);
}

// ── Academic Item Schema ───────────────────────────────────────────────────────
export const academicRecordSchema = z.object({
  year: z.union([z.string(), z.number()]).optional(),
  semester: z.union([z.string(), z.number()]).optional(),
  gpa: z
    .union([z.string(), z.number()])
    .optional()
    .refine(
      (val) => {
        if (val === undefined || val === null || val === "") return true;
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0 && num <= 10;
      },
      { message: "Invalid GPA value - must range 0-10." }
    ),
  subjects: z.union([z.string(), z.array(z.string())]).optional(),
  branch: z.string().optional(),
  rollNumber: z.string().optional(),
}).passthrough();

// ── Analyze Readiness Schema ──────────────────────────────────────────────────
export const analyzeReadinessSchema = z.object({
  profile: z.object({
    name: z.string().min(1, "Name is required in profile"),
    gender: z.string().optional(),
    branch: z.string().optional(),
    year: z.union([z.string(), z.number()]).optional(),
    alumni: z.boolean().optional(),
  }).passthrough(),
  academic: z.array(academicRecordSchema).optional().default([]),
  activities: z.array(z.record(z.string(), z.any())).optional().default([]),
  achievements: z.array(z.record(z.string(), z.any())).optional().default([]),
  placements: z.array(z.record(z.string(), z.any())).optional().default([]),
  projects: z.array(z.record(z.string(), z.any())).optional().default([]),
  skills: z.array(z.record(z.string(), z.any())).optional().default([]),
});

// ── Autofill Section Schema ───────────────────────────────────────────────────
export const autofillSectionSchema = z.object({
  section: z.string().refine((val) => VALID_SECTIONS.includes(val), {
    message: `Invalid section. Must be one of: ${VALID_SECTIONS.join(", ")}`,
  }),
  existingData: z.array(z.record(z.string(), z.any())).optional().default([]),
  fileData: z
    .string({ required_error: "A file is required for Smart Analysis." })
    .min(1, "A file is required for Smart Analysis.")
    .refine(isBase64String, {
      message: "fileData must be a valid base64 string.",
    })
    .refine(
      (data) => {
        const estimatedBytes = (data.length * 3) / 4;
        return estimatedBytes <= MAX_FILE_BYTES;
      },
      { message: "File too large. Maximum size is 10MB." }
    ),
  fileMimeType: z.string().refine((val) => VALID_MIME_TYPES.includes(val), {
    message: `Unsupported file type. Allowed: ${VALID_MIME_TYPES.join(", ")}`,
  }),
});

// ── Client-side Auth Schemas ──────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(100, "Name cannot exceed 100 characters."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password cannot exceed 128 characters."),
  rollNumber: z.string().trim().optional(),
  year: z.string().trim().optional(),
});

/**
 * Universal payload validator helper.
 * @template T
 * @param {z.ZodSchema<T>} schema
 * @param {unknown} data
 * @returns {{ success: boolean, data?: T, error?: string, details?: z.ZodIssue[] }}
 */
export function validatePayload(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstIssue = result.error.issues[0];
  const errorMessage = firstIssue?.message || "Invalid payload format.";
  return {
    success: false,
    error: errorMessage,
    details: result.error.issues,
  };
}
