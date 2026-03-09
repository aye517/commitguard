import { describe, it, expect } from "vitest";
import { detectChangedFunctions } from "./index.js";
import type { DiffFile } from "@commitguard/git";
import type { FunctionNode } from "./ast.js";

describe("detectChangedFunctions", () => {
  it("single function modified", () => {
    const diffFiles: DiffFile[] = [
      { filePath: "src/price.ts", addedLines: [42], removedLines: [] },
    ];
    const fileFunctions = new Map<string, FunctionNode[]>([
      [
        "src/price.ts",
        [
          { name: "calculatePrice", startLine: 30, endLine: 60, type: "function" },
        ],
      ],
    ]);
    const result = detectChangedFunctions(diffFiles, fileFunctions);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("calculatePrice");
    expect(result[0].filePath).toBe("src/price.ts");
  });

  it("multiple functions modified", () => {
    const diffFiles: DiffFile[] = [
      {
        filePath: "src/utils.ts",
        addedLines: [5, 25],
        removedLines: [],
      },
    ];
    const fileFunctions = new Map<string, FunctionNode[]>([
      [
        "src/utils.ts",
        [
          { name: "add", startLine: 1, endLine: 10, type: "function" },
          { name: "multiply", startLine: 20, endLine: 35, type: "function" },
        ],
      ],
    ]);
    const result = detectChangedFunctions(diffFiles, fileFunctions);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).toContain("add");
    expect(result.map((r) => r.name)).toContain("multiply");
  });

  it("diff line outside any function returns empty", () => {
    const diffFiles: DiffFile[] = [
      { filePath: "src/foo.ts", addedLines: [1, 2], removedLines: [] },
    ];
    const fileFunctions = new Map<string, FunctionNode[]>([
      [
        "src/foo.ts",
        [{ name: "bar", startLine: 10, endLine: 20, type: "function" }],
      ],
    ]);
    const result = detectChangedFunctions(diffFiles, fileFunctions);
    expect(result).toHaveLength(0);
  });

  it("multiple diff lines in same function - no duplicate", () => {
    const diffFiles: DiffFile[] = [
      {
        filePath: "src/calc.ts",
        addedLines: [31, 32, 33],
        removedLines: [],
      },
    ];
    const fileFunctions = new Map<string, FunctionNode[]>([
      [
        "src/calc.ts",
        [{ name: "calculate", startLine: 30, endLine: 50, type: "function" }],
      ],
    ]);
    const result = detectChangedFunctions(diffFiles, fileFunctions);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("calculate");
  });

  it("arrow function detection", () => {
    const diffFiles: DiffFile[] = [
      { filePath: "src/arrow.ts", addedLines: [15], removedLines: [] },
    ];
    const fileFunctions = new Map<string, FunctionNode[]>([
      [
        "src/arrow.ts",
        [{ name: "handleClick", startLine: 14, endLine: 16, type: "arrow" }],
      ],
    ]);
    const result = detectChangedFunctions(diffFiles, fileFunctions);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("arrow");
  });

  it("class method detection", () => {
    const diffFiles: DiffFile[] = [
      { filePath: "src/class.ts", addedLines: [25], removedLines: [] },
    ];
    const fileFunctions = new Map<string, FunctionNode[]>([
      [
        "src/class.ts",
        [{ name: "render", startLine: 22, endLine: 30, type: "method" }],
      ],
    ]);
    const result = detectChangedFunctions(diffFiles, fileFunctions);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("method");
  });

  it("ignores node_modules", () => {
    const diffFiles: DiffFile[] = [
      { filePath: "node_modules/pkg/index.js", addedLines: [5], removedLines: [] },
    ];
    const fileFunctions = new Map<string, FunctionNode[]>([
      [
        "node_modules/pkg/index.js",
        [{ name: "fn", startLine: 1, endLine: 10, type: "function" }],
      ],
    ]);
    const result = detectChangedFunctions(diffFiles, fileFunctions);
    expect(result).toHaveLength(0);
  });

  it("matches removed lines", () => {
    const diffFiles: DiffFile[] = [
      { filePath: "src/foo.ts", addedLines: [], removedLines: [42] },
    ];
    const fileFunctions = new Map<string, FunctionNode[]>([
      [
        "src/foo.ts",
        [{ name: "bar", startLine: 40, endLine: 45, type: "function" }],
      ],
    ]);
    const result = detectChangedFunctions(diffFiles, fileFunctions);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("bar");
  });
});
