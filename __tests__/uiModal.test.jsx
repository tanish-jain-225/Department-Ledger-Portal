import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Modal uses createPortal — mock it so it renders inline for testing
jest.mock("react-dom", () => {
  const actual = jest.requireActual("react-dom");
  return {
    ...actual,
    createPortal: (node) => node,
  };
});

import Modal from "@/components/ui/Modal";

/**
 * Helper: renders a Modal that is open and waits for the `mounted` useEffect to fire.
 * The Modal gates rendering on `mounted` state, so we use waitFor to let the effect flush.
 */
async function renderOpenModal(props = {}) {
  const result = render(
    <Modal open title="Test" onClose={jest.fn()} {...props}>
      <p>Content</p>
    </Modal>
  );
  // Wait for the mounted state to be set by the useEffect
  await waitFor(() => {
    expect(screen.queryByRole("dialog")).not.toBeNull();
  });
  return result;
}

describe("Modal component", () => {
  // ── Visibility ────────────────────────────────────────────────────────────

  it("does not render when open=false", () => {
    render(
      <Modal open={false} title="Test Modal" onClose={jest.fn()}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("renders dialog, title, and children when open=true", async () => {
    await renderOpenModal({ title: "My Dialog" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("My Dialog")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("has aria-modal='true' for accessibility", async () => {
    await renderOpenModal({ title: "Accessible Dialog" });
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  // ── Close interactions ────────────────────────────────────────────────────

  it("calls onClose when the close button is clicked", async () => {
    const onClose = jest.fn();
    await renderOpenModal({ title: "Close Test", onClose });
    fireEvent.click(screen.getByRole("button", { name: /close dialog/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", async () => {
    const onClose = jest.fn();
    await renderOpenModal({ title: "Escape Test", onClose });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop overlay is clicked", async () => {
    const onClose = jest.fn();
    const { container } = await renderOpenModal({ title: "Backdrop Test", onClose });
    // The backdrop is the absolute-positioned div behind the modal container
    const backdrop = container.querySelector(".absolute.inset-0");
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ── Custom content ────────────────────────────────────────────────────────

  it("renders multiple children correctly", async () => {
    render(
      <Modal open title="Multi-Child" onClose={jest.fn()}>
        <p>First child</p>
        <p>Second child</p>
      </Modal>
    );
    await waitFor(() => screen.getByRole("dialog"));
    expect(screen.getByText("First child")).toBeInTheDocument();
    expect(screen.getByText("Second child")).toBeInTheDocument();
  });

  it("falls back to 'Dialog' aria-label when no title is provided", async () => {
    render(
      <Modal open onClose={jest.fn()}>
        <p>No title</p>
      </Modal>
    );
    await waitFor(() => screen.getByRole("dialog"));
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-label", "Dialog");
  });
});
