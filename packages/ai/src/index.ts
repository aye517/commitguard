import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, relative, posix } from "node:path";
import { spawnSync } from "node:child_process";
import type { ChangedFunction, AnalysisResult } from "@commitguard/core";
import { loadConfigFromProject, type TestFramework } from "@commitguard/config";
import type { AIClient, GenerateTestsContext } from "./types.js";
import { resolveAIClient } from "./provider.js";

export type { AIClient, GenerateTestsContext } from "./types.js";
export { ClaudeClient } from "./clients/claude.js";
export { resolveAIClient } from "./provider.js";

export interface TestFile {
  sourceFile: string;
  testFilePath: string;
  content: string;
}

/**
 * AI integration layer - pluggable interface for AI providers.
 * Supports Claude AI via config/env, or custom clients via setClient().
 */
export class AIService {
  constructor(private client?: AIClient) {}

  setClient(client: AIClient): void {
    this.client = client;
  }

  async generateTests(
    functions: ChangedFunction[],
    framework: TestFramework = "vitest",
    repoPath?: string
  ): Promise<string[]> {
    const byFile = groupByFile(functions);

    if (this.client) {
      const context: GenerateTestsContext = {
        functionsByFile: byFile,
        framework,
        repoPath,
      };
      return this.client.generateTests(context);
    }

    return this.generateTemplateTests(byFile, framework, repoPath);
  }

  /** Basic template when no AI client - framework-specific syntax */
  private generateTemplateTests(
    byFile: Map<string, ChangedFunction[]>,
    framework: TestFramework,
    repoPath?: string
  ): string[] {
    const contents: string[] = [];
    for (const [file, fns] of byFile) {
      const namedFns = fns.filter((f) => f.function.name !== "(anonymous)");
      if (namedFns.length === 0) continue;

      const describeName =
        file.replace(/\.(ts|tsx|js|jsx)$/, "").split("/").pop() ?? "module";
      const testFilePath = getTestFilePath(file, repoPath);
      const importPath = calcRelativeImport(testFilePath, file);
      const functionNames = namedFns.map((f) => f.function.name);

      const blocks = namedFns.map(
        (f) =>
          `  it("${f.function.name} should work correctly", () => {\n    // TODO: replace with actual arguments and expected value\n    const result = ${f.function.name}();\n    expect(result).toBeDefined();\n  });`
      );
      const content = getFrameworkTemplate(
        framework,
        describeName,
        blocks,
        importPath,
        functionNames
      );
      contents.push(content);
    }
    return contents;
  }

  async analyzeRisk(result: AnalysisResult): Promise<string> {
    if (!this.client?.analyzeRisk) return "";
    return this.client.analyzeRisk(result);
  }
}

function groupByFile(
  functions: ChangedFunction[]
): Map<string, ChangedFunction[]> {
  const byFile = new Map<string, ChangedFunction[]>();
  for (const cf of functions) {
    const list = byFile.get(cf.file) ?? [];
    list.push(cf);
    byFile.set(cf.file, list);
  }
  return byFile;
}

/** Calculate relative import path from test file to source file (posix style, no extension) */
function calcRelativeImport(testFilePath: string, sourceFilePath: string): string {
  const testDir = dirname(testFilePath);
  let rel = relative(testDir, sourceFilePath).replace(/\\/g, "/");
  // Remove extension for import
  rel = rel.replace(/\.(ts|tsx|js|jsx)$/, "");
  if (!rel.startsWith(".")) rel = "./" + rel;
  return rel;
}

function getFrameworkTemplate(
  framework: TestFramework,
  describeName: string,
  blocks: string[],
  importPath?: string,
  functionNames?: string[]
): string {
  const body = blocks.join("\n\n");
  const sourceImport =
    importPath && functionNames && functionNames.length > 0
      ? `import { ${functionNames.join(", ")} } from "${importPath}";\n`
      : "";

  switch (framework) {
    case "jest":
      return `${sourceImport}\ndescribe("${describeName}", () => {\n${body}\n});\n`;
    case "mocha":
      return `import { expect } from "chai";\n${sourceImport}\ndescribe("${describeName}", () => {\n${body}\n});\n`;
    case "vitest":
    default:
      return `import { describe, it, expect } from "vitest";\n${sourceImport}\ndescribe("${describeName}", () => {\n${body}\n});\n`;
  }
}

