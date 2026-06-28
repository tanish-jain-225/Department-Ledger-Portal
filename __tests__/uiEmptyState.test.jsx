import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import EmptyState from "@/components/ui/EmptyState";

describe("EmptyState component", () => {
  // ── Default rendering ─────────────────────────────────────────────────────

  it("renders with default title when no title is provided", () => {
    render(<EmptyState />);
    expect(screen.getByText("No data found")).toBeInTheDocument();
  });

  it("renders the default SVG icon when no icon is provided", () => {
    const { container } = render(<EmptyState />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  // ── Custom props ──────────────────────────────────────────────────────────

  it("renders a custom title", () => {
    render(<EmptyState title="Nothing here yet" />);
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("renders the message prop", () => {
    render(<EmptyState title="Empty" message="Add something to get started." />);
    expect(screen.getByText("Add something to get started.")).toBeInTheDocument();
  });

  it("renders a custom icon node", () => {
    render(
      <EmptyState
        icon={<span data-testid="custom-icon">🎓</span>}
        title="Custom Icon"
      />
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    expect(screen.getByText("🎓")).toBeInTheDocument();
  });

  it("renders the action slot", () => {
    render(
      <EmptyState
        title="No projects"
        action={<button>Add Project</button>}
      />
    );
    expect(screen.getByRole("button", { name: /add project/i })).toBeInTheDocument();
  });

  // ── Legacy prop support ───────────────────────────────────────────────────

  it("supports legacy 'text' prop as a fallback for 'message'", () => {
    render(<EmptyState title="Legacy" text="Old text prop still works." />);
    expect(screen.getByText("Old text prop still works.")).toBeInTheDocument();
  });

  it("prefers 'message' over 'text' when both are provided", () => {
    render(
      <EmptyState
        title="Priority"
        message="This should show."
        text="This should not."
      />
    );
    expect(screen.getByText("This should show.")).toBeInTheDocument();
    expect(screen.queryByText("This should not.")).not.toBeInTheDocument();
  });

  // ── No body text ─────────────────────────────────────────────────────────

  it("does not render a body paragraph when neither message nor text is set", () => {
    render(<EmptyState title="Just a title" />);
    // Only the title p element should be present, not a second body paragraph
    const paras = document.querySelectorAll("p");
    expect(paras).toHaveLength(1);
    expect(paras[0].textContent).toBe("Just a title");
  });

  it("does not render the action slot when action is not provided", () => {
    const { container } = render(<EmptyState title="No Action" />);
    // The action wrapper div only renders when action is truthy
    const actionDivs = container.querySelectorAll("div > div");
    // None of them should contain a button
    actionDivs.forEach((div) => {
      expect(div.querySelector("button")).toBeNull();
    });
  });
});
