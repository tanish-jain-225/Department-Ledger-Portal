import { ACCESS, canAccessRoute, getHomeRouteForRole } from "@/lib/route-access";
import { ROLES } from "@/lib/roles";

describe("route access control", () => {
  it("allows faculty onto staff routes, but blocks admins and students", () => {
    expect(canAccessRoute(ACCESS.STAFF, ROLES.FACULTY)).toBe(true);
    expect(canAccessRoute(ACCESS.STAFF, ROLES.ADMIN)).toBe(false);
    expect(canAccessRoute(ACCESS.STAFF, ROLES.STUDENT)).toBe(false);
  });

  it("allows only admins onto admin routes", () => {
    expect(canAccessRoute(ACCESS.ADMIN, ROLES.ADMIN)).toBe(true);
    expect(canAccessRoute(ACCESS.ADMIN, ROLES.FACULTY)).toBe(false);
    expect(canAccessRoute(ACCESS.ADMIN, ROLES.STUDENT)).toBe(false);
  });

  it("keeps student routes student-only and maps users to the correct home route", () => {
    expect(canAccessRoute(ACCESS.STUDENT, ROLES.STUDENT)).toBe(true);
    expect(canAccessRoute(ACCESS.STUDENT, ROLES.FACULTY)).toBe(false);
    expect(getHomeRouteForRole(ROLES.STUDENT)).toBe("/student");
    expect(getHomeRouteForRole(ROLES.FACULTY)).toBe("/faculty");
    expect(getHomeRouteForRole(ROLES.ADMIN)).toBe("/admin");
  });
});
