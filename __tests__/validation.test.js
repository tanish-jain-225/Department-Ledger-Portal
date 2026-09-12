import {
  isBase64String,
  academicRecordSchema,
  analyzeReadinessSchema,
  autofillSectionSchema,
  loginSchema,
  registerSchema,
  validatePayload,
  VALID_SECTIONS,
  VALID_MIME_TYPES,
} from "@/lib/validation";

describe("validation module", () => {
  describe("isBase64String", () => {
    it("returns true for valid base64 strings", () => {
      expect(isBase64String("SGVsbG8gV29ybGQ=")).toBe(true);
      expect(isBase64String("YWJj")).toBe(true);
      expect(isBase64String("AQIDBA==")).toBe(true);
    });

    it("returns false for invalid base64 characters or empty values", () => {
      expect(isBase64String("not@base64!")).toBe(false);
      expect(isBase64String("")).toBe(false);
      expect(isBase64String(null)).toBe(false);
      expect(isBase64String(123)).toBe(false);
    });
  });

  describe("academicRecordSchema", () => {
    it("accepts valid GPA between 0 and 10", () => {
      expect(academicRecordSchema.safeParse({ gpa: 8.5 }).success).toBe(true);
      expect(academicRecordSchema.safeParse({ gpa: "9.2" }).success).toBe(true);
      expect(academicRecordSchema.safeParse({ gpa: 0 }).success).toBe(true);
      expect(academicRecordSchema.safeParse({ gpa: 10 }).success).toBe(true);
    });

    it("rejects GPA outside 0-10 bounds", () => {
      expect(academicRecordSchema.safeParse({ gpa: 11 }).success).toBe(false);
      expect(academicRecordSchema.safeParse({ gpa: -1 }).success).toBe(false);
      expect(academicRecordSchema.safeParse({ gpa: "invalid" }).success).toBe(false);
    });
  });

  describe("analyzeReadinessSchema", () => {
    it("validates valid readiness request payload", () => {
      const payload = {
        profile: { name: "Alice", branch: "CSE", year: "3" },
        academic: [{ gpa: 8.9 }],
        skills: [{ name: "React" }],
      };
      const result = validatePayload(analyzeReadinessSchema, payload);
      expect(result.success).toBe(true);
    });

    it("rejects payload when profile is missing or lacks name", () => {
      const result = validatePayload(analyzeReadinessSchema, {
        profile: { name: "" },
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("autofillSectionSchema", () => {
    it("validates valid autofill request payload", () => {
      const validPayload = {
        section: "academic",
        existingData: [{ year: "2024" }],
        fileData: "SGVsbG8gV29ybGQ=",
        fileMimeType: "application/pdf",
      };
      const result = validatePayload(autofillSectionSchema, validPayload);
      expect(result.success).toBe(true);
    });

    it("rejects invalid section name", () => {
      const payload = {
        section: "invalid_section",
        fileData: "SGVsbG8gV29ybGQ=",
        fileMimeType: "application/pdf",
      };
      const result = validatePayload(autofillSectionSchema, payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid section");
    });

    it("rejects unsupported MIME types", () => {
      const payload = {
        section: "project",
        fileData: "SGVsbG8gV29ybGQ=",
        fileMimeType: "application/zip",
      };
      const result = validatePayload(autofillSectionSchema, payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unsupported file type");
    });

    it("rejects oversized file data exceeding 10MB limit", () => {
      // Create a base64 string that exceeds 10MB
      const largeBase64 = "A".repeat(15 * 1024 * 1024);
      const payload = {
        section: "project",
        fileData: largeBase64,
        fileMimeType: "application/pdf",
      };
      const result = validatePayload(autofillSectionSchema, payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain("File too large");
    });

    it("exports comprehensive valid section and MIME lists", () => {
      expect(VALID_SECTIONS).toContain("academic");
      expect(VALID_SECTIONS).toContain("project");
      expect(VALID_MIME_TYPES).toContain("application/pdf");
      expect(VALID_MIME_TYPES).toContain("image/png");
    });
  });

  describe("loginSchema", () => {
    it("accepts valid email and password", () => {
      const result = validatePayload(loginSchema, {
        email: "user@example.com",
        password: "securepassword",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email addresses", () => {
      const result = validatePayload(loginSchema, {
        email: "invalid-email",
        password: "securepassword",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("valid email");
    });

    it("rejects empty password", () => {
      const result = validatePayload(loginSchema, {
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("accepts valid registration parameters", () => {
      const result = validatePayload(registerSchema, {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        rollNumber: "CS2026",
        year: "3",
      });
      expect(result.success).toBe(true);
    });

    it("enforces minimum 8 characters for password", () => {
      const result = validatePayload(registerSchema, {
        name: "John Doe",
        email: "john@example.com",
        password: "short",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("at least 8 characters");
    });

    it("requires non-empty name", () => {
      const result = validatePayload(registerSchema, {
        name: "   ",
        email: "john@example.com",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });
  });
});
