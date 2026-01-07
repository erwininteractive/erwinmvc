import path from "path";
import fs from "fs";

/**
 * Get the root directory of the framework package.
 * Works whether running from src/ (development) or dist/ (production).
 */
export function getPackageRoot(): string {
  // Start from this file's directory and walk up to find package.json
  let dir = __dirname;
  
  // Walk up at most 5 levels to find package.json with our package name
  for (let i = 0; i < 5; i++) {
    const packageJsonPath = path.join(dir, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        if (pkg.name === "@erwininteractive/mvc") {
          return dir;
        }
      } catch {
        // Continue searching
      }
    }
    dir = path.dirname(dir);
  }
  
  // Fallback: assume we're in dist/generators or src/generators
  return path.resolve(__dirname, "../..");
}

/**
 * Get the templates directory path.
 */
export function getTemplatesDir(): string {
  return path.join(getPackageRoot(), "templates");
}

/**
 * Get the prisma directory path.
 */
export function getPrismaDir(): string {
  return path.join(getPackageRoot(), "prisma");
}

/**
 * Get the .env.example file path.
 */
export function getEnvExamplePath(): string {
  return path.join(getPackageRoot(), ".env.example");
}
