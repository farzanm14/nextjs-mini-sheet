import {
  createInitialCell,
  updateDependencyMap,
  detectCycle,
  recalculateGrid,
} from "../lib/helpers";

describe("dependency map updates and cycles", () => {
  test("updateDependencyMap adds and removes dependents correctly", () => {
    const grid: any = {
      A1: { ...createInitialCell(), dependents: ["B1"] },
      B1: { ...createInitialCell(), precedents: ["A1"] },
    };

    // change B1 to depend on C1 instead of A1
    const updated = updateDependencyMap(grid, "B1", ["C1"]);

    // A1 should no longer list B1 as a dependent
    expect(updated.A1!.dependents).not.toContain("B1");

    // C1 should now exist and list B1 as dependent
    expect(updated.C1).toBeDefined();
    expect(updated.C1!.dependents).toContain("B1");

    // B1 should have its precedents set to C1
    expect(updated.B1!.precedents).toEqual(["C1"]);
  });

  test("detectCycle returns cycle nodes when circular dependence exists", () => {
    const grid: any = {
      A1: { ...createInitialCell(), precedents: ["B1"] },
      B1: { ...createInitialCell(), precedents: ["C1"] },
      C1: { ...createInitialCell(), precedents: ["A1"] },
    };

    const cycle = detectCycle(grid, "A1");
    expect(cycle).not.toBeNull();
    expect(Array.isArray(cycle)).toBe(true);
    // cycle should include at least the starting node
    expect((cycle as string[]).includes("A1")).toBe(true);
  });
});

describe("recalculateGrid behavior", () => {
  test("recalculates dependent cells in proper order", () => {
    const grid: any = {
      A1: { ...createInitialCell(), formula: "=1+1", dependents: ["B1"] },
      B1: { ...createInitialCell(), formula: "=A1+2", dependents: [] },
    };

    const final = recalculateGrid(grid, ["A1", "B1"]);

    expect(final.A1!.calculatedValue).toBe(2);
    expect(final.B1!.calculatedValue).toBe(4);
  });
});
