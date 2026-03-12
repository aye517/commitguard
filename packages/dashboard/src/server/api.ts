import { listProjectFunctions, analyzeCommit, analyzeFunctionComplexity } from "@commitguard/core";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface ApiRequest {
  method: string;
  path: string;
  query: Record<string, string>;
  body?: unknown;
}

export interface ApiResponse {
  status: number;
  body: unknown;
}

/**
 * Handle an API request under /__commit-guard-lab/api/*
 * Returns { status, body } to be serialized as JSON.
 */
export async function handleApiRequest(
  req: ApiRequest,
  repoPath?: string
): Promise<ApiResponse> {
  const root = repoPath ?? process.cwd();

  try {
    if (req.path === "/overview" && req.method === "GET") {
      return await handleOverview(root);
    }

    return { status: 404, body: { error: "Not found" } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: 500, body: { error: message } };
  }
}

async function handleOverview(root: string): Promise<ApiResponse> {
  const functions = await listProjectFunctions(root);

  // Compute average complexity across all files
  const processedFiles = new Set<string>();
  const allComplexityValues: number[] = [];

  // Dynamic import for parseFile since it's not exported from core index
  // We use analyzeFunctionComplexity which is exported
  for (const fn of functions) {
    if (processedFiles.has(fn.file)) continue;
    processedFiles.add(fn.file);

    const fullPath = join(root, fn.file);
    if (!existsSync(fullPath)) continue;

    try {
      const content = readFileSync(fullPath, "utf-8");
      // Parse via Babel and get complexity — use the re-exported function
      // analyzeFunctionComplexity needs an AST, but parseFile is internal.
      // We import it dynamically to avoid deep coupling.
      const { parseFile } = await import("@commitguard/core/dist/ast.js");
      const ast = parseFile(content);
      if (!ast) continue;
      const complexities = analyzeFunctionComplexity(ast);
      for (const c of complexities) {
        allComplexityValues.push(c.complexity);
      }
    } catch {
      // skip unparseable files
    }
  }

  const avgComplexity =
    allComplexityValues.length > 0
      ? Math.round(
          (allComplexityValues.reduce((a, b) => a + b, 0) /
            allComplexityValues.length) *
            10
        ) / 10
      : 0;

  // Last commit analysis
  let lastCommit = null;
  try {
    const analysis = await analyzeCommit(root, { commit: "HEAD" });
    lastCommit = {
      hash: analysis.commitHash ?? "HEAD",
      message: analysis.commitMessage ?? "",
      changedFiles: analysis.changedFiles.length,
      changedFunctions: analysis.changedFunctions.length,
      risks: analysis.risks.length,
    };
  } catch {
    // no git or empty repo
  }

  return {
    status: 200,
    body: {
      totalFunctions: functions.length,
      totalTests: 0,
      coverage: 0,
      avgComplexity,
      lastCommit,
    },
  };
}