/** Get test file path for a source file */
export function getTestFilePath(
  sourceFile: string,
  repoPath?: string
): string {
  const config = loadConfigFromProject(repoPath);
  const suffix = config.test?.suffix ?? ".test";
  const outputDir = config.test?.outputDir ?? "";
  const base = sourceFile.replace(/\.(ts|tsx|js|jsx)$/, "");
  const ext = sourceFile.match(/\.(tsx?|jsx?)$/)?.[1] ?? "ts";
  const dir = dirname(base);
  const name = base.split("/").pop() ?? "index";
  const testDir = outputDir ? join(dir, outputDir) : dir;
  return join(testDir, `${name}${suffix}.${ext}`);
}

export interface GenerateOptions {
  /** Use AI for test generation (auto-resolves provider from config/env) */
  useAI?: boolean;
}

/**
 * Generate test files for changed functions and return TestFile[].
 * When useAI is true, resolves AI client from config/environment.
 */
export async function generateTestFiles(
  functions: ChangedFunction[],
  repoPath?: string,
  options?: GenerateOptions
): Promise<TestFile[]> {
  const config = loadConfigFromProject(repoPath);
  const framework = config.test?.framework ?? "vitest";

  const service = new AIService();

  if (options?.useAI) {
    const client = resolveAIClient(repoPath);
    if (client) {
      service.setClient(client);
    }
  }

  const contents = await service.generateTests(functions, framework, repoPath);
  const byFile = groupByFile(functions);
  const files = Array.from(byFile.keys());

  const result: TestFile[] = [];
  for (let i = 0; i < files.length; i++) {
    const content = contents[i] ?? `// TODO: Add tests for ${files[i]}\n`;
    result.push({
      sourceFile: files[i],
      testFilePath: getTestFilePath(files[i], repoPath),
      content,
    });
  }
  return result;
}

/**
 * Write generated test files to the project
 */
export function writeTestsToProject(
  testFiles: TestFile[],
  repoPath?: string
): string[] {
  const root = repoPath ?? process.cwd();
  const written: string[] = [];
  for (const tf of testFiles) {
    if (!tf.content) continue;
    const fullPath = join(root, tf.testFilePath);
    const dir = dirname(fullPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(fullPath, tf.content, "utf-8");
    written.push(tf.testFilePath);
  }
  return written;
}

const FRAMEWORK_INSTALL_MSG: Record<TestFramework, string> = {
  vitest: `
  테스트 러너가 없습니다. Vitest를 설치하려면:

    pnpm add -D vitest
    # package.json에 추가: "test": "vitest run"
`,
  jest: `
  테스트 러너가 없습니다. Jest를 설치하려면:

    pnpm add -D jest ts-jest @types/jest
    # package.json에 추가: "test": "jest"
`,
  mocha: `
  테스트 러너가 없습니다. Mocha를 설치하려면:

    pnpm add -D mocha chai
    # package.json에 추가: "test": "mocha"
`,
};

/**
 * Run tests in the project (pnpm test or npm test).
 * When no test script exists, returns helpful install message.
 */
export function runTests(repoPath?: string): {
  success: boolean;
  output: string;
  noTestRunner?: boolean;
} {
  const root = repoPath ?? process.cwd();
  const config = loadConfigFromProject(repoPath);
  const framework = config.test?.framework ?? "vitest";

  let result = spawnSync("pnpm", ["test"], {
    cwd: root,
    encoding: "utf-8",
    shell: true,
  });
  if (result.error || result.status === null) {
    result = spawnSync("npm", ["run", "test"], {
      cwd: root,
      encoding: "utf-8",
      shell: true,
    });
  }

  const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
  const noTestRunner =
    result.status !== 0 &&
    (output.includes("Missing script") ||
      output.includes("missing script") ||
      output.includes("ERR!") ||
      output.includes("ENOENT"));

  if (noTestRunner) {
    return {
      success: false,
      output: output + FRAMEWORK_INSTALL_MSG[framework],
      noTestRunner: true,
    };
  }

  return { success: result.status === 0, output };
}

export const aiService = new AIService();
