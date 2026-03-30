import { buildPrompt } from "@/pages/api/autofill-section";

describe("buildPrompt", () => {
  it("includes the section name in the prompt", () => {
    const prompt = buildPrompt("academic", []);
    expect(prompt).toContain("academic");
  });

  it("lists all expected fields for the academic section", () => {
    const prompt = buildPrompt("academic", []);
    ["year", "semester", "gpa", "subjects", "branch", "rollNumber"].forEach((f) => {
      expect(prompt).toContain(f);
    });
  });

  it("lists all expected fields for the placement section", () => {
    const prompt = buildPrompt("placement", []);
    ["company", "role", "status", "package"].forEach((f) => {
      expect(prompt).toContain(f);
    });
  });

  it("includes existing data in the prompt when provided", () => {
    const existing = [{ year: "2023", semester: "5", gpa: "9.1" }];
    const prompt = buildPrompt("academic", existing);
    expect(prompt).toContain("2023");
    expect(prompt).toContain("9.1");
  });

  it("instructs the model not to duplicate existing entries", () => {
    const existing = [{ title: "Hackathon Winner" }];
    const prompt = buildPrompt("achievement", existing);
    expect(prompt).toMatch(/avoid duplicating/i);
  });

  it("includes file context when provided", () => {
    const prompt = buildPrompt("skill", [], "Python, React, Firebase");
    expect(prompt).toContain("Python, React, Firebase");
  });

  it("omits file context section when not provided", () => {
    const prompt = buildPrompt("skill", []);
    expect(prompt).not.toContain("uploaded a document");
  });

  it("instructs the model to return only JSON", () => {
    const prompt = buildPrompt("project", []);
    expect(prompt).toMatch(/return ONLY a valid JSON/i);
  });
});
