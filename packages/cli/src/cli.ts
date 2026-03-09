#!/usr/bin/env node
import { Command } from "commander";
import { analyze } from "./commands/analyze.js";

const program = new Command();

program
  .name("commitguard")
  .description("Analyze commits for risk and changed code")
  .version("0.1.0");

program
  .command("analyze")
  .description("Analyze staged changes and detect risks")
  .option("-p, --path <path>", "Repository path (default: cwd)")
  .action(analyze);

program.parse();
