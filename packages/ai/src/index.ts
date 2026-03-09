import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import type { ChangedFunction } from "@commitguard/core";
import { loadConfig, loadConfigFromProject, type TestFramework } from "@commitguard/config";

export interface TestFile {
  sourceFile: string;
  testFilePath: string;
  content: string;
}

export interface AIClient {
  generateTests?(functions: ChangedFunction[]): Promise<string[]>;
  analyzeRisk?(result: import("@commitguard/core").AnalysisResult): Promise<string>;
}

/**
 * AI integration layer - pluggable interface for AI providers.
 * Implement this interface to add OpenAI, Anthropic, or other providers.
 */
export class AIService {
  constructor(private client?: AIClient) {}

  setClient(client: AIClient): void {
    this.client = client;
  }

  async generateTests(functions: ChangedFunction[], framework?: TestFramework): Promise<string[]> {
    if (!this.client?.generateTests) {
      return this.generateTemplateTests(functions, framework);
    }
    return this.client.generateTests(functions);
  }

  /** Basic template when no AI client - framework-specific syntax */
  private generateTemplateTests(
    functions: ChangedFunction[],
    framework: TestFramework = "vitest"
  ): string[] {
    const byFile = new Map<string, ChangedFunction[]>();
    for (const cf of functions) {
      const list = byFile.get(cf.file) ?? [];
      list.push(cf);
      byFile.set(cf.file, list);
    }
    const contents: string[] = [];
    for (const [file, fns] of byFile) {
      const describeName = file.replace(/\.(ts|tsx|js|jsx)$/, "").split("/").pop() ?? "module";
      const blocks = fns
        .filter((f) => f.function.name !== "(anonymous)")
        .map(
          (f) =>
            `  it("${f.function.name}", () => {\n    // TODO: Add tests for ${f.function.name}\n    expect(true).toBe(true);\n  });`
        );
      const content = getFrameworkTemplate(framework, describeName, blocks);
      contents.push(content);
    }
    return contents;
  }

  async analyzeRisk(result: import("@commitguard/core").AnalysisResult): Promise<string> {
    if (!this.client?.analyzeRisk) return "";
    return this.client.analyzeRisk(result);
  }
}

function getFrameworkTemplate(
  framework: TestFramework,
  describeName: string,
  blocks: string[]
): string {
  const body = blocks.join("\n\n");
  switch (framework) {
    case "jest":
      return `describe("${describeName}", () => {\n${body}\n});\n`;
    case "mocha":
      return `import { expect } from "chai";\n\ndescribe("${describeName}", () => {\n${body}\n});\n`;
    case "vitest":
    default:
      return `import { describe, it, expect } from "vitest";\n\ndescribe("${describeName}", () => {\n${body}\n});\n`;
  }
}

/** Get test file path for a source file */
export function getTestFilePath(sourceFile: string, repoPath?: string): string {
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

/**
 * Generate test files for changed functions and return TestFile[]
 */
export async function generateTestFiles(
  functions: ChangedFunction[],
  repoPath?: string
): Promise<TestFile[]> {
  const config = loadConfigFromProject(repoPath);
  const framework = config.test?.framework ?? "vitest";
  const service = new AIService();
  const contents = await service.generateTests(functions, framework);
  const byFile = new Map<string, ChangedFunction[]>();
  for (const cf of functions) {
    const list = byFile.get(cf.file) ?? [];
    list.push(cf);
    byFile.set(cf.file, list);
  }
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

  let result = spawnSync("pnpm", ["test"], { cwd: root, encoding: "utf-8", shell: true });
  if (result.error || result.status === null) {
    result = spawnSync("npm", ["run", "test"], { cwd: root, encoding: "utf-8", shell: true });
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
