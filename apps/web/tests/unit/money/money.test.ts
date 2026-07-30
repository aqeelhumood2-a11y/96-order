import { describe, expect, it } from "vitest";
import {
  add,
  compare,
  formatMoney,
  isGreaterThan,
  isGreaterThanOrEqual,
  isLessThan,
  isNegative,
  isPositive,
  isZero,
  max,
  money,
  multiply,
  positiveDifference,
  subtract,
  sum,
  ZERO_BHD,
} from "@/core/money/money";

describe("money", () => {
  it("rejects a non-integer amount", () => {
    expect(() => money(18.99)).toThrow(TypeError);
  });

  it("defaults to BHD", () => {
    expect(money(1000).currency).toBe("BHD");
  });
});

describe("add / subtract", () => {
  it("adds two amounts in the same currency", () => {
    expect(add(money(1000), money(500))).toEqual(money(1500));
  });

  it("subtracts two amounts, allowing a negative result", () => {
    expect(subtract(money(500), money(1000))).toEqual(money(-500));
  });

  it("throws when currencies differ", () => {
    const foreign = { amount: 100, currency: "USD" } as unknown as ReturnType<typeof money>;
    expect(() => add(money(100), foreign)).toThrow(TypeError);
  });
});

describe("multiply", () => {
  it("scales by an integer quantity", () => {
    expect(multiply(money(1899), 3)).toEqual(money(5697));
  });

  it("rounds to the nearest minor unit", () => {
    expect(multiply(money(10), 0.5)).toEqual(money(5));
  });
});

describe("sum", () => {
  it("totals a list of amounts", () => {
    expect(sum([money(1000), money(2000), money(500)])).toEqual(money(3500));
  });

  it("returns zero for an empty list", () => {
    expect(sum([])).toEqual(ZERO_BHD);
  });
});

describe("comparisons", () => {
  it("compare returns the sign of the difference", () => {
    expect(compare(money(100), money(50))).toBe(1);
    expect(compare(money(50), money(100))).toBe(-1);
    expect(compare(money(50), money(50))).toBe(0);
  });

  it("isGreaterThan / isGreaterThanOrEqual / isLessThan", () => {
    expect(isGreaterThan(money(100), money(50))).toBe(true);
    expect(isGreaterThan(money(50), money(50))).toBe(false);
    expect(isGreaterThanOrEqual(money(50), money(50))).toBe(true);
    expect(isLessThan(money(50), money(100))).toBe(true);
  });

  it("isZero / isPositive / isNegative", () => {
    expect(isZero(ZERO_BHD)).toBe(true);
    expect(isPositive(money(1))).toBe(true);
    expect(isNegative(money(-1))).toBe(true);
  });

  it("max returns the larger amount", () => {
    expect(max(money(100), money(200))).toEqual(money(200));
    expect(max(money(200), money(100))).toEqual(money(200));
  });
});

describe("positiveDifference", () => {
  it("returns the difference when a > b", () => {
    expect(positiveDifference(money(100), money(40))).toEqual(money(60));
  });

  it("floors at zero when b >= a", () => {
    expect(positiveDifference(money(40), money(100))).toEqual(ZERO_BHD);
    expect(positiveDifference(money(40), money(40))).toEqual(ZERO_BHD);
  });
});

describe("formatMoney", () => {
  it("formats BHD with three decimal places", () => {
    expect(formatMoney(money(18990))).toBe("BHD 18.990");
    expect(formatMoney(money(1500))).toBe("BHD 1.500");
    expect(formatMoney(ZERO_BHD)).toBe("BHD 0.000");
  });

  it("formats a whole-number amount with trailing zeros", () => {
    expect(formatMoney(money(30_000))).toBe("BHD 30.000");
  });
});
