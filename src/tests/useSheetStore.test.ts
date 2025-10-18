import { coordToAddress, safeCalculateFormula } from "../lib/helpers";

describe("coordToAddress", () => {
  test("converts 0,0 to A1", () => {
    expect(coordToAddress(0, 0)).toBe("A1");
  });
  test("converts 25,0 to Z1", () => {
    expect(coordToAddress(25, 0)).toBe("Z1");
  });
  test("converts 26,0 to AA1", () => {
    expect(coordToAddress(26, 0)).toBe("AA1");
  });
});

describe("safeCalculateFormula", () => {
  test("simple arithmetic", () => {
    const grid: any = {};
    const res = safeCalculateFormula("=1+2*3", grid);
    expect(res.isError).toBe(false);
    expect(res.value).toBe(7);
  });

  test("references cell values", () => {
    const grid: any = { A1: { calculatedValue: 5 } };
    const res = safeCalculateFormula("=A1*2+3", grid);
    expect(res.isError).toBe(false);
    expect(res.value).toBe(13);
  });
});
