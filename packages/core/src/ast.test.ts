import { describe, it, expect } from "vitest";
import { parseFile, findFunctionsWithRanges } from "./ast.js";

describe("findFunctionsWithRanges", () => {
  it("extracts function with line range", () => {
    const code = `
function calculatePrice() {
  return 100;
}
`;
    const ast = parseFile(code);
    expect(ast).not.toBeNull();
    const fns = findFunctionsWithRanges(ast!);
    expect(fns).toHaveLength(1);
    expect(fns[0].name).toBe("calculatePrice");
    expect(fns[0].startLine).toBeLessThanOrEqual(fns[0].endLine);
  });

  it("extracts arrow function with range", () => {
    const code = `
const add = (a: number, b: number) => {
  return a + b;
};
`;
    const ast = parseFile(code);
    const fns = findFunctionsWithRanges(ast!);
    expect(fns).toHaveLength(1);
    expect(fns[0].name).toBe("add");
    expect(fns[0].type).toBe("arrow");
  });

  it("extracts class method with range", () => {
    const code = `
class Calculator {
  add(a: number, b: number) {
    return a + b;
  }
}
`;
    const ast = parseFile(code);
    const fns = findFunctionsWithRanges(ast!);
    expect(fns).toHaveLength(1);
    expect(fns[0].name).toBe("add");
    expect(fns[0].type).toBe("method");
  });

  it("extracts multiple functions", () => {
    const code = `
function a() { return 1; }
function b() { return 2; }
`;
    const ast = parseFile(code);
    const fns = findFunctionsWithRanges(ast!);
    expect(fns).toHaveLength(2);
    expect(fns[0].name).toBe("a");
    expect(fns[1].name).toBe("b");
  });
});
