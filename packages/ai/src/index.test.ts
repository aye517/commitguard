import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { getTestFilePath, AIService } from "./index.js";
import type { ChangedFunction } from "@commitguard/core";

describe("getTestFilePath", () => {
  it("generates .test file in same directory by default", () => {
    const result = getTestFilePath("src/utils/math.ts");
    expect(result).toBe(join("src", "utils", "math.test.ts"));
  });

  it("preserves tsx extension", () => {
    const result = getTestFilePath("src/components/Button.tsx");
    expect(result).toBe(join("src", "components", "Button.test.tsx"));
  });

  it("handles js extension", () => {
    const result = getTestFilePath("lib/helper.js");
    expect(result).toBe(join("lib", "helper.test.js"));
  });

  it("handles root-level file", () => {
    const result = getTestFilePath("index.ts");
    expect(result).toBe("index.test.ts");
  });
});

describe("AIService", () => {
  it("generates template tests when no client is set", async () => {
    const service = new AIService();
    const fns: ChangedFunction[] = [
      { file: "src/math.ts", function: { name: "add", line: 1, column: 0, type: "function" } },
      { file: "src/math.ts", function: { name: "subtract", line: 5, column: 0, type: "function" } },
    ];
    const results = await service.generateTests(fns, "vitest");
    expect(results).toHaveLength(1); // grouped by file
    expect(results[0]).toContain('import { describe, it, expect } from "vitest"');
    expect(results[0]).toContain('import { add, subtract } from "./math"');
    expect(results[0]).toContain("add should work correctly");
    expect(results[0]).toContain("subtract should work correctly");
  });

  it("generates jest template without vitest import", async () => {
    const service = new AIService();
    const fns: ChangedFunction[] = [
      { file: "src/utils.ts", function: { name: "format", line: 1, column: 0, type: "function" } },
    ];
    const results = await service.generateTests(fns, "jest");
    expect(results[0]).not.toContain("vitest");
    expect(results[0]).toContain('import { format } from "./utils"');
    expect(results[0]).toContain("format should work correctly");
  });

  it("generates mocha template with chai import", async () => {
    const service = new AIService();
    const fns: ChangedFunction[] = [
      { file: "src/calc.ts", function: { name: "sum", line: 1, column: 0, type: "function" } },
    ];
    const results = await service.generateTests(fns, "mocha");
    expect(results[0]).toContain('import { expect } from "chai"');
    expect(results[0]).toContain('import { sum } from "./calc"');
  });

  it("skips anonymous functions", async () => {
    const service = new AIService();
    const fns: ChangedFunction[] = [
      { file: "src/handler.ts", function: { name: "(anonymous)", line: 1, column: 0, type: "arrow" } },
      { file: "src/handler.ts", function: { name: "handle", line: 5, column: 0, type: "function" } },
    ];
    const results = await service.generateTests(fns, "vitest");
    expect(results[0]).not.toContain("(anonymous)");
    expect(results[0]).toContain("handle");
  });

  it("uses custom client when set", async () => {
    const service = new AIService();
    service.setClient({
      async generateTests() {
        return ["// custom test"];
      },
    });
    const fns: ChangedFunction[] = [
      { file: "src/a.ts", function: { name: "foo", line: 1, column: 0, type: "function" } },
    ];
    const results = await service.generateTests(fns, "vitest");
    expect(results).toEqual(["// custom test"]);
  });
});
