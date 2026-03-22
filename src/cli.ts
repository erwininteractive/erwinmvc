#!/usr/bin/env node

import { Command } from "commander";
import { initApp } from "./generators/initApp";
import { generateModel } from "./generators/generateModel";
import { generateController } from "./generators/generateController";
import { generateResource } from "./generators/generateResource";
import { generateWebAuthn } from "./generators/generateWebAuthn";

const program = new Command();

program
  .name("erwinmvc")
  .description("CLI for @erwininteractive/mvc framework")
  .version("0.2.0");

// Init command - scaffold a new application
program
  .command("init <dir>")
  .description("Scaffold a new MVC application")
  .option("--skip-install", "Skip npm install")
  .option("--with-database", "Include database/Prisma setup")
  .option("--with-ci", "Include GitHub Actions CI workflow")
  .action(
    async (
      dir: string,
      options: {
        skipInstall?: boolean;
        withDatabase?: boolean;
        withCi?: boolean;
      },
    ): Promise<void> => {
      try {
        await initApp(dir, options);
      } catch (err) {
        console.error("Error:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    },
  );

// Generate command group
const generate = program
  .command("generate")
  .alias("g")
  .description("Generate models, controllers, or resources");

// Generate model
generate
  .command("model <name>")
  .description("Generate a Prisma model")
  .option("--skip-migrate", "Skip running Prisma migrate")
  .action(
    async (name: string, options: { skipMigrate?: boolean }): Promise<void> => {
      try {
        await generateModel(name, options);
      } catch (err) {
        console.error("Error:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    },
  );

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

// Generate resource (model + controller + views)
generate
  .command("resource <name>")
  .description("Generate a complete resource (model + controller + views)")
  .option("--skip-model", "Skip generating Prisma model")
  .option("--skip-controller", "Skip generating controller")
  .option("--skip-views", "Skip generating views")
  .option("--skip-migrate", "Skip running Prisma migrate")
  .option("--api-only", "Generate API-only controller (no views)")
  .action(
    async (
      name: string,
      options: {
        skipModel?: boolean;
        skipController?: boolean;
        skipViews?: boolean;
        skipMigrate?: boolean;
        apiOnly?: boolean;
      },
    ): Promise<void> => {
      try {
        await generateResource(name, options);
      } catch (err) {
        console.error("Error:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    },
  );

// WebAuthn command - generate WebAuthn authentication views and controller
program
  .command("webauthn")
  .alias("w")
  .description("Generate WebAuthn authentication (security key login)")
  .option("--skip-migrate", "Skip running Prisma migrate")
  .action(
    async (options: { skipMigrate?: boolean }): Promise<void> => {
      try {
        await generateWebAuthn(options);
      } catch (err) {
        console.error("Error:", err instanceof Error ? err.message : err);
        process.exit(1);
      }
    },
  );

program.parse();
