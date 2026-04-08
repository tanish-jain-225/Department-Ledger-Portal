import { parseAiJson, isValidAiJsonResponse } from "@/lib/parse-ai-json";

describe("parseAiJson", () => {
  it("parses plain JSON string", () => {
    const parsed = parseAiJson('{"score": 80, "label": "Ready"}');
    expect(parsed).toEqual({ score: 80, label: "Ready" });
  });

  it("parses JSON inside markdown code fence", () => {
    const text = "```json\n{\n  \"score\": 72,\n  \"label\": \"Developing\"\n}\n```";
    const parsed = parseAiJson(text);
    expect(parsed).toEqual({ score: 72, label: "Developing" });
  });

  it("parses first balanced JSON object from noisy text", () => {
    const text = "Result:\nHere you go:\n{\"score\":65,\"label\":\"Developing\"}\nThanks";
    const parsed = parseAiJson(text);
    expect(parsed).toEqual({ score: 65, label: "Developing" });
  });

  it("returns null for invalid JSON content", () => {
    expect(parseAiJson("not-json")).toBeNull();
  });
});

describe("isValidAiJsonResponse", () => {
  it("returns true when all required keys are present", () => {
    const data = { score: 80, label: "Ready", summary: "ok" };
    expect(isValidAiJsonResponse(data, ["score", "label", "summary"])).toBe(true);
  });

  it("returns false when any required key is missing", () => {
    const data = { score: 80, label: "Ready" };
    expect(isValidAiJsonResponse(data, ["score", "label", "summary"])).toBe(false);
  });
});
