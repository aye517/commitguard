import { createInterface } from "node:readline";
import {
  analyzeCommit,
  listProjectFunctions,
  type ChangedFunction,
  type ProjectFunction,
} from "@commitguard/core";
import {
  generateTestFiles,
  writeTestsToProject,
  runTests,
} from "@commitguard/ai";

function askConfirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === "y" || normalized === "yes" || normalized === "");
    });
  });
}

export async function generate(options: {
  path?: string;
  commit?: string;
  run?: boolean;
  all?: boolean;
  yes?: boolean;
  ai?: boolean;
}): Promise<void> {
  const repoPath = options.path ?? process.cwd();
  const commit = options.commit;
  const run = options.run ?? false;
  const all = options.all ?? false;
  const yes = options.yes ?? false;
  const useAI = options.ai ?? false;

  try {
    let changedFunctions: ChangedFunction[];

    if (all) {
      const projectFunctions = await listProjectFunctions(repoPath);
      changedFunctions = projectFunctions.map((pf) => ({
        file: pf.file,
        function: { name: pf.name, line: pf.line, column: 0, type: pf.type },
      }));
      if (changedFunctions.length === 0) {
        console.log("\n⚠️ No functions found in project.\n");
        return;
      }
      console.log(`\n📦 Found ${changedFunctions.length} functions.\n`);
    } else {
      const result = await analyzeCommit(repoPath, { commit });
      changedFunctions = result.changedFunctions;
      if (changedFunctions.length === 0) {
        console.log("\n⚠️ No changed functions. Use --all to generate for all functions.\n");
        return;
      }
      console.log(`\n📝 Found ${changedFunctions.length} changed function(s).\n`);
    }

    const preview = changedFunctions
      .slice(0, 5)
      .map((cf) => `  - ${cf.function.name} (${cf.file})`)
      .join("\n");
    const more = changedFunctions.length > 5 ? `\n  ... and ${changedFunctions.length - 5} more` : "";

    if (!yes) {
      if (!process.stdin.isTTY) {
        console.log("Non-interactive mode. Use --yes to skip confirmation.\n");
        return;
      }
      const confirmed = await askConfirm(
        `Generate tests for these functions?\n${preview}${more}\n\n(y/n) [y]: `
      );
      if (!confirmed) {
        console.log("Cancelled.\n");
        return;
      }
    }

    const modeLabel = useAI ? "🤖 Generating tests with AI..." : "📝 Generating tests...";
    console.log(`\n${modeLabel}\n`);
    const testFiles = await generateTestFiles(changedFunctions, repoPath, { useAI });
    const written = writeTestsToProject(testFiles, repoPath);

    console.log("Created:");
    written.forEach((f) => console.log(`  + ${f}`));

    if (run && written.length > 0) {
      console.log("\n🧪 Running tests...\n");
      const { success, output, noTestRunner } = runTests(repoPath);
      console.log(output);
      if (noTestRunner) {
        console.log("💡 Add \"commitguard\": { \"test\": { \"framework\": \"vitest\" } } to package.json to specify a test runner.\n");
      }
      if (!success) {
        process.exit(1);
      }
    }

    console.log("");
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
