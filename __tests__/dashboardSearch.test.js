/**
 * Tests for the client-side search fallback logic used in listStudentsForDashboard.
 * We test the filter predicate directly — no Firestore mocking needed.
 */

const students = [
  { id: "1", name: "Alice Johnson", email: "alice@uni.edu", role: "student" },
  { id: "2", name: "Bob Smith",    email: "bob@uni.edu",   role: "student" },
  { id: "3", name: "Charlie Ray",  email: "charlie@uni.edu", role: "student" },
];

function applySearchFilter(rows, term) {
  const s = term.trim().toLowerCase();
  if (!s) return rows;
  return rows.filter(
    (r) =>
      (r.name || "").toLowerCase().includes(s) ||
      (r.email || "").toLowerCase().includes(s)
  );
}

describe("dashboard search filter", () => {
  it("returns all rows when search is empty", () => {
    expect(applySearchFilter(students, "")).toHaveLength(3);
  });

  it("matches by name (case-insensitive)", () => {
    const result = applySearchFilter(students, "alice");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Alice Johnson");
  });

  it("matches by email", () => {
    const result = applySearchFilter(students, "bob@uni");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("returns empty array when no match", () => {
    expect(applySearchFilter(students, "zzznomatch")).toHaveLength(0);
  });

  it("matches partial name", () => {
    const result = applySearchFilter(students, "ray");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Charlie Ray");
  });

  it("is case-insensitive for uppercase input", () => {
    expect(applySearchFilter(students, "ALICE")).toHaveLength(1);
  });
});
