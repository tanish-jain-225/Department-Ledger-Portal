import { flattenRowsForExport } from "./export-utils";

/**
 * Returns a direct verification link for any document-bearing record.
 */
function getVerificationLink(doc, origin = "") {
  if (!doc) return "";
  const id = doc.documentId || doc.id || "";
  if (!id) return "";
  const cleanOrigin = origin.replace(/\/$/, "");
  return `${cleanOrigin}/document/${encodeURIComponent(id)}`;
}

/**
 * Scans a batch of student data to find the maximum count for every list section.
 * This replaces the old MAX_SLOTS hardcoded limits.
 */
export function calculateDynamicSlots(allRecordsData) {
  const slots = {
    academic: 8, achievements: 12, activities: 12, 
    placements: 8, projects: 10, skills: 20, 
    documents: 20, strengths: 10, recommendations: 10, missingFields: 10
  };

  allRecordsData.forEach(({ lists, report }) => {
    slots.academic = Math.max(slots.academic, (lists.academic || []).length);
    slots.achievements = Math.max(slots.achievements, (lists.achievements || []).length);
    slots.activities = Math.max(slots.activities, (lists.activities || []).length);
    slots.placements = Math.max(slots.placements, (lists.placements || []).length);
    slots.projects = Math.max(slots.projects, (lists.projects || []).length);
    slots.skills = Math.max(slots.skills, (lists.skills || []).length);
    slots.documents = Math.max(slots.documents, (lists.uploadedDocuments || []).length);
    
    if (report) {
      slots.strengths = Math.max(slots.strengths, (report.strengths || []).length);
      slots.recommendations = Math.max(slots.recommendations, (report.recommendations || []).length);
      slots.missingFields = Math.max(slots.missingFields, (report.missingProfile || []).length);
    }
  });

  return slots;
}

/**
 * Dynamically generates the complete field list for exhaustive exports.
 * This ensures the CSV header matches the highest count found in the batch.
 */
export function getDynamicStudentFields(slots) {
  const fields = [
    "id", "name", "email", "phone", "role", "year", "branch", "section", "alumni",
    "gender", "dob", "address", "linkedin", "github", "rollNumber", "facultyVerification",
    "overallScore", "readinessVerdict", "profileCompletenessPct", "avgGpa", "latestGpa",
    "highestGpa", "lowestGpa", "gpaTrend", "gpaRating", "achievementScore", "achievementRating",
    "hasNationalAchievement", "activityDiversity", "activityRating", "documentRating",
    "placed", "placedCompany", "placedRole", "placedPackage", "internshipCount",
    "academicCount", "achievementsCount", "activitiesCount", "placementsCount", "projectsCount", "skillsCount", "uploadedDocumentsCount",
    "createdAt", "updatedAt"
  ];

  for (let i = 1; i <= slots.academic; i++) {
    fields.push(`Academic_${i}_Year`, `Academic_${i}_Semester`, `Academic_${i}_GPA`, `Academic_${i}_Roll`, `Academic_${i}_Branch`, `Academic_${i}_Subjects`, `Academic_${i}_Verification_Link`);
  }
  for (let i = 1; i <= slots.activities; i++) {
    fields.push(`Activity_${i}_Title`, `Activity_${i}_Type`, `Activity_${i}_Date`, `Activity_${i}_Description`, `Activity_${i}_Link`, `Activity_${i}_Verification_Link`);
  }
  for (let i = 1; i <= slots.achievements; i++) {
    fields.push(`Achievement_${i}_Title`, `Achievement_${i}_Level`, `Achievement_${i}_Date`, `Achievement_${i}_Issuer`, `Achievement_${i}_Description`, `Achievement_${i}_Verification_Link`);
  }
  for (let i = 1; i <= slots.placements; i++) {
    fields.push(`Placement_${i}_Company`, `Placement_${i}_Role`, `Placement_${i}_Package`, `Placement_${i}_Status`, `Placement_${i}_Date`, `Placement_${i}_Verification_Link`);
  }
  for (let i = 1; i <= slots.projects; i++) {
    fields.push(`Project_${i}_Title`, `Project_${i}_Tech`, `Project_${i}_Link`, `Project_${i}_GitHub`, `Project_${i}_Description`, `Project_${i}_Verification_Link`);
  }
  for (let i = 1; i <= slots.skills; i++) {
    fields.push(`Skill_${i}_Name`, `Skill_${i}_Category`, `Skill_${i}_Proficiency`, `Skill_${i}_Verification_Link`);
  }
  for (let i = 1; i <= slots.documents; i++) {
    fields.push(`Doc_${i}_Name`, `Doc_${i}_Section`, `Doc_${i}_Type`, `Doc_${i}_Size`, `Doc_${i}_Upload_Date`, `Doc_${i}_Verification_Link`);
  }
  for (let i = 1; i <= slots.strengths; i++) fields.push(`Strength_${i}`);
  for (let i = 1; i <= slots.recommendations; i++) fields.push(`Recommendation_${i}`);
  for (let i = 1; i <= slots.missingFields; i++) fields.push(`Missing_Field_${i}`);

  return fields;
}

