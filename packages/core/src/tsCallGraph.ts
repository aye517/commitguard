import ts from "typescript";
import { join } from "node:path";
import { scanSourceFiles } from "./callgraph.js";

const BUILTIN_PREFIXES = ["Array.", "String.", "Object.", "Number.", "Map.", "Set.", "Promise.", "JSON.", "Math.", "Date.", "RegExp.", "global.", "parseInt", "parseFloat", "isNaN", "encodeURI", "decodeURI"];

function isBuiltin(name: string): boolean {
  return BUILTIN_PREFIXES.some((p) => name === p || name.startsWith(p));
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

function getFunctionName(node: ts.Node): string | null {
  if (ts.isFunctionDeclaration(node) && node.name) {
    return node.name.getText();
  }
  if (ts.isMethodDeclaration(node) && node.name) {
    const parent = node.parent;
    if (ts.isClassDeclaration(parent) && parent.name) {
      return `${parent.name.getText()}.${node.name.getText()}`;
    }
    return node.name.getText();
  }
  if (ts.isArrowFunction(node)) {
    const parent = node.parent;
    if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
      return parent.name.getText();
    }
    if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
      const classParent = parent.parent?.parent;
      if (classParent && ts.isClassDeclaration(classParent) && classParent.name) {
        return `${classParent.name.getText()}.${parent.name.getText()}`;
      }
      return parent.name.getText();
    }
  }
  if (ts.isFunctionExpression(node)) {
    const parent = node.parent;
    if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
      return parent.name.getText();
    }
  }
  return null;
}

/**
 * Build call graph using TypeScript Compiler API for type-aware resolution.
 * Resolves service.method() to ClassName.methodName.
 */
export function buildTSCallGraph(projectRoot: string): Map<string, Set<string>> {
  const relativeFiles = scanSourceFiles(projectRoot);
  const files = relativeFiles.map((f) => join(projectRoot, f));

  if (files.length === 0) {
    return new Map();
  }

  const program = ts.createProgram(files, {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    skipLibCheck: true,
  });

  const checker = program.getTypeChecker();
  const graph = new Map<string, Set<string>>();
  const functionStack: string[] = [];

  function visit(node: ts.Node) {
    let pushed = false;
    if (ts.isFunctionDeclaration(node)) {
      const name = getFunctionName(node);
      if (name) {
        functionStack.push(name);
        pushed = true;
      }
    } else if (ts.isMethodDeclaration(node)) {
      const name = getFunctionName(node);
      if (name) {
        functionStack.push(name);
        pushed = true;
      }
    } else if (ts.isArrowFunction(node)) {
      const name = getFunctionName(node);
      if (name) {
        functionStack.push(name);
        pushed = true;
      }
    } else if (ts.isFunctionExpression(node)) {
      const name = getFunctionName(node);
      if (name) {
        functionStack.push(name);
        pushed = true;
      }
    }

    if (ts.isCallExpression(node)) {
      const symbol = checker.getSymbolAtLocation(node.expression);
      if (symbol) {
        const callee = checker.getFullyQualifiedName(symbol);
        const caller = functionStack[functionStack.length - 1] ?? "(global)";
        if (callee && !callee.startsWith('"') && !isBuiltin(callee)) {
          addEdge(graph, caller, callee);
        }
      }
    }

    ts.forEachChild(node, visit);

    if (pushed) {
      functionStack.pop();
    }
  }

  for (const file of files) {
    const sourceFile = program.getSourceFile(file);
    if (sourceFile && !sourceFile.isDeclarationFile) {
      visit(sourceFile);
    }
  }

  return graph;
}
