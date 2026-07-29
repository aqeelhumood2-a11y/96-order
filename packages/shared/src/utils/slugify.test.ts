import { describe, expect, it } from "vitest";
import { slugify } from "./slugify.js";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Dark Roast Beans")).toBe("dark-roast-beans");
  });

  it("strips diacritics", () => {
    expect(slugify("Café Crème")).toBe("cafe-creme");
  });

  it("collapses non-alphanumeric runs into a single hyphen", () => {
    expect(slugify("50% Off!! Beans & Grinders")).toBe("50-off-beans-grinders");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --Pour-Over Filters--  ")).toBe("pour-over-filters");
  });

  it("returns an empty string for input with no alphanumeric characters", () => {
    expect(slugify("!!!")).toBe("");
  });
});
