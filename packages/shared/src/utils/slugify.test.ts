import { describe, expect, it } from "vitest";
import { slugify } from "./slugify.js";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Organic Fertilizer")).toBe("organic-fertilizer");
  });

  it("strips diacritics", () => {
    expect(slugify("Café Crème")).toBe("cafe-creme");
  });

  it("collapses non-alphanumeric runs into a single hyphen", () => {
    expect(slugify("50% Off!! Seeds & Soil")).toBe("50-off-seeds-soil");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --Wheat Seeds--  ")).toBe("wheat-seeds");
  });

  it("returns an empty string for input with no alphanumeric characters", () => {
    expect(slugify("!!!")).toBe("");
  });
});
