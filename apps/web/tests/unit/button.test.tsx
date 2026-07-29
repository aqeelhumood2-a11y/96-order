import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/ui/primitives/button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Add to cart</Button>);
    expect(screen.getByRole("button", { name: "Add to cart" })).toBeInTheDocument();
  });

  it("applies the outline variant's classes", () => {
    render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button", { name: "Outline" })).toHaveClass("border-brand-300");
  });

  it("is disabled when the disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });
});
