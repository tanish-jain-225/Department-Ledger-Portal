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
    alert("No rows to export.");
    return;
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

export function downloadStudentsCsv(users, filename = "students-export.csv", options = {}) {
  return buildCsvContent(users, filename, options);
}

export function downloadAdminStudentsCsv(users, filename = "students-export.csv", options = {}) {
  return buildCsvContent(users, filename, { maskSensitive: false, ...options });
}

export function downloadFacultyStudentsCsv(users, filename = "students-export.csv", options = {}) {
  return buildCsvContent(users, filename, { maskSensitive: true, ...options });
}

export function downloadAdminFacultyRecordsCsv(users, filename = "faculty-records.csv", options = {}) {
  return buildCsvContent(users, filename, { maskSensitive: false, fields: FACULTY_RECORD_FIELDS, ...options });
}

export function downloadFacultyFacultyRecordsCsv(users, filename = "faculty-records.csv", options = {}) {
  return buildCsvContent(users, filename, { maskSensitive: true, fields: FACULTY_RECORD_FIELDS, ...options });
}

export function downloadAdminStudentRecordsCsv(users, filename = "student-records.csv", options = {}) {
  return buildCsvContent(users, filename, { maskSensitive: false, fields: STUDENT_RECORD_FIELDS, ...options });
}

export function downloadFacultyStudentRecordsCsv(users, filename = "student-records.csv", options = {}) {
  return buildCsvContent(users, filename, { maskSensitive: true, fields: STUDENT_RECORD_FIELDS, ...options });
}
