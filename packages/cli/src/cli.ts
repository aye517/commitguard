#!/usr/bin/env node
import { Command } from "commander";
import { init } from "./commands/init.js";
import { check } from "./commands/check.js";
import { generate } from "./commands/generate.js";
import { analyze } from "./commands/analyze.js";

const program = new Command();

program
  .name("easytest")
  .description("A developer tool that makes it easy to start testing")
  .version("0.1.0");

program
  .command("init")
  .description("Scan project and list detected functions")
  .option("-p, --path <path>", "Project path (default: cwd)")
  .action(init);

program
  .command("check")
  .description("Show recommended tests for changed code")
  .option("-p, --path <path>", "Repository path (default: cwd)")
  .option("-c, --commit <hash>", "Check specific commit (e.g. HEAD, abc123)")
  .option("-e, --engine <engine>", "Call graph engine: ast | ts (default: ast)")
  .action(check);

program
  .command("generate")
  .description("Generate test files and optionally run tests")
  .option("-p, --path <path>", "Project path (default: cwd)")
  .option("-c, --commit <hash>", "Use specific commit (default: staged changes)")
  .option("-r, --run", "Run tests after generating")
  .option("-a, --all", "Generate for all functions (not just changed)")
  .option("-y, --yes", "Skip confirmation prompt (for CI/scripts)")
  .option("--ai", "Use AI (Claude) for intelligent test generation")
  .action(generate);

program
  .command("analyze")
  .description("(Legacy) Analyze staged changes or a specific commit")
  .option("-p, --path <path>", "Repository path (default: cwd)")
  .option("-c, --commit <hash>", "Analyze specific commit (e.g. HEAD, abc123, HEAD~1)")
  .option("-e, --engine <engine>", "Call graph engine: ast | ts (default: ast)")
  .action(analyze);

program.parse();
