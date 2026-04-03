/**
 * Property-based tests for buildPrompt using fast-check.
 */
import * as fc from "fast-check";
import { buildPrompt } from "@/pages/api/autofill-section";

const VALID_SECTIONS = ["academic", "achievement", "activity", "placement", "project", "skill"];

const existingRecordArb = fc.array(
  fc.record({ id: fc.string(), title: fc.string() }),
  { maxLength: 5 }
);

describe("buildPrompt - property-based", () => {
  it("always returns a non-empty string for any valid section", () => {
    fc.assert(fc.property(
      fc.constantFrom(...VALID_SECTIONS),
      existingRecordArb,
      (section, existing) => {
        const prompt = buildPrompt(section, existing);
        return typeof prompt === "string" && prompt.length > 0;
      }
    ));
  });

  it("always contains the section name in the output", () => {
    fc.assert(fc.property(
      fc.constantFrom(...VALID_SECTIONS),
      existingRecordArb,
      (section, existing) => {
        return buildPrompt(section, existing).includes(section);
      }
    ));
  });

  it("always instructs the model to return JSON", () => {
    fc.assert(fc.property(
      fc.constantFrom(...VALID_SECTIONS),
      existingRecordArb,
      (section, existing) => {
        return buildPrompt(section, existing).toLowerCase().includes("json");
      }
    ));
  });

  it("includes existing data when provided", () => {
    fc.assert(fc.property(
      fc.constantFrom(...VALID_SECTIONS),
      fc.array(
        fc.record({ title: fc.string({ minLength: 3, maxLength: 20 }) }),
        { minLength: 1, maxLength: 3 }
      ),
      (section, existing) => {
        const prompt = buildPrompt(section, existing);
        // existing data is JSON.stringify'd into the prompt - check serialized form
        const serialized = JSON.stringify(existing, null, 2);
        return prompt.includes(serialized);
      }
    ));
  });

  it("prompt length grows with more existing records", () => {
    fc.assert(fc.property(
      fc.constantFrom(...VALID_SECTIONS),
      fc.array(
        fc.record({ title: fc.string({ minLength: 5, maxLength: 20 }) }),
        { minLength: 1, maxLength: 5 }
      ),
      (section, existing) => {
        const withRecords    = buildPrompt(section, existing);
        const withoutRecords = buildPrompt(section, []);
        return withRecords.length >= withoutRecords.length;
      }
    ));
  });

  it("includes file context when provided", () => {
    fc.assert(fc.property(
      fc.constantFrom(...VALID_SECTIONS),
      fc.string({ minLength: 5, maxLength: 50 }),
      (section, fileContext) => {
        return buildPrompt(section, [], fileContext).includes(fileContext);
      }
    ));
  });
});
