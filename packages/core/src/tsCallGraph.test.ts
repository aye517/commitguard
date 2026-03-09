import { describe, it, expect } from "vitest";
import { buildTSCallGraph } from "./tsCallGraph.js";
import { findImpactedFunctions } from "./callgraph.js";
import { join } from "node:path";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";

describe("buildTSCallGraph", () => {
  const fixturesDir = join(process.cwd(), "packages/core", "fixtures-ts-callgraph");

  function setupFixture(name: string, content: string): string {
    const dir = join(fixturesDir, name);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const filePath = join(dir, "index.ts");
    writeFileSync(filePath, content, "utf-8");
    return dir;
  }

  it("simple function call", () => {
    const root = setupFixture(
      "simple",
      `
function a() {
  b();
}
function b() {
  return 1;
}
`
    );
    const graph = buildTSCallGraph(root);
    expect(graph.has("a")).toBe(true);
    expect(graph.get("a")?.has("b")).toBe(true);
    rmSync(join(root, "index.ts"));
  });

  it("class method call", () => {
    const root = setupFixture(
      "class-method",
      `
class Service {
  process() {
    this.calculate();
  }
  calculate() {
    return 1;
  }
}
`
    );
    const graph = buildTSCallGraph(root);
    expect(graph.has("Service.process")).toBe(true);
    expect(graph.get("Service.process")?.has("Service.calculate")).toBe(true);
    rmSync(join(root, "index.ts"));
  });

  it("nested calls", () => {
    const root = setupFixture(
      "nested",
      `
function a() {
  b();
}
function b() {
  c();
}
function c() {}
`
    );
    const graph = buildTSCallGraph(root);
    expect(graph.get("a")?.has("b")).toBe(true);
    expect(graph.get("b")?.has("c")).toBe(true);
    rmSync(join(root, "index.ts"));
  });

  it("recursive call", () => {
    const root = setupFixture(
      "recursive",
      `
function fib(n: number): number {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}
`
    );
    const graph = buildTSCallGraph(root);
    expect(graph.get("fib")?.has("fib")).toBe(true);
    rmSync(join(root, "index.ts"));
  });

  it("findImpactedFunctions with TS graph", () => {
    const root = setupFixture(
      "impacted",
      `
class PriceService {
  calculatePrice() {
    this.applyDiscount();
  }
  applyDiscount() {}
}
function checkout() {
  const service = new PriceService();
  service.calculatePrice();
}
`
    );
    const graph = buildTSCallGraph(root);
    const result = findImpactedFunctions(graph, ["PriceService.calculatePrice"]);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain("PriceService.calculatePrice");
    rmSync(join(root, "index.ts"));
  });

  it("runs on actual project", () => {
    const root = process.cwd();
    const graph = buildTSCallGraph(root);
    expect(graph).toBeInstanceOf(Map);
  });
});