export const FACULTY_RECORD_FIELDS = [
  "id", "name", "email", "phone", "role", "designation", "department", "facultyVerification",
  "gender", "dob", "address", "linkedin", "github", "bio", "createdAt", "updatedAt"
];

/**
 * Orchestrates CSV generation using a Web Worker to keep the UI responsive.
 * @param {Array} rows - Flat or nested data rows.
 * @param {string} filename - Output filename.
 * @param {Object} options - Export options (fields, maskSensitive).
 */
async function buildCsvContent(rows, filename = "export.csv", options = {}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  
  if (typeof window === "undefined" || !window.Worker) {
    // Fallback for non-browser or non-worker environments
    console.warn("[CSV Export] Web Worker unavailable. Processing on main thread.");
    const { flattenRowsForExport } = await import("./export-utils");
    const dataRows = flattenRowsForExport(rows, { ...options, origin });
    const headers = options.fields || Object.keys(dataRows[0]);
    const lines = [
      headers.map(escapeCell).join(","),
      ...dataRows.map((r) => headers.map((h) => escapeCell(r[h])).join(",")),
    ];
    triggerDownload(new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" }), filename);
    return;
  }

  // Use Web Worker
  return new Promise((resolve, reject) => {
    const worker = new Worker("/workers/csv-worker.js");
    
    worker.onmessage = (e) => {
      const { success, csvString, error } = e.data;
      if (success) {
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        triggerDownload(blob, filename);
        resolve();
      } else {
        reject(new Error(error || "Worker failed to generate CSV."));
      }
      worker.terminate();
    };

    worker.onerror = (err) => {
      reject(new Error(`Worker Fault: ${err.message}`));
      worker.terminate();
    };

    worker.postMessage({ rows, options, origin });
  });
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}


export function downloadAdminStudentsCsv(usersMapped, filename = "students-full-export.csv", options = {}) {
  return buildCsvContent(usersMapped, filename, { maskSensitive: false, ...options });
}

export function downloadFacultyStudentsCsv(usersMapped, filename = "students-summary.csv", options = {}) {
  return buildCsvContent(usersMapped, filename, { maskSensitive: true, ...options });
}

export function downloadAdminFacultyRecordsCsv(users, filename = "faculty-registry.csv", options = {}) {
  return buildCsvContent(users, filename, { maskSensitive: false, fields: FACULTY_RECORD_FIELDS, ...options });
}

export function downloadFacultyFacultyRecordsCsv(users, filename = "faculty-registry.csv", options = {}) {
  return buildCsvContent(users, filename, { maskSensitive: true, fields: FACULTY_RECORD_FIELDS, ...options });
}

/**
 * Maps a single Faculty user document to a flat CSV-compatible object.
 */
export function buildFacultyExportRow(user) {
  return {
    id: user.id || "",
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "",
    designation: user.designation || "",
    department: user.department || "",
    facultyVerification: user.facultyVerification || "none",
    gender: user.gender || "",
    dob: user.dob || "",
    address: user.address || "",
    linkedin: user.linkedin || "",
    github: user.github || "",
    bio: user.bio || "",
    createdAt: user.createdAt?.toDate?.().toISOString() || "",
    updatedAt: user.updatedAt?.toDate?.().toISOString() || "",
  };
}

/**
 * Maps a student record into a CSV row based on specified slot counts.
 */
export function buildStudentExportRow(user, lists, report, slots) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  
  const row = {
    id: user.id || "",
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "",
    year: user.year || "",
    branch: user.branch || "",
    section: user.section || "",
    alumni: user.alumni ? "yes" : "no",
    gender: user.gender || "",
    dob: user.dob || "",
    address: user.address || "",
    linkedin: user.linkedin || "",
    github: user.github || "",
    rollNumber: user.rollNumber || "",
    facultyVerification: user.facultyVerification || "none",
    overallScore: report.overall,
    readinessVerdict: report.verdict?.label || "",
    profileCompletenessPct: report.profilePct,
    avgGpa: report.avgGpa || "",
    latestGpa: report.latestGpa || "",
    highestGpa: report.highestGpa || "",
    lowestGpa: report.lowestGpa || "",
    gpaTrend: report.gpaTrend || "",
    gpaRating: report.gpaRating || "",
    achievementScore: report.achScore || 0,
    achievementRating: report.achRating || "",
    hasNationalAchievement: report.hasNational ? "yes" : "no",
    activityDiversity: report.actDiversity || 0,
    activityRating: report.actRating || "",
    documentRating: report.documentRating || "",
    placed: report.placed ? "yes" : "no",
    placedCompany: report.placedAt?.company || "",
    placedRole: report.placedAt?.role || "",
    placedPackage: report.maxPackage ?? "",
    internshipCount: report.internships?.length || 0,
    academicCount: (lists.academic || []).length,
    achievementsCount: (lists.achievements || []).length,
    activitiesCount: (lists.activities || []).length,
    placementsCount: (lists.placements || []).length,
    projectsCount: (lists.projects || []).length,
    skillsCount: (lists.skills || []).length,
    uploadedDocumentsCount: (lists.uploadedDocuments || []).length,
    createdAt: user.createdAt?.toDate?.().toISOString() || "",
    updatedAt: user.updatedAt?.toDate?.().toISOString() || "",
  };

  (lists.academic || []).forEach((r, i) => {
    const idx = i + 1;
    row[`Academic_${idx}_Year`] = r.year || "";
    row[`Academic_${idx}_Semester`] = r.semester || "";
    row[`Academic_${idx}_GPA`] = r.gpa || "";
    row[`Academic_${idx}_Roll`] = r.rollNumber || "";
    row[`Academic_${idx}_Branch`] = r.branch || "";
    row[`Academic_${idx}_Subjects`] = r.subjects || "";
    row[`Academic_${idx}_Verification_Link`] = getVerificationLink(r.document, origin);
  });

  (lists.activities || []).forEach((r, i) => {
    const idx = i + 1;
    row[`Activity_${idx}_Title`] = r.title || "";
    row[`Activity_${idx}_Type`] = r.type || "";
    row[`Activity_${idx}_Date`] = r.date || "";
    row[`Activity_${idx}_Description`] = r.description || "";
    row[`Activity_${idx}_Link`] = r.link || "";
    row[`Activity_${idx}_Verification_Link`] = getVerificationLink(r.document, origin);
  });

  (lists.achievements || []).forEach((r, i) => {
    const idx = i + 1;
    row[`Achievement_${idx}_Title`] = r.title || "";
    row[`Achievement_${idx}_Level`] = r.level || "";
    row[`Achievement_${idx}_Date`] = r.date || "";
    row[`Achievement_${idx}_Issuer`] = r.issuer || "";
    row[`Achievement_${idx}_Description`] = r.description || "";
    row[`Achievement_${idx}_Verification_Link`] = getVerificationLink(r.document, origin);
  });

  (lists.placements || []).forEach((r, i) => {
    const idx = i + 1;
    row[`Placement_${idx}_Company`] = r.company || "";
    row[`Placement_${idx}_Role`] = r.role || "";
    row[`Placement_${idx}_Package`] = r.package || "";
    row[`Placement_${idx}_Status`] = r.status || "";
    row[`Placement_${idx}_Date`] = r.date || "";
    row[`Placement_${idx}_Verification_Link`] = getVerificationLink(r.document, origin);
  });

  (lists.projects || []).forEach((r, i) => {
    const idx = i + 1;
    row[`Project_${idx}_Title`] = r.title || "";
    row[`Project_${idx}_Tech`] = r.techStack || "";
    row[`Project_${idx}_Link`] = r.link || "";
    row[`Project_${idx}_GitHub`] = r.github || "";
    row[`Project_${idx}_Description`] = r.description || "";
    row[`Project_${idx}_Verification_Link`] = getVerificationLink(r.document, origin);
  });

  (lists.skills || []).forEach((r, i) => {
    const idx = i + 1;
    row[`Skill_${idx}_Name`] = r.name || "";
    row[`Skill_${idx}_Category`] = r.category || "";
    row[`Skill_${idx}_Proficiency`] = r.proficiency || "";
    row[`Skill_${idx}_Verification_Link`] = getVerificationLink(r.document, origin);
  });

  (lists.uploadedDocuments || []).forEach((doc, i) => {
    const idx = i + 1;
    row[`Doc_${idx}_Name`] = doc.fileName || "";
    row[`Doc_${idx}_Section`] = doc.section || "other";
    row[`Doc_${idx}_Type`] = doc.fileType || "";
    row[`Doc_${idx}_Size`] = doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "";
    row[`Doc_${idx}_Upload_Date`] = doc.createdAt?.toDate?.().toISOString() || "";
    row[`Doc_${idx}_Verification_Link`] = getVerificationLink(doc, origin);
  });

  (report.strengths || []).forEach((v, i) => row[`Strength_${i + 1}`] = v);
  (report.recommendations || []).forEach((v, i) => row[`Recommendation_${i + 1}`] = v);
  (report.missingProfile || []).forEach((v, i) => row[`Missing_Field_${i + 1}`] = v);

  return row;
}

/** Legacy aliases preserved for Faculty UI stability */
export function downloadAdminStudentRecordsCsv(mappedRows, filename, options) {
  return downloadAdminStudentsCsv(mappedRows, filename, options);
}

export function downloadFacultyStudentRecordsCsv(mappedRows, filename, options) {
  return downloadFacultyStudentsCsv(mappedRows, filename, options);
}
