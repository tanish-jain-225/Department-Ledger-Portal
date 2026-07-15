import { getRouteAccess, ROUTE_POLICY } from "@/lib/route-policy";
import { ACCESS } from "@/lib/route-access";

describe("route policy map", () => {
  it("maps public, guest and protected routes correctly", () => {
    expect(getRouteAccess("/")).toBe(ACCESS.PUBLIC);
    expect(getRouteAccess("/login")).toBe(ACCESS.GUEST);
    expect(getRouteAccess("/admin/students")).toBe(ACCESS.ADMIN);
    expect(getRouteAccess("/student/123")).toBe(ACCESS.STAFF);
    expect(getRouteAccess("/profile")).toBe(ACCESS.AUTH);
  });

  it("contains the expected route coverage for the app", () => {
    expect(ROUTE_POLICY["/admin"]).toBe(ACCESS.ADMIN);
    expect(ROUTE_POLICY["/dashboard"]).toBe(ACCESS.STAFF);
    expect(ROUTE_POLICY["/student"]).toBe(ACCESS.STUDENT);
    expect(ROUTE_POLICY["/profile"]).toBe(ACCESS.AUTH);
  });
});
