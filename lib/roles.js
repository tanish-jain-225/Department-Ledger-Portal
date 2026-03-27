export const ROLES = {
  STUDENT: "student",
  FACULTY: "faculty",
  ADMIN: "admin",
};

/** New registrations use this until an admin assigns student / faculty / admin in Firestore. */
export const PENDING_ROLE = "";

/**
 * Verifies if a role string represents an approved ledger identity.
 * 
 * @param {string} role - The role string to verify.
 * @returns {boolean} True if the role is recognized and active.
 */
export function hasApprovedRole(role) {
  return (
    role === ROLES.STUDENT ||
    role === ROLES.FACULTY ||
    role === ROLES.ADMIN
  );
}

/**
 * Checks if the specified role belongs to the professional staff (Faculty or Admin).
 * 
 * @param {string} role - The user's role.
 * @returns {boolean}
 */
export function isStaff(role) {
  return role === ROLES.FACULTY || role === ROLES.ADMIN;
}

/**
 * authorization check for bulk data extraction protocols.
 * 
 * @param {string} role - The user's role.
 * @returns {boolean}
 */
export function canExport(role) {
  return isStaff(role);
}

/**
 * Authorization check for sensitive administrative governance (User management, Deletion requests).
 * 
 * @param {string} role - The user's role.
 * @returns {boolean}
 */
export function canManageUsers(role) {
  return role === ROLES.ADMIN;
}
