import { describe, it, expect } from "vitest";
import { parseDiffLines, type DiffResult } from "./index.js";

describe("parseDiffLines", () => {
  it("extracts added lines from diff", () => {
    const diffs: DiffResult[] = [
      {
        file: "src/price.ts",
        content: `diff --git a/src/price.ts b/src/price.ts
@@ -20,6 +20,8 @@
 function calculatePrice() {
+  const discount = 0.1
+  const tax = 0.05
   return 100;
 }
`,
        status: "modified",
      },
    ];
    const result = parseDiffLines(diffs);
    expect(result).toHaveLength(1);
    expect(result[0].filePath).toBe("src/price.ts");
    expect(result[0].addedLines).toContain(21);
    expect(result[0].addedLines).toContain(22);
  });

  it("extracts removed lines from diff", () => {
    const diffs: DiffResult[] = [
      {
        file: "src/foo.ts",
        content: `diff --git a/src/foo.ts b/src/foo.ts
@@ -5,4 +5,3 @@
 function bar() {
-  const x = 1;
   return 2;
 }
`,
        status: "modified",
      },
    ];
    const result = parseDiffLines(diffs);
    expect(result[0].removedLines).toContain(6);
  });

  it("handles multiple hunks", () => {
    const diffs: DiffResult[] = [
      {
        file: "src/multi.ts",
        content: `diff --git a/src/multi.ts b/src/multi.ts
@@ -1,3 +1,4 @@
+// new comment
 const a = 1;
 const b = 2;
@@ -10,2 +11,3 @@
 function fn() {
+  return true;
 }
`,
        status: "modified",
      },
    ];
    const result = parseDiffLines(diffs);
    expect(result[0].addedLines).toContain(1);
    expect(result[0].addedLines).toContain(12);
  });

  it("returns empty arrays for unchanged files", () => {
    const diffs: DiffResult[] = [
      {
        file: "src/unchanged.ts",
        content: `diff --git a/src/unchanged.ts b/src/unchanged.ts
@@ -1,3 +1,3 @@
 const x = 1;
 const y = 2;
`,
        status: "modified",
      },
    ];
    const result = parseDiffLines(diffs);
    expect(result[0].addedLines).toHaveLength(0);
    expect(result[0].removedLines).toHaveLength(0);
  });
});
