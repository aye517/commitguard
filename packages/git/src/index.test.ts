import { describe, it, expect } from "vitest";
import { parseDiffLines } from "./index.js";
import type { DiffResult } from "./index.js";

describe("parseDiffLines (via index export)", () => {
  it("parses added lines from diff content", () => {
    const diffs: DiffResult[] = [
      {
        file: "src/math.ts",
        content: `@@ -1,3 +1,5 @@
 const a = 1;
+const b = 2;
+const c = 3;
 const d = 4;`,
        status: "modified",
      },
    ];
    const result = parseDiffLines(diffs);
    expect(result).toHaveLength(1);
    expect(result[0].filePath).toBe("src/math.ts");
    expect(result[0].addedLines).toContain(2);
    expect(result[0].addedLines).toContain(3);
  });

  it("parses removed lines from diff content", () => {
    const diffs: DiffResult[] = [
      {
        file: "src/math.ts",
        content: `@@ -1,5 +1,3 @@
 const a = 1;
-const b = 2;
-const c = 3;
 const d = 4;`,
        status: "modified",
      },
    ];
    const result = parseDiffLines(diffs);
    expect(result[0].removedLines).toContain(2);
    expect(result[0].removedLines).toContain(3);
  });

  it("returns empty arrays for unchanged files", () => {
    const diffs: DiffResult[] = [
      {
        file: "src/math.ts",
        content: `@@ -1,3 +1,3 @@
 const a = 1;
 const b = 2;
 const c = 3;`,
        status: "modified",
      },
    ];
    const result = parseDiffLines(diffs);
    expect(result[0].addedLines).toEqual([]);
    expect(result[0].removedLines).toEqual([]);
  });

  it("handles multiple hunks", () => {
    const diffs: DiffResult[] = [
      {
        file: "src/math.ts",
        content: `@@ -1,3 +1,4 @@
 const a = 1;
+const b = 2;
 const c = 3;
@@ -10,3 +11,4 @@
 const x = 10;
+const y = 20;
 const z = 30;`,
        status: "modified",
      },
    ];
    const result = parseDiffLines(diffs);
    expect(result[0].addedLines.length).toBe(2);
  });
});
