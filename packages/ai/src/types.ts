import type { ChangedFunction, AnalysisResult } from "@commitguard/core";
import type { TestFramework } from "@commitguard/config";

/** Context passed to AI client for test generation */
export interface GenerateTestsContext {
  /** Functions grouped by file */
  functionsByFile: Map<string, ChangedFunction[]>;
  /** Test framework to use */
  framework: TestFramework;
  /** Project root path for reading source files */
  repoPath?: string;
}

/**
 * AI client interface.
 * Implement this to add custom AI providers.
 */
export interface AIClient {
  /** Generate test file contents for changed functions */
  generateTests(context: GenerateTestsContext): Promise<string[]>;
  /** Optional: analyze risk from analysis result */
  analyzeRisk?(result: AnalysisResult): Promise<string>;
}
