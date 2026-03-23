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
  withCi?: boolean;
  withTailwind?: boolean;
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

  // Setup CI if requested
  if (options.withCi) {
    setupCi(targetDir);
  }

  // Setup Tailwind CSS if requested
  if (options.withTailwind) {
    setupTailwind(targetDir);
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
` : ""}
${options.withTailwind ? `
To configure Tailwind CSS:
  npm run tailwind
  # Edit tailwind.config.cjs and src/assets/tailwind.css
` : ""}`);
}

/**
 * Setup GitHub Actions CI workflow.
 */
function setupCi(targetDir: string): void {
  const workflowDir = path.join(targetDir, ".github", "workflows");
  fs.mkdirSync(workflowDir, { recursive: true });

  const ciTemplateDir = path.join(getTemplatesDir(), "ci");
  const testWorkflow = path.join(ciTemplateDir, "test.yml");

  if (fs.existsSync(testWorkflow)) {
    fs.copyFileSync(testWorkflow, path.join(workflowDir, "test.yml"));
    console.log("GitHub Actions CI workflow added.");
  }
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

  // Install Prisma (pin to v6 to avoid breaking changes in v7)
  console.log("\nSetting up database...");
  try {
    execSync("npm install @prisma/client@^6.0.0 prisma@^6.0.0", { cwd: targetDir, stdio: "inherit" });
    execSync("npx prisma generate", { cwd: targetDir, stdio: "inherit" });
  } catch {
    console.error("Failed to setup Prisma. Run 'npm run db:setup' manually.");
  }
}


/**
 * Setup Tailwind CSS with pre-built CSS.
 */
function setupTailwind(targetDir: string): void {
  console.log("\nSetting up Tailwind CSS...");
  try {
    execSync("npm install -D tailwindcss postcss autoprefixer", { cwd: targetDir, stdio: "inherit" });

    const templateDir = getTemplatesDir();
    const templateCss = path.join(templateDir, "appScaffold", "public", "dist", "tailwind.css");
    const targetCss = path.join(targetDir, "public", "dist", "tailwind.css");

    fs.mkdirSync(path.dirname(targetCss), { recursive: true });
    fs.copyFileSync(templateCss, targetCss);

    const assetsDir = path.join(targetDir, "src", "assets");
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.writeFileSync(path.join(assetsDir, "tailwind.css"), `@import "tailwindcss";\n`);

    const config = `import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
`;
    fs.writeFileSync(path.join(targetDir, "tailwind.config.ts"), config);

    console.log("✓ Added Tailwind CSS support");
  } catch {
    console.error("Failed to setup Tailwind CSS.");
  }
}

/**
 * Recursively copy a directory.
 */

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
