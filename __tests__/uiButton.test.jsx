import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Button from "@/components/ui/Button";

describe("Button component", () => {
  // ── Rendering ────────────────────────────────────────────────────────────

  it("renders children correctly", () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it.each(["primary", "secondary", "soft", "brand", "success", "danger", "ghost"])(
    "renders variant '%s' without error",
    (variant) => {
      render(<Button variant={variant}>{variant}</Button>);
      expect(screen.getByRole("button", { name: variant })).toBeInTheDocument();
    }
  );

  it.each(["sm", "md", "lg"])("renders size '%s' without error", (size) => {
    render(<Button size={size}>Label</Button>);
    expect(screen.getByRole("button", { name: /label/i })).toBeInTheDocument();
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  it("shows loading spinner and 'Loading...' text when loading=true", () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    // The original children should not be visible
    expect(screen.queryByText(/submit/i)).not.toBeInTheDocument();
  });

  it("is disabled when loading=true", () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders an SVG spinner when loading=true", () => {
    const { container } = render(<Button loading>Submit</Button>);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveClass("animate-spin");
  });

  // ── Disabled state ────────────────────────────────────────────────────────

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Save</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is enabled by default", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  // ── Polymorphic rendering ─────────────────────────────────────────────────

  it("renders as an anchor element when as='a'", () => {
    render(
      <Button as="a" href="/dashboard">
        Dashboard
      </Button>
    );
    const link = screen.getByRole("link", { name: /dashboard/i });
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/dashboard");
  });

  // ── Extra props passthrough ───────────────────────────────────────────────

  it("passes through extra props like data-testid", () => {
    render(<Button data-testid="my-btn">OK</Button>);
    expect(screen.getByTestId("my-btn")).toBeInTheDocument();
  });

  it("applies custom className alongside the base classes", () => {
    render(<Button className="my-custom-class">OK</Button>);
    expect(screen.getByRole("button")).toHaveClass("my-custom-class");
  });
});
