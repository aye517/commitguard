export type TestFramework = "vitest" | "jest" | "mocha";

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface CommitGuardConfig {
  /** Path to git repository root */
  repoPath?: string;
  /** Risk detection thresholds */
  risk?: {
    /** Minimum cyclomatic complexity for high risk */
    complexityThreshold?: number;
    /** File extensions to analyze */
    extensions?: string[];
  };
  /** Test file generation */
  test?: {
    /** Test framework for generated tests (vitest | jest | mocha) */
    framework?: TestFramework;
    /** Directory for test files relative to source (e.g. "__tests__" = same dir with __tests__ subdir, "" = same dir) */
    outputDir?: string;
    /** Test file suffix (e.g. ".test" for foo.test.ts) */
    suffix?: string;
  };
}

const DEFAULT_CONFIG: CommitGuardConfig = {
  risk: {
    complexityThreshold: 10,
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  test: {
    framework: "vitest",
    outputDir: "",
    suffix: ".test",
  },
};

export function loadConfig(overrides?: Partial<CommitGuardConfig>): CommitGuardConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    risk: {
      ...DEFAULT_CONFIG.risk,
      ...overrides?.risk,
    },
    test: {
      ...DEFAULT_CONFIG.test,
      ...overrides?.test,
    },
  };
}

/** Load config from package.json "commitguard" field and merge with defaults */
export function loadConfigFromProject(repoPath?: string): CommitGuardConfig {
  const root = repoPath ?? process.cwd();
  try {
    const pkgPath = join(root, "package.json");
    if (!existsSync(pkgPath)) return loadConfig();
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const commitguard = pkg.commitguard as Partial<CommitGuardConfig> | undefined;
    return loadConfig(commitguard);
  } catch {
    return loadConfig();
  }
}
