import { NextRequest, NextResponse } from "next/server";
import { listProjectFunctions } from "@commitguard/core";
import { join } from "node:path";

export async function GET(request: NextRequest) {
  const pathParam = request.nextUrl.searchParams.get("path");
  const repoPath = pathParam ? join(process.cwd(), pathParam) : process.cwd();

  try {
    const functions = await listProjectFunctions(repoPath);
    return NextResponse.json({ functions });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
