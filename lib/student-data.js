import { listByStudent, listStudentDocuments } from "./data";

/**
 * Fetches every relevant sub-collection for a specific student.
 * Used by both UI components and CSV export engines to ensure 100% data consistency.
 * 
 * @param {string} uid - Unique student identifier.
 * @returns {Promise<Object>} A consolidated object of all student records.
 */
export async function fetchExhaustiveStudentData(uid) {
  if (!uid) throw new Error("[Data Utility] Student UID is required for exhaustive fetch.");

  // Using listByStudent for collections and listStudentDocuments for docs (to handle doc-specific metadata)
  const [academic, activities, achievements, placements, projects, skills, uploadedDocuments] = await Promise.all([
    listByStudent("academicRecords", uid),
    listByStudent("activities", uid),
    listByStudent("achievements", uid),
    listByStudent("placements", uid),
    listByStudent("projects", uid),
    listByStudent("skills", uid),
    listStudentDocuments(uid, 500), // High limit for deep audits
  ]);

  return { 
    academic, 
    activities, 
    achievements, 
    placements, 
    projects, 
    skills, 
    uploadedDocuments 
  };
}
