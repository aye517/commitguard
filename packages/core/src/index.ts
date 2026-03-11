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
import { loadConfig, loadConfigFromProject } from "@commitguard/config";
import {
  parseFile,
  findFunctions,
  findFunctionsWithRanges,
  analyzeFunctionComplexity,
  type FunctionInfo,
  type FunctionNode,
  type FunctionComplexity,
} from "./ast.js";
import {
  buildCallGraph,
  findImpactedFunctions,
  scanSourceFiles,
} from "./callgraph.js";
import { buildTSCallGraph } from "./tsCallGraph.js";

export { buildCallGraph, buildTSCallGraph, findImpactedFunctions, scanSourceFiles };
export { analyzeFunctionComplexity, type FunctionComplexity };

/** Project function for init/scan */
export interface ProjectFunction {
  name: string;
  file: string;
  line: number;
  type: FunctionInfo["type"];
}

/** Scan project and list all detected functions */
export async function listProjectFunctions(
  projectRoot?: string
): Promise<ProjectFunction[]> {
  const root = projectRoot ?? process.cwd();
  const config = loadConfigFromProject(root);
  const extensions = config.risk?.extensions ?? [".ts", ".tsx", ".js", ".jsx"];
  const files = scanSourceFiles(root);
  const result: ProjectFunction[] = [];

  for (const file of files) {
    const ext = file.slice(file.lastIndexOf("."));
    if (!extensions.includes(ext)) continue;

    const fullPath = join(root, file);
    if (!existsSync(fullPath)) continue;

    const content = readFileSync(fullPath, "utf-8");
    const ast = parseFile(content);
    if (!ast) continue;

    const functions = findFunctions(ast);
    for (const fn of functions) {
      if (fn.name !== "(anonymous)") {
        result.push({
          name: fn.name,
          file,
          line: fn.line,
          type: fn.type,
        });
      }
    }
  }

  return result;
}

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

export type CallGraphEngine = "ast" | "ts";

export interface AnalysisResult {
  changedFiles: string[];
  changedFunctions: ChangedFunction[];
  /** Functions impacted by changes (callers + callees via call graph) */
  impactedFunctions?: string[];
  /** Call graph engine used */
  callGraphEngine?: CallGraphEngine;
  risks: RiskResult[];
  commitMessage?: string;
  commitHash?: string;
}

export interface AnalyzeOptions {
  /** Analyze specific commit (e.g. "HEAD", "abc123", "HEAD~1"). If omitted, uses staged changes. */
  commit?: string;
  /** Call graph engine: "ast" (Babel) or "ts" (TypeScript Compiler API) */
  engine?: CallGraphEngine;
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
  const config = loadConfigFromProject(repoPath);
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

export interface DetectRiskOptions {
  commitMessage?: string;
  /** Complexity data for changed functions (from analyzeFunctionComplexity) */
  complexities?: FunctionComplexity[];
}

export function detectRisk(
  changedFunctions: ChangedFunction[],
  commitMessageOrOptions?: string | DetectRiskOptions
): RiskResult[] {
  const opts: DetectRiskOptions =
    typeof commitMessageOrOptions === "string"
      ? { commitMessage: commitMessageOrOptions }
      : commitMessageOrOptions ?? {};

  const { commitMessage, complexities } = opts;
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

  // Cyclomatic complexity risk
  if (complexities) {
    const highComplexity = complexities.filter((c) => c.complexity >= threshold);
    if (highComplexity.length > 0) {
      risks.push({
        level: "high",
        message: `High complexity functions detected (threshold: ${threshold})`,
        details: highComplexity.map(
          (c) => `${c.name} (complexity: ${c.complexity})`
        ),
      });
    }
  }

  return risks;
}

export async function analyzeCommit(
  repoPath?: string,
  options?: AnalyzeOptions
): Promise<AnalysisResult> {
  const commit = options?.commit;
  const root = repoPath ?? process.cwd();
  const diffs = commit
    ? await getDiffForCommit(commit, repoPath)
    : await getDiff(repoPath);
  const changedFiles = diffs.map((d) => d.file);
  const changedFunctions = await findChangedFunctions(repoPath, diffs);

  const commitMessage = commit
    ? await getCommitMessage(commit, repoPath)
    : await getLastCommitMessage(repoPath);

  // Compute complexity for changed functions
  const allComplexities: FunctionComplexity[] = [];
  const changedFileSet = new Set(changedFunctions.map((cf) => cf.file));
  for (const diff of diffs) {
    if (!changedFileSet.has(diff.file)) continue;
    const fullPath = join(root, diff.file);
    if (!existsSync(fullPath)) continue;
    const content = readFileSync(fullPath, "utf-8");
    const ast = parseFile(content);
    if (!ast) continue;
    const fileComplexities = analyzeFunctionComplexity(ast);
    // Filter to only changed function names in this file
    const changedNames = new Set(
      changedFunctions
        .filter((cf) => cf.file === diff.file)
        .map((cf) => cf.function.name)
    );
    for (const fc of fileComplexities) {
      if (changedNames.has(fc.name)) {
        allComplexities.push(fc);
      }
    }
  }

  const risks = detectRisk(changedFunctions, {
    commitMessage: commitMessage || undefined,
    complexities: allComplexities,
  });

  // Call graph: diff → changed → impacted
  const engine = options?.engine ?? "ast";
  const changedNames = [...new Set(changedFunctions.map((cf) => cf.function.name))];
  const graph = engine === "ts" ? buildTSCallGraph(root) : buildCallGraph(root);

  // Expand changed names for TS engine (graph may use ClassName.methodName)
  const expandedNames = expandChangedNamesForGraph(changedNames, graph);
  const impactedFunctions = findImpactedFunctions(graph, expandedNames);

  return {
    changedFiles,
    changedFunctions,
    impactedFunctions,
    callGraphEngine: engine,
    risks,
    commitMessage: commitMessage || undefined,
    commitHash: commit,
  };
}

function expandChangedNamesForGraph(
  changedNames: string[],
  graph: Map<string, Set<string>>
): string[] {
  const result = new Set(changedNames);
  for (const name of changedNames) {
    for (const key of graph.keys()) {
      if (key === name || key.endsWith(`.${name}`)) {
        result.add(key);
      }
    }
  }
  return [...result];
}
