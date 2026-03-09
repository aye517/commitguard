#!/usr/bin/env node
import { Command } from "commander";
import { analyze } from "./commands/analyze.js";
import { generate } from "./commands/generate.js";

const program = new Command();

program
  .name("commitguard")
  .description("Analyze commits, generate tests, and run them")
  .version("0.1.0");

program
  .command("analyze")
  .description("Analyze staged changes or a specific commit")
  .option("-p, --path <path>", "Repository path (default: cwd)")
  .option("-c, --commit <hash>", "Analyze specific commit (e.g. HEAD, abc123, HEAD~1)")
  .action(analyze);

program
  .command("generate")
  .description("Generate test files for changed functions and optionally run tests")
  .option("-p, --path <path>", "Repository path (default: cwd)")
  .option("-c, --commit <hash>", "Use specific commit (default: staged changes)")
  .option("-r, --run", "Run tests after generating")
  .action(generate);

program.parse();
