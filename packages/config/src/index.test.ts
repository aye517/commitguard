import { describe, it, expect } from "vitest";
import { loadConfig, loadConfigFromProject } from "./index.js";

describe("loadConfig", () => {
  it("returns defaults when no overrides", () => {
    const config = loadConfig();
    expect(config.risk?.complexityThreshold).toBe(10);
    expect(config.risk?.extensions).toEqual([".ts", ".tsx", ".js", ".jsx"]);
    expect(config.test?.framework).toBe("vitest");
    expect(config.test?.outputDir).toBe("");
    expect(config.test?.suffix).toBe(".test");
    expect(config.ai?.provider).toBe("none");
    expect(config.ai?.model).toBe("claude-sonnet-4-20250514");
    expect(config.ai?.apiKeyEnv).toBe("ANTHROPIC_API_KEY");
  });

  it("merges overrides with defaults", () => {
    const config = loadConfig({
      test: { framework: "jest" },
    });
    expect(config.test?.framework).toBe("jest");
    // Other defaults preserved
    expect(config.test?.suffix).toBe(".test");
    expect(config.risk?.complexityThreshold).toBe(10);
  });

  it("merges nested risk overrides", () => {
    const config = loadConfig({
      risk: { complexityThreshold: 20 },
    });
    expect(config.risk?.complexityThreshold).toBe(20);
    expect(config.risk?.extensions).toEqual([".ts", ".tsx", ".js", ".jsx"]);
  });

  it("merges AI overrides", () => {
    const config = loadConfig({
      ai: { provider: "claude", model: "claude-opus-4-20250514" },
    });
    expect(config.ai?.provider).toBe("claude");
    expect(config.ai?.model).toBe("claude-opus-4-20250514");
    expect(config.ai?.apiKeyEnv).toBe("ANTHROPIC_API_KEY");
  });
});

describe("loadConfigFromProject", () => {
  it("returns defaults for non-existent path", () => {
    const config = loadConfigFromProject("/non/existent/path");
    expect(config.test?.framework).toBe("vitest");
    expect(config.risk?.complexityThreshold).toBe(10);
  });
});
