import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import * as parser from "@babel/parser";
import traverse, { type NodePath } from "@babel/traverse";
import type {
  CallExpression,
  FunctionDeclaration,
  FunctionExpression,
  ArrowFunctionExpression,
  ClassMethod,
} from "@babel/types";

const IGNORE_DIRS = new Set(["node_modules", "dist", ".next", ".turbo", "coverage"]);
const SOURCE_EXTENSIONS = [".ts", ".tsx"];

/** Scan project for source files */
export function scanSourceFiles(projectRoot: string): string[] {
  const files: string[] = [];

  function walk(dir: string) {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      const rel = relative(projectRoot, full);
      if (e.isDirectory()) {
        if (!IGNORE_DIRS.has(e.name) && !rel.includes("node_modules")) {
          walk(full);
        }
      } else if (e.isFile()) {
        const ext = e.name.slice(e.name.lastIndexOf("."));
        if (SOURCE_EXTENSIONS.includes(ext)) {
          if (!rel.includes("node_modules") && !/\.(test|spec)\.(ts|tsx)$/.test(e.name)) {
            files.push(rel);
          }
        }
      }
    }
  }

  walk(projectRoot);
  return files;
}

function addEdge(
  graph: Map<string, Set<string>>,
  caller: string,
  callee: string
): void {
  if (!caller || caller === "(anonymous)" || !callee) return;
  if (!graph.has(caller)) {
    graph.set(caller, new Set());
  }
  graph.get(caller)!.add(callee);
}

function getCalleeName(path: NodePath<CallExpression>): string | null {
  const callee = path.node.callee;
  if (callee.type === "Identifier") {
    return callee.name;
  }
  if (callee.type === "MemberExpression") {
    const prop = callee.property;
    if (prop.type === "Identifier") {
      return prop.name;
    }
  }
  return null;
}

function getFunctionName(
  path: NodePath<FunctionDeclaration | FunctionExpression | ArrowFunctionExpression | ClassMethod>
): string {
  const node = path.node;
  if (node.type === "FunctionDeclaration" && node.id?.type === "Identifier") {
    return node.id.name;
  }
  if (node.type === "ClassMethod" && node.key.type === "Identifier") {
    return node.key.name;
  }
  if (node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") {
    const parent = path.parent;
    if (parent?.type === "VariableDeclarator" && parent.id.type === "Identifier") {
      return parent.id.name;
    }
  }
  return "(anonymous)";
}

/**
 * Build call graph: caller -> Set<callee>
 */
export function buildCallGraph(projectRoot: string): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  const files = scanSourceFiles(projectRoot);

  for (const filePath of files) {
    const fullPath = join(projectRoot, filePath);
    if (!existsSync(fullPath)) continue;

    const content = readFileSync(fullPath, "utf-8");
    let ast;
    try {
      ast = parser.parse(content, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
      });
    } catch {
      continue;
    }

    const functionStack: string[] = [];

    traverse(ast, {
      FunctionDeclaration: {
        enter(path: NodePath<FunctionDeclaration>) {
          functionStack.push(getFunctionName(path as NodePath<FunctionDeclaration>));
        },
        exit() {
          functionStack.pop();
        },
      },
      FunctionExpression: {
        enter(path: NodePath<FunctionExpression>) {
          functionStack.push(getFunctionName(path as NodePath<FunctionExpression>));
        },
        exit() {
          functionStack.pop();
        },
      },
      ArrowFunctionExpression: {
        enter(path: NodePath<ArrowFunctionExpression>) {
          functionStack.push(getFunctionName(path as NodePath<ArrowFunctionExpression>));
        },
        exit() {
          functionStack.pop();
        },
      },
      ClassMethod: {
        enter(path: NodePath<ClassMethod>) {
          functionStack.push(getFunctionName(path as NodePath<ClassMethod>));
        },
        exit() {
          functionStack.pop();
        },
      },
      CallExpression(path: NodePath<CallExpression>) {
        const callee = getCalleeName(path);
        if (callee) {
          const caller = functionStack[functionStack.length - 1];
          if (caller) {
            addEdge(graph, caller, callee);
          }
        }
      },
    });
  }

  return graph;
}

/**
 * Find all functions impacted by the changed functions.
 * Includes: changed + all callers (transitive) + all callees (transitive)
 */
export function findImpactedFunctions(
  graph: Map<string, Set<string>>,
  changedFunctions: string[]
): string[] {
  const visited = new Set<string>();

  // Forward: callees (functions that changed calls)
  const stack = [...changedFunctions];
  while (stack.length > 0) {
    const fn = stack.pop()!;
    if (visited.has(fn)) continue;
    visited.add(fn);

    const callees = graph.get(fn);
    if (callees) {
      for (const callee of callees) {
        if (!visited.has(callee)) {
          stack.push(callee);
        }
      }
    }
  }

  // Build reverse graph: callee -> callers
  const reverseGraph = new Map<string, Set<string>>();
  for (const [caller, callees] of graph) {
    for (const callee of callees) {
      if (!reverseGraph.has(callee)) {
        reverseGraph.set(callee, new Set());
      }
      reverseGraph.get(callee)!.add(caller);
    }
  }

  // Backward: callers (functions that call changed)
  const callerStack = [...changedFunctions];
  while (callerStack.length > 0) {
    const fn = callerStack.pop()!;
    if (!visited.has(fn)) {
      visited.add(fn);
    }
    const callers = reverseGraph.get(fn);
    if (callers) {
      for (const caller of callers) {
        if (!visited.has(caller)) {
          callerStack.push(caller);
        }
      }
    }
  }

  return [...visited];
}
