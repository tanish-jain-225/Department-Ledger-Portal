import {
  normalizeLabel,
  toStringArray,
  sanitizeReadinessReport,
} from "@/pages/api/analyze-readiness";

describe("analyze readiness sanitization helpers", () => {
  it("normalizes known labels", () => {
    expect(normalizeLabel("ready", 90)).toBe("Ready");
    expect(normalizeLabel("developing", 60)).toBe("Developing");
    expect(normalizeLabel("needs_attention", 30)).toBe("Needs Attention");
  });

  it("derives label from score when label is unknown", () => {
    expect(normalizeLabel("something", 88)).toBe("Ready");
    expect(normalizeLabel("something", 66)).toBe("Developing");
    expect(normalizeLabel("something", 20)).toBe("Needs Attention");
  });

  it("filters and trims string arrays", () => {
    expect(toStringArray([" one ", "", null, "two"], 1)).toEqual(["one", "two"]);
    expect(toStringArray([], 1)).toBeNull();
  });

  it("sanitizes a valid AI report", () => {
    const input = {
      score: 105,
      label: "ready",
      summary: " Strong profile ",
      strengths: [" DSA ", "Projects"],
      weaknesses: ["Cloud"],
      recommendations: ["Do internship"],
      careerRoadmap: " Backend engineer track ",
    };

    expect(sanitizeReadinessReport(input)).toEqual({
      score: 100,
      label: "Ready",
      summary: "Strong profile",
      strengths: ["DSA", "Projects"],
      weaknesses: ["Cloud"],
      recommendations: ["Do internship"],
      careerRoadmap: "Backend engineer track",
    });
  });

  it("returns null for structurally invalid report", () => {
    const input = {
      score: "NaN",
      summary: "",
      strengths: [],
      weaknesses: [],
      recommendations: [],
      careerRoadmap: "",
    };

    expect(sanitizeReadinessReport(input)).toBeNull();
  });
});
