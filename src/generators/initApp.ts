import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { getTemplatesDir, getPrismaDir, getPackageRoot } from "./paths";

// Get version from package.json
function getFrameworkVersion(): string {
  try {
    const pkgPath = path.join(getPackageRoot(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    return pkg.version || "0.1.1";
  } catch {
    return "0.1.1";
  }
}

export interface InitOptions {
  skipInstall?: boolean;
  withDatabase?: boolean;
}

/**
 * Scaffold a new MVC application.
 */
export async function initApp(dir: string, options: InitOptions = {}): Promise<void> {
  const targetDir = path.resolve(dir);
  const templateDir = path.join(getTemplatesDir(), "appScaffold");

  console.log(`Creating new MVC application in ${targetDir}...`);

  // Create target directory
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Copy app scaffold templates
  copyDirRecursive(templateDir, targetDir);

  // Rename dotfiles (npm doesn't publish dotfiles, so we use .txt extensions)
  const renames: [string, string][] = [
    ["gitignore.txt", ".gitignore"],
    ["env.example.txt", ".env.example"],
  ];
  for (const [src, dest] of renames) {
    const srcPath = path.join(targetDir, src);
    const destPath = path.join(targetDir, dest);
    if (fs.existsSync(srcPath)) {
      fs.renameSync(srcPath, destPath);
    }
  }

  // Update package.json with app name and framework version
  const appPackageJson = path.join(targetDir, "package.json");
  if (fs.existsSync(appPackageJson)) {
    const pkg = JSON.parse(fs.readFileSync(appPackageJson, "utf-8"));
    pkg.name = path.basename(dir);
    
    // Use npm package version (not file path)
    pkg.dependencies["@erwininteractive/mvc"] = `^${getFrameworkVersion()}`;
    
    fs.writeFileSync(appPackageJson, JSON.stringify(pkg, null, 2));
  }

  console.log("Application scaffolded successfully!");

  // Install dependencies
  if (!options.skipInstall) {
    console.log("\nInstalling dependencies...");
    try {
      execSync("npm install", { cwd: targetDir, stdio: "inherit" });
    } catch {
      console.error("Failed to install dependencies. Please run 'npm install' manually.");
    }
  }

  // Setup database if requested
  if (options.withDatabase) {
    setupDatabase(targetDir);
  }

  console.log(`
Next steps:
  cd ${dir}
  npm run dev

Your app is ready! Visit http://localhost:3000
${!options.withDatabase ? `
To add database support later:
  npm run db:setup
  # Edit .env with DATABASE_URL
  npx prisma migrate dev --name init
` : ""}`);
}

/**
 * Setup Prisma database support.
 */
function setupDatabase(targetDir: string): void {
  // Copy prisma schema
  const prismaDir = path.join(targetDir, "prisma");
  if (!fs.existsSync(prismaDir)) {
    fs.mkdirSync(prismaDir, { recursive: true });
  }

  const frameworkPrismaSchema = path.join(getPrismaDir(), "schema.prisma");
  if (fs.existsSync(frameworkPrismaSchema)) {
    fs.copyFileSync(frameworkPrismaSchema, path.join(prismaDir, "schema.prisma"));
  }

  // Install Prisma
  console.log("\nSetting up database...");
  try {
    execSync("npm install @prisma/client prisma", { cwd: targetDir, stdio: "inherit" });
    execSync("npx prisma generate", { cwd: targetDir, stdio: "inherit" });
  } catch {
    console.error("Failed to setup Prisma. Run 'npm run db:setup' manually.");
  }
}

/**
 * Recursively copy a directory.
 */
function copyDirRecursive(src: string, dest: string): void {
  if (!fs.existsSync(src)) {
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
