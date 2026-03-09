import { analyzeCommit } from "@commitguard/core";

export async function analyze(options: {
  path?: string;
  commit?: string;
  engine?: "ast" | "ts";
}): Promise<void> {
  const repoPath = options.path;
  const commit = options.commit;
  const engine = options.engine ?? "ast";

  try {
    const result = await analyzeCommit(repoPath, { commit, engine });

    console.log("\n📋 CommitGuard Analysis\n");
    if (result.callGraphEngine === "ts") {
      console.log("Call Graph Engine: TypeScript Compiler\n");
    }
    console.log("Changed files:", result.changedFiles.length);
    result.changedFiles.forEach((f) => console.log(`  - ${f}`));

    console.log("\nChanged functions:", result.changedFunctions.length);
    result.changedFunctions.forEach((cf) => {
      console.log(`  - ${cf.file}:${cf.function.name} (${cf.function.type}) @ L${cf.function.line}`);
    });

    if (result.impactedFunctions && result.impactedFunctions.length > 0) {
      console.log("\nImpacted functions (call graph):", result.impactedFunctions.length);
      result.impactedFunctions.forEach((fn) => console.log(`  - ${fn}`));
    }

    console.log("\nRisks:", result.risks.length);
    result.risks.forEach((r) => {
      const icon = r.level === "high" ? "🔴" : r.level === "medium" ? "🟡" : "🟢";
      console.log(`  ${icon} [${r.level}] ${r.message}`);
      r.details?.forEach((d) => console.log(`      ${d}`));
    });

    if (result.commitMessage) {
      const label = commit ? `Commit ${commit} message` : "Last commit message";
      console.log(`\n${label}:`, result.commitMessage.slice(0, 80) + (result.commitMessage.length > 80 ? "..." : ""));
    }

    console.log("");
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
