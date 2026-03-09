import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getDiff, type DiffResult } from "@commitguard/git";
import { loadConfig } from "@commitguard/config";
import { parseFile, findFunctions, type FunctionInfo } from "./ast.js";

export interface ChangedFunction {
  file: string;
  function: FunctionInfo;
}

export interface RiskResult {
  level: "low" | "medium" | "high";
  message: string;
  details?: string[];
}

export interface AnalysisResult {
  changedFiles: string[];
  changedFunctions: ChangedFunction[];
  risks: RiskResult[];
  commitMessage?: string;
}

export async function findChangedFunctions(repoPath?: string): Promise<ChangedFunction[]> {
  const config = loadConfig({ repoPath });
  const diffs = await getDiff(repoPath);
  const changedFunctions: ChangedFunction[] = [];
  const extensions = config.risk?.extensions ?? [".ts", ".tsx", ".js", ".jsx"];

  for (const diff of diffs) {
    const ext = diff.file.slice(diff.file.lastIndexOf("."));
    if (!extensions.includes(ext)) continue;

    const fullPath = repoPath ? join(repoPath, diff.file) : join(process.cwd(), diff.file);
    if (!existsSync(fullPath)) continue;

    const content = readFileSync(fullPath, "utf-8");
    const ast = parseFile(content);
    if (!ast) continue;

    const functions = findFunctions(ast);
    for (const fn of functions) {
      changedFunctions.push({ file: diff.file, function: fn });
    }
  }

  return changedFunctions;
}

export function detectRisk(
  changedFunctions: ChangedFunction[],
  commitMessage?: string
): RiskResult[] {
  const risks: RiskResult[] = [];
  const config = loadConfig();
  const threshold = config.risk?.complexityThreshold ?? 10;

  if (changedFunctions.length > 5) {
    risks.push({
      level: "medium",
      message: `Many functions changed (${changedFunctions.length})`,
      details: changedFunctions.map((cf) => `${cf.file}:${cf.function.name}`),
    });
  }

  if (commitMessage && commitMessage.length < 10) {
    risks.push({
      level: "low",
      message: "Commit message is very short",
    });
  }

  if (changedFunctions.some((cf) => cf.function.name === "(anonymous)")) {
    risks.push({
      level: "low",
      message: "Anonymous functions detected - consider naming for better traceability",
    });
  }

  return risks;
}

export async function analyzeCommit(repoPath?: string): Promise<AnalysisResult> {
  const diffs = await getDiff(repoPath);
  const changedFiles = diffs.map((d) => d.file);
  const changedFunctions = await findChangedFunctions(repoPath);

  const { getLastCommitMessage } = await import("@commitguard/git");
  const commitMessage = await getLastCommitMessage(repoPath);
  const risks = detectRisk(changedFunctions, commitMessage);

  return {
    changedFiles,
    changedFunctions,
    risks,
    commitMessage: commitMessage || undefined,
  };
}
