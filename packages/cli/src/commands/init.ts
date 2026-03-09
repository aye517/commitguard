import { listProjectFunctions } from "@commitguard/core";

export async function init(options: { path?: string }): Promise<void> {
  const projectRoot = options.path ?? process.cwd();

  try {
    console.log("\n🔍 Scanning project...\n");
    const functions = await listProjectFunctions(projectRoot);

    console.log(`Found ${functions.length} functions\n`);
    if (functions.length > 0) {
      const byFile = new Map<string, typeof functions>();
      for (const fn of functions) {
        const list = byFile.get(fn.file) ?? [];
        list.push(fn);
        byFile.set(fn.file, list);
      }
      for (const [file, fns] of byFile) {
        console.log(`  ${file}`);
        for (const fn of fns) {
          console.log(`    - ${fn.name} (${fn.type}) @ L${fn.line}`);
        }
        console.log("");
      }
    }
    console.log("Run 'easytest generate' to create test templates.\n");
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
