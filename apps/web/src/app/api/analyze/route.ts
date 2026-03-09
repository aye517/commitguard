import { NextRequest, NextResponse } from "next/server";
import { analyzeCommit } from "@commitguard/core";
import { join } from "node:path";

export async function GET(request: NextRequest) {
  const pathParam = request.nextUrl.searchParams.get("path");
  const commit = request.nextUrl.searchParams.get("commit") ?? "HEAD";
  const engine = (request.nextUrl.searchParams.get("engine") ?? "ast") as "ast" | "ts";

  const repoPath = pathParam
    ? join(process.cwd(), pathParam)
    : process.cwd();

  try {
    const result = await analyzeCommit(repoPath, { commit, engine });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
