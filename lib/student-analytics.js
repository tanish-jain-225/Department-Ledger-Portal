/**
 * Student profile completeness and readiness analytics engine.
 * Extracted from StudentInfoPopup so it can be tested independently.
 *
 * @param {Object} data   - User profile document from Firestore.
 * @param {Object} lists  - { academic, achievements, activities, placements, uploadedDocuments }
 * @returns {Object}      - Full analytics report.
 */
export function computeReport(data, lists) {
  // ── 1. Profile fields ──────────────────────────────────────────────────────
  const profileFields = [
    { key: "name",       label: "Full Name",     weight: 2 },
    { key: "email",      label: "Email",         weight: 2 },
    { key: "phone",      label: "Phone",         weight: 1 },
    { key: "gender",     label: "Gender",        weight: 1 },
    { key: "dob",        label: "Date of Birth", weight: 1 },
    { key: "branch",     label: "Branch",        weight: 2 },
    { key: "year",       label: "Year",          weight: 2 },
    { key: "address",    label: "Address",       weight: 1 },
    { key: "linkedin",   label: "LinkedIn",      weight: 1 },
    { key: "github",     label: "GitHub",        weight: 1 },
    { key: "rollNumber", label: "Roll Number",   weight: 2 },
  ];
  const totalWeight    = profileFields.reduce((s, f) => s + f.weight, 0);
  const filledWeight   = profileFields.filter(f => !!data[f.key]).reduce((s, f) => s + f.weight, 0);
  const profilePct     = Math.round((filledWeight / totalWeight) * 100);
  const missingProfile = profileFields.filter(f => !data[f.key]).map(f => f.label);

  // ── 2. Academic analysis ───────────────────────────────────────────────────
  const gpas = lists.academic
    .map(r => ({ gpa: parseFloat(r.gpa), year: parseInt(r.year), sem: parseInt(r.semester) }))
    .filter(r => !isNaN(r.gpa))
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.sem - b.sem);

  const avgGpa     = gpas.length ? (gpas.reduce((s, r) => s + r.gpa, 0) / gpas.length).toFixed(2) : null;
  const latestGpa  = gpas.length ? gpas[gpas.length - 1].gpa.toFixed(2) : null;
  const highestGpa = gpas.length ? Math.max(...gpas.map(r => r.gpa)).toFixed(2) : null;
  const lowestGpa  = gpas.length ? Math.min(...gpas.map(r => r.gpa)).toFixed(2) : null;

  let gpaTrend = "stable";
  if (gpas.length >= 4) {
    const mid        = Math.floor(gpas.length / 2);
    const firstHalf  = gpas.slice(0, mid).reduce((s, r) => s + r.gpa, 0) / mid;
    const secondHalf = gpas.slice(mid).reduce((s, r) => s + r.gpa, 0) / (gpas.length - mid);
    if (secondHalf - firstHalf > 0.3)      gpaTrend = "improving";
    else if (firstHalf - secondHalf > 0.3) gpaTrend = "declining";
  }

  const gpaRating = !avgGpa ? "none"
    : parseFloat(avgGpa) >= 9.0 ? "exceptional"
    : parseFloat(avgGpa) >= 8.0 ? "strong"
    : parseFloat(avgGpa) >= 7.0 ? "average"
    : parseFloat(avgGpa) >= 6.0 ? "below-average"
    : "poor";

  // ── 3. Achievements analysis ───────────────────────────────────────────────
  const achLevels  = { international: 4, national: 3, state: 2, college: 1, other: 1 };
  const achScore   = lists.achievements.reduce((s, a) => s + (achLevels[a.level] || 1), 0);
  const hasNational = lists.achievements.some(a => a.level === "national" || a.level === "international");
  const achRating  = achScore === 0 ? "none"
    : achScore >= 8 ? "exceptional"
    : achScore >= 4 ? "strong"
    : achScore >= 2 ? "moderate"
    : "minimal";

  // ── 4. Activities analysis ─────────────────────────────────────────────────
  const actTypes    = [...new Set(lists.activities.map(a => a.type).filter(Boolean))];
  const actDiversity = actTypes.length;
  const actRating   = lists.activities.length === 0 ? "none"
    : lists.activities.length >= 5 && actDiversity >= 3 ? "exceptional"
    : lists.activities.length >= 3 ? "strong"
    : lists.activities.length >= 1 ? "moderate"
    : "minimal";

  const uploadedDocumentCount = Array.isArray(lists.uploadedDocuments) ? lists.uploadedDocuments.length : 0;
  const documentRating = uploadedDocumentCount === 0 ? "none"
    : uploadedDocumentCount === 1 ? "minimal"
    : uploadedDocumentCount === 2 ? "good"
    : "strong";

  // ── 5. Placement analysis ──────────────────────────────────────────────────
  const placed    = lists.placements.find(p => p.status === "placed");
  const internships = lists.placements.filter(p => p.status === "intern");
  const packages  = lists.placements.map(p => parseFloat(p.package)).filter(p => !isNaN(p) && p > 0);
  const maxPackage = packages.length ? Math.max(...packages) : null;
  const placementRating = placed ? "placed"
    : internships.length >= 2 ? "strong-intern"
    : internships.length === 1 ? "interned"
    : "none";

  // ── 6. Section completeness ────────────────────────────────────────────────
  const sectionScores = [
    { key: "academic",     label: "Academic Records", min: 4, records: lists.academic,     icon: "📚" },
    { key: "achievements", label: "Achievements",     min: 2, records: lists.achievements, icon: "🏆" },
    { key: "activities",   label: "Activities",       min: 2, records: lists.activities,   icon: "⚡" },
    { key: "placements",   label: "Placements",       min: 1, records: lists.placements,   icon: "💼" },
  ].map(s => {
    const count = s.records.length;
    const pct   = Math.min(100, Math.round((count / s.min) * 100));
    return { ...s, count, pct, met: count >= s.min };
  });

  const avgSectionPct = Math.round(
    sectionScores.reduce((sum, s) => sum + s.pct, 0) / sectionScores.length
  );

  // ── 7. Overall score (weighted) ────────────────────────────────────────────
  const academicScore = !avgGpa ? 0
    : parseFloat(avgGpa) >= 9 ? 100
    : parseFloat(avgGpa) >= 8 ? 85
    : parseFloat(avgGpa) >= 7 ? 65
    : parseFloat(avgGpa) >= 6 ? 45
    : 25;

  const placementScore = placed ? 100
    : internships.length >= 2 ? 75
    : internships.length === 1 ? 50
    : 0;

  const overall = Math.round(
    profilePct    * 0.30 +
    academicScore * 0.25 +
    avgSectionPct * 0.25 +
    placementScore * 0.20
  );

  // ── 8. Readiness verdict ───────────────────────────────────────────────────
  const verdict = overall >= 80 ? { label: "Placement Ready", color: "emerald" }
    : overall >= 65 ? { label: "Developing",        color: "brand"  }
    : overall >= 45 ? { label: "Needs Attention",   color: "amber"  }
    : { label: "Incomplete Profile", color: "red" };

  // ── 9. Recommendations ────────────────────────────────────────────────────
  const recommendations = [];
  if (missingProfile.length > 0)
    recommendations.push(`Complete missing profile fields: ${missingProfile.slice(0, 3).join(", ")}`);
  if (lists.academic.length < 4)
    recommendations.push(`Add more academic records - only ${lists.academic.length} semester${lists.academic.length !== 1 ? "s" : ""} recorded`);
  if (gpaTrend === "declining")
    recommendations.push("GPA is declining - consider academic counselling");
  if (lists.placements.length === 0)
    recommendations.push("No internship or placement records - encourage industry exposure");
  if (lists.achievements.length === 0)
    recommendations.push("No achievements recorded - encourage participation in competitions");
  if (actDiversity < 2 && lists.activities.length > 0)
    recommendations.push("Activities are limited to one type - encourage diverse engagement");
  if (!data.linkedin)
    recommendations.push("LinkedIn profile missing - important for placement visibility");
  if (!data.github && (lists.activities.some(a => a.type === "technical") || lists.achievements.length > 0))
    recommendations.push("GitHub profile missing - add for technical credibility");
  if (uploadedDocumentCount === 0)
    recommendations.push("Upload supporting documents to strengthen the profile and verify records");
  else if (uploadedDocumentCount === 1)
    recommendations.push("Upload at least one more document for stronger verification");

  // ── 10. Strengths ─────────────────────────────────────────────────────────
  const strengths = [];
  if (gpaRating === "exceptional" || gpaRating === "strong")
    strengths.push(`Strong academic record - Avg GPA ${avgGpa}`);
  if (gpaTrend === "improving")
    strengths.push("GPA is on an upward trend");
  if (placed)
    strengths.push(`Placed at ${placed.company}${placed.role ? ` as ${placed.role}` : ""}${maxPackage ? ` · ₹${maxPackage} LPA` : ""}`);
  if (internships.length >= 2)
    strengths.push(`${internships.length} internships completed - strong industry exposure`);
  if (hasNational)
    strengths.push("National/international level achievement - stands out");
  if (lists.achievements.length >= 3)
    strengths.push(`${lists.achievements.length} achievements - active extracurricular profile`);
  if (actDiversity >= 3)
    strengths.push(`Diverse activity profile across ${actDiversity} categories`);
  if (uploadedDocumentCount >= 2)
    strengths.push(`${uploadedDocumentCount} supporting documents uploaded`);
  if (profilePct === 100)
    strengths.push("Profile 100% complete - all fields filled");

  return {
    overall, verdict,
    profilePct, missingProfile,
    sectionScores, avgSectionPct,
    avgGpa, latestGpa, highestGpa, lowestGpa, gpaTrend, gpaRating,
    achScore, achRating, hasNational,
    actDiversity, actRating,
    uploadedDocumentCount,
    documentRating,
    placed: !!placed, placedAt: placed,
    internships, maxPackage, placementRating,
    strengths, recommendations,
    academicCount: lists.academic.length,
  };
}
