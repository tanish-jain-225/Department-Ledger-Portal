export const ROLES = {
  STUDENT: "student",
  FACULTY: "faculty",
  ADMIN: "admin",
};

/** New registrations use this until an admin assigns student / faculty / admin in Firestore. */
export const PENDING_ROLE = "";

export function hasApprovedRole(role) {
  return (
    role === ROLES.STUDENT ||
    role === ROLES.FACULTY ||
    role === ROLES.ADMIN
  );
}

export function isStaff(role) {
  return role === ROLES.FACULTY || role === ROLES.ADMIN;
}

export function canExport(role) {
  return isStaff(role);
}

export function canManageUsers(role) {
  return role === ROLES.ADMIN;
}
