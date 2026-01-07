import fs from "fs";
import path from "path";
import ejs from "ejs";
import { getTemplatesDir } from "./paths";

export interface GenerateControllerOptions {
  views?: boolean;
}

/**
 * Generate a CRUD controller.
 */
export async function generateController(
  name: string,
  options: GenerateControllerOptions = {}
): Promise<void> {
  const { views = true } = options;

  const modelName = capitalize(name);
  const lowerModelName = name.toLowerCase();
  const controllerName = `${modelName}Controller`;
  const resourcePath = pluralize(lowerModelName);

  console.log(`Generating controller: ${controllerName}`);

  // Ensure controllers directory exists
  const controllersDir = path.resolve("src/controllers");
  if (!fs.existsSync(controllersDir)) {
    fs.mkdirSync(controllersDir, { recursive: true });
  }

  // Load and render controller template
  const templatePath = path.join(getTemplatesDir(), "controller.ts.ejs");
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

  // Write controller file
  const controllerPath = path.join(controllersDir, `${controllerName}.ts`);
  if (fs.existsSync(controllerPath)) {
    throw new Error(`Controller ${controllerName}.ts already exists`);
  }

  fs.writeFileSync(controllerPath, controllerContent);
  console.log(`Created src/controllers/${controllerName}.ts`);

  // Generate views if enabled
  if (views) {
    await generateViews(lowerModelName, modelName);
  }

  console.log(`
Controller ${controllerName} created successfully!

Routes:
  GET    /${resourcePath}       -> index
  GET    /${resourcePath}/:id   -> show
  POST   /${resourcePath}       -> store
  PUT    /${resourcePath}/:id   -> update
  DELETE /${resourcePath}/:id   -> destroy
`);
}

/**
 * Generate basic views for a resource.
 */
async function generateViews(lowerName: string, modelName: string): Promise<void> {
  const viewsDir = path.resolve(`src/views/${lowerName}`);
  if (!fs.existsSync(viewsDir)) {
    fs.mkdirSync(viewsDir, { recursive: true });
  }

  // Load view template
  const viewTemplatePath = path.join(getTemplatesDir(), "view.ejs.ejs");
  if (!fs.existsSync(viewTemplatePath)) {
    console.warn("View template not found, skipping view generation");
    return;
  }

  const viewTemplate = fs.readFileSync(viewTemplatePath, "utf-8");

  // Generate index view
  const indexContent = ejs.render(viewTemplate, {
    title: `${modelName} List`,
    modelName,
    lowerName,
    viewType: "index",
  });
  fs.writeFileSync(path.join(viewsDir, "index.ejs"), indexContent);

  // Generate show view
  const showContent = ejs.render(viewTemplate, {
    title: `${modelName} Details`,
    modelName,
    lowerName,
    viewType: "show",
  });
  fs.writeFileSync(path.join(viewsDir, "show.ejs"), showContent);

  console.log(`Created views in src/views/${lowerName}/`);
}

/**
 * Capitalize the first letter of a string.
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Simple pluralization.
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
