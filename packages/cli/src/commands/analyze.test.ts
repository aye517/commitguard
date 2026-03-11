import { describe, it, expect } from "vitest";
import { analyze } from "./analyze.js";

describe("analyze", () => {
  it("is a function", () => {
    expect(typeof analyze).toBe("function");
  });
});
