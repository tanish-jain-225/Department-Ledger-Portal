import { ROLES, hasApprovedRole, isStaff, canManageUsers } from "./roles";

/**
 * Page access levels used by the Layout component.
 *
 * - PUBLIC  - visible to everyone (no auth required)
 * - GUEST   - only visible when signed out (e.g. login / register)
 * - AUTH    - any user with an approved role
 * - STUDENT - students only
 * - STAFF   - faculty or admin
 * - ADMIN   - admin only
 */
export const ACCESS = {
  PUBLIC:  "public",
  GUEST:   "guest",
  AUTH:    "auth",
  STUDENT: "student",
  STAFF:   "staff",
  ADMIN:   "admin",
};

export function canAccessRoute(access, role) {
  if (!role) return access === ACCESS.PUBLIC || access === ACCESS.GUEST;

  if (!hasApprovedRole(role)) return false;

  switch (access) {
    case ACCESS.PUBLIC:
      return true;
    case ACCESS.GUEST:
      return false;
    case ACCESS.AUTH:
      return true;
    case ACCESS.STUDENT:
      return role === ROLES.STUDENT;
    case ACCESS.STAFF:
      return isStaff(role);
    case ACCESS.ADMIN:
      return canManageUsers(role);
    default:
      return false;
  }
}

export function getHomeRouteForRole(role) {
  if (canManageUsers(role)) return "/admin";
  if (isStaff(role)) return "/faculty";
  if (role === ROLES.STUDENT) return "/student";
  return "/";
}
