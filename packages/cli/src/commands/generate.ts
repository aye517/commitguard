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

export async function generate(options: {
  path?: string;
  commit?: string;
  run?: boolean;
  all?: boolean;
}): Promise<void> {
  const repoPath = options.path ?? process.cwd();
  const commit = options.commit;
  const run = options.run ?? false;
  const all = options.all ?? false;

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
      console.log(`\n📦 Generating tests for ${changedFunctions.length} functions...\n`);
    } else {
      const result = await analyzeCommit(repoPath, { commit });
      changedFunctions = result.changedFunctions;
      if (changedFunctions.length === 0) {
        console.log("\n⚠️ No changed functions. Use --all to generate for all functions.\n");
        return;
      }
      console.log(`\n📝 Generating tests for ${changedFunctions.length} changed function(s)...\n`);
    }

    const testFiles = await generateTestFiles(changedFunctions, repoPath);
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
