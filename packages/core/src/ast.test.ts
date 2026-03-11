import { describe, it, expect } from "vitest";
import { parseFile, findFunctionsWithRanges, analyzeFunctionComplexity } from "./ast.js";

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

describe("analyzeFunctionComplexity", () => {
  it("returns complexity 1 for a simple function", () => {
    const code = `function simple() { return 1; }`;
    const ast = parseFile(code)!;
    const result = analyzeFunctionComplexity(ast);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("simple");
    expect(result[0].complexity).toBe(1);
  });

  it("counts if statements", () => {
    const code = `function check(x) {
      if (x > 0) { return 1; }
      if (x < 0) { return -1; }
      return 0;
    }`;
    const ast = parseFile(code)!;
    const result = analyzeFunctionComplexity(ast);
    expect(result[0].complexity).toBe(3); // 1 base + 2 ifs
  });

  it("counts for, while, ternary, logical operators", () => {
    const code = `function complex(arr) {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] > 0 && arr[i] < 100) {
          while (arr[i] > 10) {
            arr[i] = arr[i] > 50 ? arr[i] - 10 : arr[i] - 1;
          }
        }
      }
      return arr;
    }`;
    const ast = parseFile(code)!;
    const result = analyzeFunctionComplexity(ast);
    // 1 base + for + if + && + while + ternary = 6
    expect(result[0].complexity).toBe(6);
  });

  it("counts switch cases", () => {
    const code = `function switcher(x) {
      switch (x) {
        case 1: return 'a';
        case 2: return 'b';
        case 3: return 'c';
        default: return 'd';
      }
    }`;
    const ast = parseFile(code)!;
    const result = analyzeFunctionComplexity(ast);
    // 1 base + 4 cases (including default)
    expect(result[0].complexity).toBe(5);
  });

  it("counts catch clauses", () => {
    const code = `function risky() {
      try {
        doSomething();
      } catch (e) {
        if (e instanceof Error) {
          return null;
        }
      }
    }`;
    const ast = parseFile(code)!;
    const result = analyzeFunctionComplexity(ast);
    // 1 base + catch + if = 3
    expect(result[0].complexity).toBe(3);
  });
});
