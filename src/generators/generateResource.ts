import fs from "fs";
import path from "path";
import ejs from "ejs";
import { execSync } from "child_process";
import { getTemplatesDir } from "./paths";
import { capitalize, pluralize } from "./utils";

export interface GenerateResourceOptions {
  skipModel?: boolean;
  skipController?: boolean;
  skipViews?: boolean;
  skipMigrate?: boolean;
  apiOnly?: boolean;
}

/**
 * Generate a complete resource: model + controller + views.
 */
export async function generateResource(
  name: string,
  options: GenerateResourceOptions = {}
): Promise<void> {
  const modelName = capitalize(name);
  const lowerModelName = name.toLowerCase();
  const controllerName = `${modelName}Controller`;
  const resourcePath = pluralize(lowerModelName);
  const tableName = pluralize(lowerModelName);

  console.log(`\nGenerating resource: ${modelName}\n`);

  // Generate model (if database is set up)
  if (!options.skipModel) {
    const schemaPath = path.resolve("prisma/schema.prisma");
    if (fs.existsSync(schemaPath)) {
      await generateModel(modelName, tableName, schemaPath, options.skipMigrate);
    } else {
      console.log("Skipping model (no prisma/schema.prisma found)");
      console.log("Run 'npm run db:setup' first to enable database features\n");
    }
  }

  // Generate controller
  if (!options.skipController) {
    await generateController(
      modelName,
      lowerModelName,
      controllerName,
      resourcePath,
      options.apiOnly
    );
  }

  // Generate views (unless API only)
  if (!options.skipViews && !options.apiOnly) {
    await generateViews(modelName, lowerModelName, resourcePath);
  }

  // Print summary
  printSummary(modelName, controllerName, resourcePath, options);
}

/**
 * Generate Prisma model.
 */
async function generateModel(
  modelName: string,
  tableName: string,
  schemaPath: string,
  skipMigrate?: boolean
): Promise<void> {
  const templatePath = path.join(getTemplatesDir(), "model.prisma.ejs");
  if (!fs.existsSync(templatePath)) {
    throw new Error("Model template not found");
  }

  // Check if model already exists
  const existingSchema = fs.readFileSync(schemaPath, "utf-8");
  if (existingSchema.includes(`model ${modelName} {`)) {
    console.log(`Model ${modelName} already exists, skipping...`);
    return;
  }

  const template = fs.readFileSync(templatePath, "utf-8");
  const modelContent = ejs.render(template, { modelName, tableName });

  fs.appendFileSync(schemaPath, "\n" + modelContent);
  console.log(`Created model ${modelName} in prisma/schema.prisma`);

  if (!skipMigrate) {
    console.log("\nRunning Prisma migrate...");
    try {
      execSync(`npx prisma migrate dev --name add-${tableName}`, {
        stdio: "inherit",
      });
      execSync("npx prisma generate", { stdio: "inherit" });
    } catch {
      console.error("Migration failed. Run manually: npx prisma migrate dev");
    }
  }
}

/**
 * Generate controller file.
 */
async function generateController(
  modelName: string,
  lowerModelName: string,
  controllerName: string,
  resourcePath: string,
  apiOnly?: boolean
): Promise<void> {
  const controllersDir = path.resolve("src/controllers");
  if (!fs.existsSync(controllersDir)) {
    fs.mkdirSync(controllersDir, { recursive: true });
  }

  const controllerPath = path.join(controllersDir, `${controllerName}.ts`);
  if (fs.existsSync(controllerPath)) {
    console.log(`Controller ${controllerName}.ts already exists, skipping...`);
    return;
  }

  // Use resource controller template (with full CRUD + form handling)
  const templateName = apiOnly ? "controller.api.ts.ejs" : "controller.resource.ts.ejs";
  let templatePath = path.join(getTemplatesDir(), templateName);
  
  // Fall back to basic controller template if resource template doesn't exist
  if (!fs.existsSync(templatePath)) {
    templatePath = path.join(getTemplatesDir(), "controller.ts.ejs");
  }

  if (!fs.existsSync(templatePath)) {
    throw new Error("Controller template not found");
  }

  const template = fs.readFileSync(templatePath, "utf-8");
  const controllerContent = ejs.render(template, {
    modelName,
    lowerModelName,
    controllerName,
    resourcePath,
  });

  fs.writeFileSync(controllerPath, controllerContent);
  console.log(`Created src/controllers/${controllerName}.ts`);
}

