import fs from "fs";
import path from "path";
import ejs from "ejs";
import { execSync } from "child_process";
import { getTemplatesDir } from "./paths";

export interface GenerateModelOptions {
  skipMigrate?: boolean;
}

/**
 * Generate a Prisma model and append it to schema.prisma.
 */
export async function generateModel(
  name: string,
  options: GenerateModelOptions = {}
): Promise<void> {
  const modelName = capitalize(name);
  const tableName = pluralize(name.toLowerCase());

  console.log(`Generating model: ${modelName}`);

  // Find prisma schema
  const schemaPath = path.resolve("prisma/schema.prisma");
  if (!fs.existsSync(schemaPath)) {
    throw new Error("prisma/schema.prisma not found. Are you in a project directory?");
  }

  // Load and render template
  const templatePath = path.join(getTemplatesDir(), "model.prisma.ejs");
  if (!fs.existsSync(templatePath)) {
    throw new Error("Model template not found");
  }

  const template = fs.readFileSync(templatePath, "utf-8");
  const modelContent = ejs.render(template, { modelName, tableName });

  // Check if model already exists
  const existingSchema = fs.readFileSync(schemaPath, "utf-8");
  if (existingSchema.includes(`model ${modelName} {`)) {
    throw new Error(`Model ${modelName} already exists in schema.prisma`);
  }

  // Append model to schema
  fs.appendFileSync(schemaPath, "\n" + modelContent);
  console.log(`Added model ${modelName} to prisma/schema.prisma`);

  // Run Prisma migrate
  if (!options.skipMigrate) {
    console.log("\nRunning Prisma migrate...");
    try {
      execSync(`npx prisma migrate dev --name add-${name.toLowerCase()}`, {
        stdio: "inherit",
      });
    } catch {
      console.error("Migration failed. You may need to run it manually.");
    }

    console.log("\nGenerating Prisma client...");
    try {
      execSync("npx prisma generate", { stdio: "inherit" });
    } catch {
      console.error("Failed to generate Prisma client.");
    }
  }

  console.log(`\nModel ${modelName} created successfully!`);
}

/**
 * Capitalize the first letter of a string.
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Simple pluralization - add 's' if not already ending in 's'.
 */
function pluralize(str: string): string {
  if (str.endsWith("s")) {
    return str;
  }
  if (str.endsWith("y")) {
    return str.slice(0, -1) + "ies";
  }
  return str + "s";
}
