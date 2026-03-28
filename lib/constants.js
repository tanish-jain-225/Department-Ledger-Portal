/**
 * Application-wide constants.
 * Import from here instead of hardcoding values across files.
 */

// ── Pagination ────────────────────────────────────────────────────────────────
export const PAGE_SIZE = {
  DEFAULT: 20,
  DASHBOARD: 50,
  ADMIN_DIRECTORY: 100,
  NOTIFICATIONS: 20,
  AUDIT_LOGS: 100,
};

// ── Rate limiting (requests per minute per IP) ────────────────────────────────
export const RATE_LIMIT = {
  AUTOFILL: 10,
  ANALYZE:  5,
  WINDOW_MS: 60 * 1000,
};

// ── Firestore collection names ────────────────────────────────────────────────
export const COLLECTIONS = {
  USERS:            "users",
  ROLE_REQUESTS:    "roleRequests",
  DELETION_REQUESTS:"deletionRequests",
  NOTIFICATIONS:    "notifications",
  AUDIT_LOGS:       "auditLogs",
  ACADEMIC_RECORDS: "academicRecords",
  ACTIVITIES:       "activities",
  ACHIEVEMENTS:     "achievements",
  PLACEMENTS:       "placements",
  PROJECTS:         "projects",
  SKILLS:           "skills",
  AI_REPORTS:       "aiReports",
};

// ── Sub-collections purged on user deletion ───────────────────────────────────
export const USER_SUB_COLLECTIONS = [
  COLLECTIONS.ACADEMIC_RECORDS,
  COLLECTIONS.ACTIVITIES,
  COLLECTIONS.ACHIEVEMENTS,
  COLLECTIONS.PLACEMENTS,
  COLLECTIONS.PROJECTS,
  COLLECTIONS.SKILLS,
  COLLECTIONS.AI_REPORTS,
];
