import path from "path";
import fs from "fs";
import type { Express, Request, Response } from "express";

type RouteHandler = (req: Request, res: Response) => Promise<void> | void;

interface ControllerModule {
  index?: RouteHandler;
  show?: RouteHandler;
  store?: RouteHandler;
  update?: RouteHandler;
  destroy?: RouteHandler;
  [key: string]: RouteHandler | undefined;
}

/**
 * Convert a controller name to a resource path.
 * e.g., "UserController" -> "users", "PostController" -> "posts"
 */
function controllerNameToResource(name: string): string {
  // Remove "Controller" suffix
  const baseName = name.replace(/Controller$/, "");
  // Convert to lowercase and simple pluralization
  const lower = baseName.toLowerCase();
  // Simple pluralization: add 's' if not already ending in 's'
  return lower.endsWith("s") ? lower : lower + "s";
}

/**
 * Register controllers from a directory with convention-based routing.
 *
 * Convention:
 * - GET /<resource> -> index
 * - GET /<resource>/:id -> show
 * - POST /<resource> -> store
 * - PUT /<resource>/:id -> update
 * - DELETE /<resource>/:id -> destroy
 *
 * @param app - Express application instance
 * @param controllersDir - Absolute path to the controllers directory
 */
export async function registerControllers(
  app: Express,
  controllersDir: string
): Promise<void> {
  if (!fs.existsSync(controllersDir)) {
    console.warn(`Controllers directory not found: ${controllersDir}`);
    return;
  }

  const files = fs.readdirSync(controllersDir);
  const controllerFiles = files.filter(
    (f) => f.endsWith("Controller.ts") || f.endsWith("Controller.js")
  );

  for (const file of controllerFiles) {
    const controllerPath = path.join(controllersDir, file);
    const controllerName = path.basename(file, path.extname(file));
    const resource = controllerNameToResource(controllerName);

    try {
      // Dynamic import for ES modules
      const controller: ControllerModule = await import(controllerPath);

      // Register routes based on exported functions
      if (controller.index) {
        app.get(`/${resource}`, controller.index);
      }
      if (controller.show) {
        app.get(`/${resource}/:id`, controller.show);
      }
      if (controller.store) {
        app.post(`/${resource}`, controller.store);
      }
      if (controller.update) {
        app.put(`/${resource}/:id`, controller.update);
      }
      if (controller.destroy) {
        app.delete(`/${resource}/:id`, controller.destroy);
      }

      console.log(`Registered controller: ${controllerName} -> /${resource}`);
    } catch (err) {
      console.error(`Failed to load controller ${file}:`, err);
    }
  }
}

/**
 * Register a single controller with custom base path.
 */
export function registerController(
  app: Express,
  basePath: string,
  controller: ControllerModule
): void {
  const resource = basePath.startsWith("/") ? basePath : `/${basePath}`;

  if (controller.index) {
    app.get(resource, controller.index);
  }
  if (controller.show) {
    app.get(`${resource}/:id`, controller.show);
  }
  if (controller.store) {
    app.post(resource, controller.store);
  }
  if (controller.update) {
    app.put(`${resource}/:id`, controller.update);
  }
  if (controller.destroy) {
    app.delete(`${resource}/:id`, controller.destroy);
  }
}
