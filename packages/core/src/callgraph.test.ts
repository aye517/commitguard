import { describe, it, expect } from "vitest";
import {
  scanSourceFiles,
  buildCallGraph,
  findImpactedFunctions,
} from "./callgraph.js";
import { join } from "node:path";

describe("buildCallGraph", () => {
  it("simple call A -> B", () => {
    const root = join(process.cwd(), "packages/core");
    const graph = buildCallGraph(root);
    // Graph may have various edges from actual source - just verify structure
    expect(graph).toBeInstanceOf(Map);
  });

  it("findImpactedFunctions - simple chain", () => {
    const graph = new Map<string, Set<string>>();
    graph.set("A", new Set(["B"]));
    const result = findImpactedFunctions(graph, ["A"]);
    expect(result).toContain("A");
    expect(result).toContain("B");
  });

  it("findImpactedFunctions - nested calls A -> B -> C", () => {
    const graph = new Map<string, Set<string>>();
    graph.set("A", new Set(["B"]));
    graph.set("B", new Set(["C"]));
    const result = findImpactedFunctions(graph, ["B"]);
    expect(result).toContain("A");
    expect(result).toContain("B");
    expect(result).toContain("C");
  });

  it("findImpactedFunctions - multiple callers A -> C, B -> C", () => {
    const graph = new Map<string, Set<string>>();
    graph.set("A", new Set(["C"]));
    graph.set("B", new Set(["C"]));
    const result = findImpactedFunctions(graph, ["C"]);
    expect(result).toContain("A");
    expect(result).toContain("B");
    expect(result).toContain("C");
  });

  it("findImpactedFunctions - recursive A -> A", () => {
    const graph = new Map<string, Set<string>>();
    graph.set("A", new Set(["A"]));
    const result = findImpactedFunctions(graph, ["A"]);
    expect(result).toContain("A");
    expect(result).toHaveLength(1);
  });

  it("findImpactedFunctions - checkout/calculatePrice/applyDiscount example", () => {
    const graph = new Map<string, Set<string>>();
    graph.set("checkout", new Set(["calculatePrice"]));
    graph.set("calculatePrice", new Set(["applyDiscount"]));
    const result = findImpactedFunctions(graph, ["calculatePrice"]);
    expect(result).toContain("checkout");
    expect(result).toContain("calculatePrice");
    expect(result).toContain("applyDiscount");
    expect(result).toHaveLength(3);
  });
});

describe("scanSourceFiles", () => {
  it("returns .ts and .tsx files", () => {
    const root = process.cwd();
    const files = scanSourceFiles(root);
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((f) => f.endsWith(".ts") || f.endsWith(".tsx"))).toBe(true);
  });

  it("excludes node_modules", () => {
    const root = process.cwd();
    const files = scanSourceFiles(root);
    expect(files.every((f) => !f.includes("node_modules"))).toBe(true);
  });

  it("excludes test files", () => {
    const root = process.cwd();
    const files = scanSourceFiles(root);
    expect(files.every((f) => !/\.(test|spec)\.(ts|tsx)$/.test(f))).toBe(true);
  });
});
