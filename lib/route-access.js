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
