import { isPermissionDeniedError, getAccessDeniedMessage } from "@/lib/access-errors";

describe("access-errors", () => {
  describe("isPermissionDeniedError", () => {
    it("returns true for standard permission-denied Firestore errors", () => {
      expect(isPermissionDeniedError(new Error("permission-denied"))).toBe(true);
      expect(isPermissionDeniedError(new Error("Missing or insufficient permissions."))).toBe(true);
      expect(isPermissionDeniedError("insufficient permissions to access collection")).toBe(true);
      expect(isPermissionDeniedError("permission denied")).toBe(true);
    });

    it("returns false for other non-permission errors", () => {
      expect(isPermissionDeniedError(new Error("Network timeout"))).toBe(false);
      expect(isPermissionDeniedError(new Error("Document not found"))).toBe(false);
      expect(isPermissionDeniedError(null)).toBe(false);
      expect(isPermissionDeniedError(undefined)).toBe(false);
      expect(isPermissionDeniedError("")).toBe(false);
    });
  });

  describe("getAccessDeniedMessage", () => {
    it("returns permission-specific message when error is permission denied", () => {
      const err = new Error("insufficient permissions");
      expect(getAccessDeniedMessage(err)).toBe(
        "Access denied. You do not have permission to view this resource."
      );
    });

    it("returns general authorization message for other unauthorized errors", () => {
      const err = new Error("unauthorized user token");
      expect(getAccessDeniedMessage(err)).toBe(
        "Access denied. You are not authorized to view this resource."
      );
    });

    it("returns general authorization message for empty or null error", () => {
      expect(getAccessDeniedMessage(null)).toBe(
        "Access denied. You are not authorized to view this resource."
      );
    });
  });
});
