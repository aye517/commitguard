import { describe, it, expect } from "vitest";
import { detectRisk, detectChangedFunctions } from "./index.js";
import type { ChangedFunction } from "./index.js";
import type { FunctionNode } from "./ast.js";

describe("detectRisk", () => {
  it("returns empty for few changes", () => {
    const fns: ChangedFunction[] = [
      { file: "a.ts", function: { name: "foo", line: 1, column: 0, type: "function" } },
    ];
    const risks = detectRisk(fns, "fix: updated foo function");
    expect(risks).toEqual([]);
  });

  it("detects medium risk when many functions changed", () => {
    const fns: ChangedFunction[] = Array.from({ length: 6 }, (_, i) => ({
      file: "a.ts",
      function: { name: `fn${i}`, line: i, column: 0, type: "function" as const },
    }));
    const risks = detectRisk(fns, "refactor: big change");
    expect(risks.some((r) => r.level === "medium")).toBe(true);
  });

  it("detects low risk for short commit message", () => {
    const fns: ChangedFunction[] = [
      { file: "a.ts", function: { name: "foo", line: 1, column: 0, type: "function" } },
    ];
    const risks = detectRisk(fns, "fix");
    expect(risks.some((r) => r.message.includes("short"))).toBe(true);
  });

  it("detects anonymous functions", () => {
    const fns: ChangedFunction[] = [
      { file: "a.ts", function: { name: "(anonymous)", line: 1, column: 0, type: "arrow" } },
    ];
    const risks = detectRisk(fns, "update anonymous handler");
    expect(risks.some((r) => r.message.includes("Anonymous"))).toBe(true);
  });
});

describe("detectChangedFunctions", () => {
  it("matches added lines within function range", () => {
    const diffFiles = [
      { filePath: "src/math.ts", addedLines: [5], removedLines: [] },
    ];
    const fileFunctions = new Map<string, FunctionNode[]>([
      ["src/math.ts", [{ name: "add", startLine: 3, endLine: 8, type: "function" }]],
    ]);
    const result = detectChangedFunctions(diffFiles, fileFunctions);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("add");
  });

  it("returns empty when lines are outside functions", () => {
    const diffFiles = [
      { filePath: "src/math.ts", addedLines: [1], removedLines: [] },
    ];
    const fileFunctions = new Map<string, FunctionNode[]>([
      ["src/math.ts", [{ name: "add", startLine: 5, endLine: 10, type: "function" }]],
    ]);
    const result = detectChangedFunctions(diffFiles, fileFunctions);
    expect(result).toHaveLength(0);
  });

  it("deduplicates functions with multiple changed lines", () => {
    const diffFiles = [
      { filePath: "src/math.ts", addedLines: [5, 6, 7], removedLines: [] },
    ];
    const fileFunctions = new Map<string, FunctionNode[]>([
      ["src/math.ts", [{ name: "add", startLine: 3, endLine: 10, type: "function" }]],
    ]);
    const result = detectChangedFunctions(diffFiles, fileFunctions);
    expect(result).toHaveLength(1);
  });
});
