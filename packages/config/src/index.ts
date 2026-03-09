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
}

const DEFAULT_CONFIG: CommitGuardConfig = {
  risk: {
    complexityThreshold: 10,
    extensions: [".ts", ".tsx", ".js", ".jsx"],
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
  };
}
