import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  getDiff,
  getDiffForCommit,
  getCommitMessage,
  getLastCommitMessage,
  parseDiffLines,
  type DiffResult,
  type DiffFile,
} from "@commitguard/git";
import { loadConfig } from "@commitguard/config";
import {
  parseFile,
  findFunctionsWithRanges,
  type FunctionInfo,
  type FunctionNode,
} from "./ast.js";

export interface ChangedFunction {
  file: string;
  function: FunctionInfo;
}

/** Result of diff-aware detection (function with line range) */
export interface DetectedChangedFunction {
  name: string;
  filePath: string;
  startLine: number;
  endLine: number;
  type: FunctionNode["type"];
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
  commitHash?: string;
}

export interface AnalyzeOptions {
  /** Analyze specific commit (e.g. "HEAD", "abc123", "HEAD~1"). If omitted, uses staged changes. */
  commit?: string;
}

/**
 * Match diff lines with function ranges.
 * Returns unique list of functions that contain added/removed lines.
 */
export function detectChangedFunctions(
  diffFiles: DiffFile[],
  fileFunctions: Map<string, FunctionNode[]>
): DetectedChangedFunction[] {
  const results: DetectedChangedFunction[] = [];

  for (const diffFile of diffFiles) {
    if (diffFile.filePath.includes("node_modules")) continue;

    const functions = fileFunctions.get(diffFile.filePath) ?? [];
    const allDiffLines = [...diffFile.addedLines, ...diffFile.removedLines];

    for (const line of allDiffLines) {
      const match = functions.find(
        (fn) => line >= fn.startLine && line <= fn.endLine
      );
      if (match) {
        results.push({
          name: match.name,
          filePath: diffFile.filePath,
          startLine: match.startLine,
          endLine: match.endLine,
          type: match.type,
        });
      }
    }
  }

  return uniqueFunctions(results);
}

function uniqueFunctions(
  list: DetectedChangedFunction[]
): DetectedChangedFunction[] {
  const map = new Map<string, DetectedChangedFunction>();
  for (const fn of list) {
    const key = `${fn.filePath}:${fn.name}:${fn.startLine}`;
    if (!map.has(key)) {
      map.set(key, fn);
    }
  }
  return [...map.values()];
}

export async function findChangedFunctions(
  repoPath?: string,
  diffs?: DiffResult[]
): Promise<ChangedFunction[]> {
  const config = loadConfig({ repoPath });
  const diffList = diffs ?? (await getDiff(repoPath));
  const extensions = config.risk?.extensions ?? [".ts", ".tsx", ".js", ".jsx"];

  // Diff-aware: parse line numbers and match with function ranges
  const diffFiles = parseDiffLines(diffList);
  const fileFunctions = new Map<string, FunctionNode[]>();

  for (const diff of diffList) {
    const ext = diff.file.slice(diff.file.lastIndexOf("."));
    if (!extensions.includes(ext)) continue;
    if (diff.file.includes("node_modules")) continue;

    const fullPath = repoPath ? join(repoPath, diff.file) : join(process.cwd(), diff.file);
    if (!existsSync(fullPath)) continue;

    const content = readFileSync(fullPath, "utf-8");
    const ast = parseFile(content);
    if (!ast) continue;

    const functions = findFunctionsWithRanges(ast);
    fileFunctions.set(diff.file, functions);
  }

  const detected = detectChangedFunctions(diffFiles, fileFunctions);

  // Map back to ChangedFunction format (with FunctionInfo)
  return detected.map((d) => ({
    file: d.filePath,
    function: {
      name: d.name,
      line: d.startLine,
      column: 0,
      type: d.type,
    } as FunctionInfo,
  }));
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

export async function analyzeCommit(
  repoPath?: string,
  options?: AnalyzeOptions
): Promise<AnalysisResult> {
  const commit = options?.commit;
  const diffs = commit
    ? await getDiffForCommit(commit, repoPath)
    : await getDiff(repoPath);
  const changedFiles = diffs.map((d) => d.file);
  const changedFunctions = await findChangedFunctions(repoPath, diffs);

  const commitMessage = commit
    ? await getCommitMessage(commit, repoPath)
    : await getLastCommitMessage(repoPath);
  const risks = detectRisk(changedFunctions, commitMessage);

  return {
    changedFiles,
    changedFunctions,
    risks,
    commitMessage: commitMessage || undefined,
    commitHash: commit,
  };
}