/**
 * Generate view files for the resource.
 */
async function generateViews(
  modelName: string,
  lowerModelName: string,
  resourcePath: string
): Promise<void> {
  const viewsDir = path.resolve(`src/views/${resourcePath}`);
  if (!fs.existsSync(viewsDir)) {
    fs.mkdirSync(viewsDir, { recursive: true });
  }

  const views = [
    { name: "index", title: `${modelName} List` },
    { name: "show", title: `${modelName} Details` },
    { name: "create", title: `Create ${modelName}` },
    { name: "edit", title: `Edit ${modelName}` },
  ];

  for (const view of views) {
    const viewPath = path.join(viewsDir, `${view.name}.ejs`);
    if (fs.existsSync(viewPath)) {
      console.log(`View ${view.name}.ejs already exists, skipping...`);
      continue;
    }

    // Try specific template first, then fall back to generic
    let templatePath = path.join(getTemplatesDir(), `views/${view.name}.ejs.ejs`);
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(getTemplatesDir(), "view.ejs.ejs");
    }

    if (!fs.existsSync(templatePath)) {
      console.warn(`View template for ${view.name} not found, skipping...`);
      continue;
    }

    const template = fs.readFileSync(templatePath, "utf-8");
    const viewContent = ejs.render(template, {
      title: view.title,
      modelName,
      lowerName: lowerModelName,
      resourcePath,
      viewType: view.name,
    });

    fs.writeFileSync(viewPath, viewContent);
  }

  console.log(`Created views in src/views/${resourcePath}/`);
}

/**
 * Print summary of generated files and next steps.
 */
function printSummary(
  modelName: string,
  controllerName: string,
  resourcePath: string,
  options: GenerateResourceOptions
): void {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Resource ${modelName} created successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Files created:`);

  if (!options.skipModel) {
    console.log(`  prisma/schema.prisma  (${modelName} model added)`);
  }
  if (!options.skipController) {
    console.log(`  src/controllers/${controllerName}.ts`);
  }
  if (!options.skipViews && !options.apiOnly) {
    console.log(`  src/views/${resourcePath}/index.ejs`);
    console.log(`  src/views/${resourcePath}/show.ejs`);
    console.log(`  src/views/${resourcePath}/create.ejs`);
    console.log(`  src/views/${resourcePath}/edit.ejs`);
  }

  console.log(`
Routes:
  GET    /${resourcePath}           → List all ${resourcePath}
  GET    /${resourcePath}/create    → Show create form
  POST   /${resourcePath}           → Create new ${modelName.toLowerCase()}
  GET    /${resourcePath}/:id       → Show ${modelName.toLowerCase()}
  GET    /${resourcePath}/:id/edit  → Show edit form
  PUT    /${resourcePath}/:id       → Update ${modelName.toLowerCase()}
  DELETE /${resourcePath}/:id       → Delete ${modelName.toLowerCase()}

Next steps:
  1. Add routes to src/server.ts:

     import * as ${controllerName} from "./controllers/${controllerName}";
     
     app.get("/${resourcePath}", ${controllerName}.index);
     app.get("/${resourcePath}/create", ${controllerName}.create);
     app.post("/${resourcePath}", ${controllerName}.store);
     app.get("/${resourcePath}/:id", ${controllerName}.show);
     app.get("/${resourcePath}/:id/edit", ${controllerName}.edit);
     app.put("/${resourcePath}/:id", ${controllerName}.update);
     app.delete("/${resourcePath}/:id", ${controllerName}.destroy);

  2. Edit the model in prisma/schema.prisma to add your fields
  3. Run: npx prisma migrate dev --name add-${resourcePath}-fields
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}
