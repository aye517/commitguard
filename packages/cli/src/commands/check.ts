import { analyzeCommit } from "@commitguard/core";

export async function check(options: {
  path?: string;
  commit?: string;
  engine?: "ast" | "ts";
}): Promise<void> {
  const repoPath = options.path;
  const commit = options.commit ?? "HEAD";
  const engine = options.engine ?? "ast";

  try {
    const result = await analyzeCommit(repoPath, { commit, engine });

    console.log("\n📋 EasyTest Check\n");

    if (result.changedFunctions.length === 0) {
      console.log("No changed functions detected.\n");
      return;
    }

    console.log("Changed:");
    result.changedFunctions.forEach((cf) => {
      console.log(`  - ${cf.function.name} (${cf.file})`);
    });

    if (result.impactedFunctions && result.impactedFunctions.length > 0) {
      console.log("\nAffected:");
      result.impactedFunctions.forEach((fn) => console.log(`  - ${fn}`));
    }

    if (result.risks.length > 0) {
      console.log("\nRisk level:");
      const maxRisk = result.risks.some((r) => r.level === "high")
        ? "High"
        : result.risks.some((r) => r.level === "medium")
          ? "Medium"
          : "Low";
      console.log(`  ${maxRisk}\n`);
      result.risks.forEach((r) => {
        const icon = r.level === "high" ? "🔴" : r.level === "medium" ? "🟡" : "🟢";
        console.log(`  ${icon} ${r.message}`);
      });
    }

    console.log("\nRecommended tests:");
    const testFiles = [
      ...new Set(
        result.changedFunctions.map((cf) => {
          const base = cf.file.replace(/\.(ts|tsx|js|jsx)$/, "");
          return `${base}.test.${cf.file.slice(cf.file.lastIndexOf(".") + 1)}`;
        })
      ),
    ];
    testFiles.forEach((f) => console.log(`  - ${f}`));

    console.log("\nRun 'easytest generate' to create or update tests.\n");
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
