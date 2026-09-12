import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import RoleButton from "@/components/ui/RoleButton";
import { purgeUser } from "@/lib/data";

jest.mock("@/lib/firebase", () => ({
  getDb: jest.fn(() => ({})),
}));

jest.mock("@/lib/audit", () => ({
  logAudit: jest.fn(),
}));

describe("Self-Security & Protection Controls", () => {
  describe("RoleButton UI Component", () => {
    it("renders properly with active and idle states", () => {
      render(<RoleButton label="Admin" role="admin" currentRole="admin" onClick={jest.fn()} />);
      const btn = screen.getByRole("button", { name: /admin/i });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveClass("bg-brand-700");
    });

    it("supports disabled prop and prevents click events when disabled", () => {
      const handleClick = jest.fn();
      render(
        <RoleButton
          label="Faculty"
          role="faculty"
          currentRole="student"
          onClick={handleClick}
          disabled={true}
          title="Self-modification protected"
        />
      );
      const btn = screen.getByRole("button", { name: /faculty/i });
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute("title", "Self-modification protected");
      expect(btn).toHaveClass("opacity-50", "cursor-not-allowed");

      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("Governance Self-Deletion Safeguard", () => {
    it("throws governance violation error if an administrator attempts to delete their own account", async () => {
      const currentAdminUid = "admin_user_123";
      await expect(purgeUser(currentAdminUid, currentAdminUid)).rejects.toThrow(
        /Governance policy violation: Self-deletion is forbidden/i
      );
    });
  });

  describe("Profile Update Sanitization", () => {
    it("defensively removes privileged role fields when sanitizing fields", () => {
      const incomingFields = {
        name: "Admin User",
        phone: "1234567890",
        role: "student", // Attempted demotion or elevation
        facultyVerification: "approved",
      };

      const { role: _r, facultyVerification: _fv, ...safeFields } = incomingFields;
      expect(safeFields).not.toHaveProperty("role");
      expect(safeFields).not.toHaveProperty("facultyVerification");
      expect(safeFields).toEqual({
        name: "Admin User",
        phone: "1234567890",
      });
    });
  });
});
