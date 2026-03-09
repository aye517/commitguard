import { analyzeCommit } from "@commitguard/core";
import {
  generateTestFiles,
  writeTestsToProject,
  runTests,
} from "@commitguard/ai";

export async function generate(options: {
  path?: string;
  commit?: string;
  run?: boolean;
}): Promise<void> {
  const repoPath = options.path;
  const commit = options.commit;
  const run = options.run ?? false;

  try {
    const result = await analyzeCommit(repoPath, { commit });

    if (result.changedFunctions.length === 0) {
      console.log("\n⚠️ No changed functions to generate tests for.\n");
      return;
    }

    const testFiles = await generateTestFiles(result.changedFunctions, repoPath);
    const written = writeTestsToProject(testFiles, repoPath);

    console.log("\n📝 Generated test files:\n");
    written.forEach((f) => console.log(`  + ${f}`));

    if (run && written.length > 0) {
      console.log("\n🧪 Running tests...\n");
      const { success, output, noTestRunner } = runTests(repoPath);
      console.log(output);
      if (noTestRunner) {
        console.log("💡 package.json에 \"commitguard\": { \"test\": { \"framework\": \"vitest\" } } 를 추가하면 테스트 러너를 지정할 수 있습니다.\n");
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
