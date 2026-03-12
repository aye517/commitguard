import { NextRequest, NextResponse } from "next/server";
import { listProjectFunctions, type ChangedFunction } from "@commitguard/core";
import { generateTestFiles, writeTestsToProject } from "@commitguard/ai";
import { join } from "node:path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path: pathParam, filter, functions: selectedFunctions, ai } = body as {
      path?: string;
      filter?: string;
      functions?: { file: string; name: string; line: number; type: string }[];
      ai?: boolean;
    };

    const repoPath = pathParam ? join(process.cwd(), pathParam) : process.cwd();

    let changedFunctions: ChangedFunction[];

    if (selectedFunctions && selectedFunctions.length > 0) {
      // Use explicitly selected functions from UI
      changedFunctions = selectedFunctions.map((f) => ({
        file: f.file,
        function: { name: f.name, line: f.line, column: 0, type: f.type as ChangedFunction["function"]["type"] },
      }));
    } else {
      // Scan all with optional filter
      const projectFunctions = await listProjectFunctions(repoPath, filter);
      changedFunctions = projectFunctions.map((pf) => ({
        file: pf.file,
        function: { name: pf.name, line: pf.line, column: 0, type: pf.type },
      }));
    }

    if (changedFunctions.length === 0) {
      return NextResponse.json({ error: "No functions found", generated: [] }, { status: 400 });
    }

    const testFiles = await generateTestFiles(changedFunctions, repoPath, { useAI: ai ?? false });
    const written = writeTestsToProject(testFiles, repoPath);

    return NextResponse.json({
      generated: written,
      count: written.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
