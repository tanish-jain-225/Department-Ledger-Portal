import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  Skeleton,
  ProfileSkeleton,
  CardSkeleton,
  TableRowSkeleton,
} from "@/components/ui/Skeleton";

describe("Skeleton components", () => {
  // ── Base Skeleton ─────────────────────────────────────────────────────────

  describe("Skeleton", () => {
    it("renders a div element", () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild.tagName).toBe("DIV");
    });

    it("applies animate-pulse class by default", () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveClass("animate-pulse");
    });

    it("applies bg-slate-200 class by default", () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveClass("bg-slate-200");
    });

    it("merges custom className prop", () => {
      const { container } = render(<Skeleton className="h-8 w-48" />);
      expect(container.firstChild).toHaveClass("h-8", "w-48", "animate-pulse");
    });

    it("passes through additional props", () => {
      const { container } = render(<Skeleton data-testid="skel" aria-hidden="true" />);
      expect(container.firstChild).toHaveAttribute("data-testid", "skel");
      expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    });
  });

  // ── ProfileSkeleton ───────────────────────────────────────────────────────

  describe("ProfileSkeleton", () => {
    it("renders without errors", () => {
      const { container } = render(<ProfileSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders multiple skeleton rows for profile fields", () => {
      const { container } = render(<ProfileSkeleton />);
      // ProfileSkeleton renders 6 field groups plus 2 header skeletons
      const pulsingDivs = container.querySelectorAll(".animate-pulse");
      expect(pulsingDivs.length).toBeGreaterThanOrEqual(6);
    });
  });

  // ── CardSkeleton ──────────────────────────────────────────────────────────

  describe("CardSkeleton", () => {
    it("renders without errors", () => {
      const { container } = render(<CardSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("contains animated placeholder elements", () => {
      const { container } = render(<CardSkeleton />);
      const pulsingDivs = container.querySelectorAll(".animate-pulse");
      expect(pulsingDivs.length).toBeGreaterThan(0);
    });

    it("has a card-like container with rounded and border classes", () => {
      const { container } = render(<CardSkeleton />);
      expect(container.firstChild).toHaveClass("rounded-xl", "border");
    });
  });

  // ── TableRowSkeleton ──────────────────────────────────────────────────────

  describe("TableRowSkeleton", () => {
    it("renders without errors", () => {
      const { container } = render(<TableRowSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("includes a circular avatar skeleton", () => {
      const { container } = render(<TableRowSkeleton />);
      const rounded = container.querySelector(".rounded-full");
      expect(rounded).toBeInTheDocument();
      expect(rounded).toHaveClass("animate-pulse");
    });

    it("includes at least 3 animated placeholder elements", () => {
      const { container } = render(<TableRowSkeleton />);
      const pulsingDivs = container.querySelectorAll(".animate-pulse");
      expect(pulsingDivs.length).toBeGreaterThanOrEqual(3);
    });
  });
});
