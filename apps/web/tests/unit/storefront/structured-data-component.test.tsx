import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StructuredData } from "@/features/storefront/shared/structured-data";

describe("StructuredData", () => {
  it("escapes a literal </script> in a data field so it can't break out of the tag", () => {
    const { container } = render(<StructuredData data={{ name: "Evil</script><script>alert(1)</script>" }} />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script?.innerHTML).not.toContain("</script>");
    expect(script?.innerHTML).toContain("\\u003c/script\\u003e");
  });

  it("round-trips back to the original string once parsed as JSON", () => {
    const original = { name: "Fish & Chips <tag>" };
    const { container } = render(<StructuredData data={original} />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(JSON.parse(script!.innerHTML)).toEqual(original);
  });
});
