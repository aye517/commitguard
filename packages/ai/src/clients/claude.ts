import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { AIClient, GenerateTestsContext } from "../types.js";

export class ClaudeClient implements AIClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model ?? "claude-sonnet-4-20250514";
  }

  async generateTests(context: GenerateTestsContext): Promise<string[]> {
    const { functionsByFile, framework, repoPath } = context;
    const results: string[] = [];

    for (const [file, functions] of functionsByFile) {
      const sourceCode = readSourceFile(file, repoPath);
      const functionNames = functions
        .map((f) => f.function.name)
        .filter((n) => n !== "(anonymous)");

      if (functionNames.length === 0) continue;

      const prompt = buildPrompt(file, sourceCode, functionNames, framework);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("");

      results.push(extractCode(text));
    }

    return results;
  }
}

function readSourceFile(
  filePath: string,
  repoPath?: string
): string | undefined {
  const root = repoPath ?? process.cwd();
  const fullPath = join(root, filePath);
  if (!existsSync(fullPath)) return undefined;
  return readFileSync(fullPath, "utf-8");
}

function buildPrompt(
  file: string,
  sourceCode: string | undefined,
  functionNames: string[],
  framework: string
): string {
  const sourceSection = sourceCode
    ? `\n## Source code (${file}):\n\`\`\`\n${sourceCode}\n\`\`\``
    : `\n## File: ${file}`;

  return `You are a test code generator. Generate ${framework} tests for the following functions.

## Requirements:
- Framework: ${framework}
- Test each function with: happy path, edge cases (null, undefined, empty, boundary values)
- Import the functions from the relative source file path
- Use descriptive test names in English
- Only output the test code, no explanations
- Do NOT wrap the output in markdown code fences
${sourceSection}

## Functions to test:
${functionNames.map((n) => `- ${n}`).join("\n")}

Generate the complete test file:`;
}

function extractCode(text: string): string {
  // Remove markdown code fences if present
  const fenceMatch = text.match(/```(?:typescript|ts|javascript|js)?\s*\n([\s\S]*?)\n```/);
  if (fenceMatch) return fenceMatch[1].trim();
  return text.trim();
}
