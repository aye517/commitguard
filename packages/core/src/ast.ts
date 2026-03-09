import * as parser from "@babel/parser";
import traverse, { type NodePath } from "@babel/traverse";
import type {
  File,
  FunctionDeclaration,
  FunctionExpression,
  ArrowFunctionExpression,
  ClassMethod,
} from "@babel/types";

export interface FunctionInfo {
  name: string;
  line: number;
  column: number;
  type: "function" | "arrow" | "method";
}

/** Function with line range for diff matching */
export interface FunctionNode {
  name: string;
  startLine: number;
  endLine: number;
  type: "function" | "arrow" | "method";
}

export function parseFile(content: string, _filename?: string): File | null {
  try {
    return parser.parse(content, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });
  } catch {
    return null;
  }
}

export function findFunctions(ast: File): FunctionInfo[] {
  const functions: FunctionInfo[] = [];

  traverse(ast, {
    FunctionDeclaration(path: NodePath<FunctionDeclaration>) {
      const node = path.node as FunctionDeclaration;
      const name = (node.id?.name ?? "(anonymous)") as string;
      functions.push({
        name,
        line: node.loc?.start.line ?? 0,
        column: node.loc?.start.column ?? 0,
        type: "function",
      });
    },
    FunctionExpression(path: NodePath<FunctionExpression>) {
      const node = path.node as FunctionExpression;
      const parent = path.parent;
      const name =
        parent?.type === "VariableDeclarator" && parent.id.type === "Identifier"
          ? parent.id.name
          : "(anonymous)";
      functions.push({
        name,
        line: node.loc?.start.line ?? 0,
        column: node.loc?.start.column ?? 0,
        type: "function",
      });
    },
    ArrowFunctionExpression(path: NodePath<ArrowFunctionExpression>) {
      const node = path.node as ArrowFunctionExpression;
      const parent = path.parent;
      const name =
        parent?.type === "VariableDeclarator" && parent.id.type === "Identifier"
          ? parent.id.name
          : "(anonymous)";
      functions.push({
        name,
        line: node.loc?.start.line ?? 0,
        column: node.loc?.start.column ?? 0,
        type: "arrow",
      });
    },
    ClassMethod(path: NodePath<ClassMethod>) {
      const node = path.node as ClassMethod;
      const name =
        node.key.type === "Identifier" ? node.key.name : "(anonymous)";
      functions.push({
        name,
        line: node.loc?.start.line ?? 0,
        column: node.loc?.start.column ?? 0,
        type: "method",
      });
    },
  });

  return functions;
}

/** Extract functions with start/end line ranges for diff matching */
export function findFunctionsWithRanges(ast: File): FunctionNode[] {
  const functions: FunctionNode[] = [];

  const addNode = (
    name: string,
    startLine: number,
    endLine: number,
    type: FunctionNode["type"]
  ) => {
    functions.push({ name, startLine, endLine, type });
  };

  traverse(ast, {
    FunctionDeclaration(path: NodePath<FunctionDeclaration>) {
      const node = path.node as FunctionDeclaration;
      const name = (node.id?.name ?? "(anonymous)") as string;
      const start = node.loc?.start.line ?? 0;
      const end = node.loc?.end?.line ?? start;
      addNode(name, start, end, "function");
    },
    FunctionExpression(path: NodePath<FunctionExpression>) {
      const node = path.node as FunctionExpression;
      const parent = path.parent;
      const name =
        parent?.type === "VariableDeclarator" && parent.id.type === "Identifier"
          ? parent.id.name
          : "(anonymous)";
      const start = node.loc?.start.line ?? 0;
      const end = node.loc?.end?.line ?? start;
      addNode(name, start, end, "function");
    },
    ArrowFunctionExpression(path: NodePath<ArrowFunctionExpression>) {
      const node = path.node as ArrowFunctionExpression;
      const parent = path.parent;
      const name =
        parent?.type === "VariableDeclarator" && parent.id.type === "Identifier"
          ? parent.id.name
          : "(anonymous)";
      const start = node.loc?.start.line ?? 0;
      const end = node.loc?.end?.line ?? start;
      addNode(name, start, end, "arrow");
    },
    ClassMethod(path: NodePath<ClassMethod>) {
      const node = path.node as ClassMethod;
      const name =
        node.key.type === "Identifier" ? node.key.name : "(anonymous)";
      const start = node.loc?.start.line ?? 0;
      const end = node.loc?.end?.line ?? start;
      addNode(name, start, end, "method");
    },
  });

  return functions;
}
