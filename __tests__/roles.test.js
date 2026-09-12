import {
  ROLES,
  PENDING_ROLE,
  hasApprovedRole,
  isStaff,
  canExport,
  canManageUsers,
} from "@/lib/roles";

describe("roles module", () => {
  it("defines standard roles correctly", () => {
    expect(ROLES.STUDENT).toBe("student");
    expect(ROLES.FACULTY).toBe("faculty");
    expect(ROLES.ADMIN).toBe("admin");
    expect(PENDING_ROLE).toBe("");
  });

  describe("hasApprovedRole", () => {
    it("returns true for valid assigned roles", () => {
      expect(hasApprovedRole("student")).toBe(true);
      expect(hasApprovedRole("faculty")).toBe(true);
      expect(hasApprovedRole("admin")).toBe(true);
    });

    it("returns false for pending or unrecognized roles", () => {
      expect(hasApprovedRole("")).toBe(false);
      expect(hasApprovedRole("guest")).toBe(false);
      expect(hasApprovedRole("pending")).toBe(false);
      expect(hasApprovedRole(null)).toBe(false);
      expect(hasApprovedRole(undefined)).toBe(false);
    });
  });

  describe("isStaff", () => {
    it("returns true for faculty and admin", () => {
      expect(isStaff("faculty")).toBe(true);
      expect(isStaff("admin")).toBe(true);
    });

    it("returns false for student or empty roles", () => {
      expect(isStaff("student")).toBe(false);
      expect(isStaff("")).toBe(false);
      expect(isStaff(null)).toBe(false);
    });
  });

  describe("canExport", () => {
    it("allows staff members to export data", () => {
      expect(canExport("faculty")).toBe(true);
      expect(canExport("admin")).toBe(true);
    });

    it("disallows students and unassigned roles from exporting", () => {
      expect(canExport("student")).toBe(false);
      expect(canExport("")).toBe(false);
      expect(canExport("anonymous")).toBe(false);
    });
  });

  describe("canManageUsers", () => {
    it("returns true strictly for admin", () => {
      expect(canManageUsers("admin")).toBe(true);
    });

    it("returns false for non-admin roles", () => {
      expect(canManageUsers("faculty")).toBe(false);
      expect(canManageUsers("student")).toBe(false);
      expect(canManageUsers("")).toBe(false);
      expect(canManageUsers(null)).toBe(false);
    });
  });
});
