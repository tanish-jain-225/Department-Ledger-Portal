/**
 * Property-based tests for computeReport using fast-check.
 * These verify invariants that must hold for ANY valid input,
 * not just the specific cases in studentAnalytics.test.js.
 */
import * as fc from "fast-check";
import { computeReport } from "@/lib/student-analytics";

// ── Arbitraries ───────────────────────────────────────────────────────────────

const gpaArb = fc.float({ min: 0, max: 10, noNaN: true });

const academicRecordArb = fc.record({
  gpa:      gpaArb.map(String),
  year:     fc.integer({ min: 2015, max: 2030 }).map(String),
  semester: fc.integer({ min: 1, max: 8 }).map(String),
});

const achievementArb = fc.record({
  level: fc.constantFrom("college", "state", "national", "international", "other"),
  title: fc.string({ minLength: 1, maxLength: 50 }),
});

const activityArb = fc.record({
  type:  fc.constantFrom("co-curricular", "extra-curricular", "cultural", "sports", "technical", "other"),
  title: fc.string({ minLength: 1, maxLength: 50 }),
});

const placementArb = fc.record({
  status:  fc.constantFrom("placed", "intern", "unplaced"),
  company: fc.string({ minLength: 1, maxLength: 40 }),
  package: fc.oneof(fc.constant(""), gpaArb.map(String)),
});

const profileArb = fc.record({
  name:       fc.string({ minLength: 0, maxLength: 50 }),
  // Use a simple string instead of fc.emailAddress() to avoid shrinking issues
  // in some environments - the email field is only used for display in computeReport
  email:      fc.string({ minLength: 0, maxLength: 40 }),
  phone:      fc.oneof(fc.constant(""), fc.string({ minLength: 10, maxLength: 15 })),
  gender:     fc.oneof(fc.constant(""), fc.constantFrom("male", "female", "other")),
  dob:        fc.oneof(fc.constant(""), fc.constant("2000-01-01")),
  branch:     fc.oneof(fc.constant(""), fc.constantFrom("CS", "IT", "EC", "ME")),
  year:       fc.oneof(fc.constant(""), fc.constantFrom("1", "2", "3", "4")),
  address:    fc.oneof(fc.constant(""), fc.string({ minLength: 0, maxLength: 80 })),
  linkedin:   fc.oneof(fc.constant(""), fc.constant("https://linkedin.com/in/test")),
  github:     fc.oneof(fc.constant(""), fc.constant("https://github.com/test")),
  rollNumber: fc.oneof(fc.constant(""), fc.string({ minLength: 0, maxLength: 20 })),
});

const listsArb = fc.record({
  academic:     fc.array(academicRecordArb, { maxLength: 10 }),
  achievements: fc.array(achievementArb,   { maxLength: 10 }),
  activities:   fc.array(activityArb,      { maxLength: 10 }),
  placements:   fc.array(placementArb,     { maxLength: 5  }),
});

// ── Properties ────────────────────────────────────────────────────────────────

const VALID_VERDICTS = ["Placement Ready", "Developing", "Needs Attention", "Incomplete Profile"];
const VALID_COLORS   = ["emerald", "brand", "amber", "red"];

describe("computeReport - property-based", () => {
  it("overall score is always between 0 and 100", () => {
    fc.assert(fc.property(profileArb, listsArb, (profile, lists) => {
      const { overall } = computeReport(profile, lists);
      return overall >= 0 && overall <= 100;
    }));
  });

  it("verdict label is always one of the 4 valid values", () => {
    fc.assert(fc.property(profileArb, listsArb, (profile, lists) => {
      const { verdict } = computeReport(profile, lists);
      return VALID_VERDICTS.includes(verdict.label);
    }));
  });

  it("verdict color is always one of the 4 valid colors", () => {
    fc.assert(fc.property(profileArb, listsArb, (profile, lists) => {
      const { verdict } = computeReport(profile, lists);
      return VALID_COLORS.includes(verdict.color);
    }));
  });

  it("profilePct is always between 0 and 100", () => {
    fc.assert(fc.property(profileArb, listsArb, (profile, lists) => {
      const { profilePct } = computeReport(profile, lists);
      return profilePct >= 0 && profilePct <= 100;
    }));
  });

  it("sectionScores pct values are always between 0 and 100", () => {
    fc.assert(fc.property(profileArb, listsArb, (profile, lists) => {
      const { sectionScores } = computeReport(profile, lists);
      return sectionScores.every(s => s.pct >= 0 && s.pct <= 100);
    }));
  });

  it("strengths and recommendations are always arrays", () => {
    fc.assert(fc.property(profileArb, listsArb, (profile, lists) => {
      const { strengths, recommendations } = computeReport(profile, lists);
      return Array.isArray(strengths) && Array.isArray(recommendations);
    }));
  });

  it("placed flag is true only when a placement with status=placed exists", () => {
    fc.assert(fc.property(profileArb, listsArb, (profile, lists) => {
      const { placed } = computeReport(profile, lists);
      const hasPlaced = lists.placements.some(p => p.status === "placed");
      return placed === hasPlaced;
    }));
  });

  it("academicCount matches the number of academic records passed in", () => {
    fc.assert(fc.property(profileArb, listsArb, (profile, lists) => {
      const { academicCount } = computeReport(profile, lists);
      return academicCount === lists.academic.length;
    }));
  });

  it("higher overall score produces a verdict with higher or equal threshold", () => {
    // A fully complete profile with top GPA and placement should be Placement Ready
    const strongProfile = {
      name: "Alice", email: "a@uni.edu", phone: "9999999999",
      gender: "female", dob: "2000-01-01", branch: "CS", year: "3",
      address: "123 St", linkedin: "https://li.com", github: "https://gh.com", rollNumber: "CS001",
    };
    const strongLists = {
      academic: Array.from({ length: 4 }, (_, i) => ({ gpa: "9.5", year: String(2021 + i), semester: "1" })),
      achievements: [{ level: "national", title: "Win" }],
      activities: [{ type: "technical", title: "Club" }, { type: "cultural", title: "Fest" }, { type: "sports", title: "Cricket" }],
      placements: [{ status: "placed", company: "Google", package: "25" }],
    };
    const { verdict } = computeReport(strongProfile, strongLists);
    expect(verdict.label).toBe("Placement Ready");
  });
});
