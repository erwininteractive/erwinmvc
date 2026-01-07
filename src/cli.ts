#!/usr/bin/env node

import { Command } from "commander";
import { initApp } from "./generators/initApp";
import { generateModel } from "./generators/generateModel";
import { generateController } from "./generators/generateController";

const program = new Command();

program
  .name("erwinmvc")
  .description("CLI for @erwininteractive/mvc framework")
  .version("0.1.1");

// Init command - scaffold a new application
program
  .command("init <dir>")
  .description("Scaffold a new MVC application")
  .option("--skip-install", "Skip npm install")
  .option("--with-database", "Include database/Prisma setup")
  .action(async (dir: string, options: { skipInstall?: boolean; withDatabase?: boolean }) => {
    try {
      await initApp(dir, options);
    } catch (err) {
      console.error("Error:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

// Generate command group
const generate = program
  .command("generate")
  .alias("g")
  .description("Generate models or controllers");

// Generate model
generate
  .command("model <name>")
  .description("Generate a Prisma model")
  .option("--skip-migrate", "Skip running Prisma migrate")
  .action(async (name: string, options: { skipMigrate?: boolean }) => {
    try {
      await generateModel(name, options);
    } catch (err) {
      console.error("Error:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

// Generate controller
generate
  .command("controller <name>")
  .description("Generate a CRUD controller")
  .option("--no-views", "Skip generating views")
  .action(async (name: string, options: { views?: boolean }) => {
    try {
      await generateController(name, options);
    } catch (err) {
      console.error("Error:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program.parse();
