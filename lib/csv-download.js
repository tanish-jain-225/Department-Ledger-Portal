import { flattenRowsForExport } from "./export-utils";

export const FACULTY_RECORD_FIELDS = [
  "id",
  "name",
  "email",
  "phone",
  "role",
  "designation",
  "department",
  "facultyVerification",
  "gender",
  "dob",
  "address",
  "linkedin",
  "github",
  "bio",
  "createdAt",
  "pendingDeletion",
  "delDocId",
];

export const STUDENT_RECORD_FIELDS = [
  "name",
  "email",
  "phone",
  "role",
  "year",
  "branch",
  "alumni",
  "gender",
  "dob",
  "address",
  "linkedin",
  "github",
  "rollNumber",
  "facultyVerification",
  "academicCount",
  "achievementsCount",
  "activitiesCount",
  "placementsCount",
  "uploadedDocumentsCount",
  "overallScore",
  "readinessVerdict",
  "profileCompletenessPct",
  "missingProfileFields",
  "avgGpa",
  "latestGpa",
  "highestGpa",
  "lowestGpa",
  "gpaTrend",
  "gpaRating",
  "achievementScore",
  "achievementRating",
  "hasNationalAchievement",
  "activityDiversity",
  "activityRating",
  "documentRating",
  "placed",
  "placedCompany",
  "placedRole",
  "placedPackage",
  "internshipCount",
  "strengths",
  "recommendations",
  "academic_document",
  "achievement_document",
  "activity_document",
  "placement_document",
  "other_document",
];

function escapeCell(val) {
  const s = String(val ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildCsvContent(rows, filename = "export.csv", options = {}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const dataRows = flattenRowsForExport(rows, { ...options, origin });
  if (!dataRows.length) {
    throw new Error("No rows to export.");
  }
  const headers = Object.keys(dataRows[0]);
  const lines = [
    headers.map(escapeCell).join(","),
    ...dataRows.map((r) => headers.map((h) => escapeCell(r[h])).join(",")),
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Generic CSV download — use when a named function below doesn't fit.
 * Throws if rows is empty.
 */
export function downloadRawCsv(rows, filename = "export.csv", options = {}) {
  return buildCsvContent(rows, filename, options);
}

/** Export current visible student list (faculty view — sensitive data masked). */
export function downloadStudentsCsv(users, filename = "students-export.csv", options = {}) {
  return buildCsvContent(users, filename, options);
}

/** Export student list for admin — no masking applied. */
export function downloadAdminStudentsCsv(users, filename = "students-export.csv", options = {}) {
  return buildCsvContent(users, filename, { maskSensitive: false, ...options });
}

/** Export student list for faculty view — email/phone masked. */
export function downloadFacultyStudentsCsv(users, filename = "students-export.csv", options = {}) {
  return buildCsvContent(users, filename, { maskSensitive: true, ...options });
}

/** Export faculty directory for admin — no masking, includes all FACULTY_RECORD_FIELDS. */
export function downloadAdminFacultyRecordsCsv(users, filename = "faculty-records.csv", options = {}) {
  return buildCsvContent(users, filename, { maskSensitive: false, fields: FACULTY_RECORD_FIELDS, ...options });
}

/** Export faculty directory for faculty view — sensitive data masked. */
export function downloadFacultyFacultyRecordsCsv(users, filename = "faculty-records.csv", options = {}) {
  return buildCsvContent(users, filename, { maskSensitive: true, fields: FACULTY_RECORD_FIELDS, ...options });
}

/** Export full student records for admin — no masking, includes all STUDENT_RECORD_FIELDS. */
export function downloadAdminStudentRecordsCsv(users, filename = "student-records.csv", options = {}) {
  return buildCsvContent(users, filename, { maskSensitive: false, fields: STUDENT_RECORD_FIELDS, ...options });
}

/** Export full student records for faculty view — email/phone masked. */
export function downloadFacultyStudentRecordsCsv(users, filename = "student-records.csv", options = {}) {
  return buildCsvContent(users, filename, { maskSensitive: true, fields: STUDENT_RECORD_FIELDS, ...options });
}

/**
 * Builds a standardized export row for a student with full enrichment.
 * Alignment: This ensures individual and bulk exports share the exact same logic.
 */
export function buildStudentExportRow(user, lists, report) {
  const normalizeSection = (sectionName) => {
    const section = String(sectionName || "other").toLowerCase();
    const mapping = {
      academic: "academic",
      academics: "academic",
      academicrecords: "academic",
      achievement: "achievement",
      achievements: "achievement",
      activity: "activity",
      activities: "activity",
      placement: "placement",
      placements: "placement",
      project: "project",
      projects: "project",
      skill: "skill",
      skills: "skill",
    };
    return mapping[section] || "other";
  };

  const documentLinks = (lists.uploadedDocuments || []).reduce((acc, item) => {
    const section = normalizeSection(item.section);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/document/${encodeURIComponent(item.id)}`;
    const key = `${section}_document`;
    acc[key] = acc[key] || [];
    acc[key].push(link);
    return acc;
  }, {});

  return {
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "",
    year: user.year || "",
    branch: user.branch || "",
    alumni: user.alumni ? "yes" : "no",
    gender: user.gender || "",
    dob: user.dob || "",
    address: user.address || "",
    linkedin: user.linkedin || "",
    github: user.github || "",
    rollNumber: user.rollNumber || "",
    facultyVerification: user.facultyVerification || "",
    academicCount: (lists.academic || []).length,
    achievementsCount: (lists.achievements || []).length,
    activitiesCount: (lists.activities || []).length,
    placementsCount: (lists.placements || []).length,
    uploadedDocumentsCount: (lists.uploadedDocuments || []).length,
    overallScore: report.overall,
    readinessVerdict: report.verdict.label,
    profileCompletenessPct: report.profilePct,
    missingProfileFields: report.missingProfile.join(" | "),
    avgGpa: report.avgGpa || "",
    latestGpa: report.latestGpa || "",
    highestGpa: report.highestGpa || "",
    lowestGpa: report.lowestGpa || "",
    gpaTrend: report.gpaTrend,
    gpaRating: report.gpaRating,
    achievementScore: report.achScore,
    achievementRating: report.achRating,
    hasNationalAchievement: report.hasNational ? "yes" : "no",
    activityDiversity: report.actDiversity,
    activityRating: report.actRating,
    documentRating: report.documentRating,
    placed: report.placed ? "yes" : "no",
    placedCompany: report.placedAt?.company || "",
    placedRole: report.placedAt?.role || "",
    placedPackage: report.maxPackage ?? "",
    internshipCount: report.internships.length,
    strengths: report.strengths.join(" | "),
    recommendations: report.recommendations.join(" | "),
    ...Object.fromEntries(
      Object.entries(documentLinks).map(([key, links]) => [key, links.join(" | ")])
    ),
  };
}
