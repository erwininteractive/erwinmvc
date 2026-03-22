import fs from "fs";
import path from "path";
import ejs from "ejs";
import { execSync } from "child_process";
import { getTemplatesDir } from "./paths";

export interface GenerateWebAuthnOptions {
  skipMigrate?: boolean;
}

/**
 * Generate WebAuthn authentication views and controller.
 */
export async function generateWebAuthn(
  options: GenerateWebAuthnOptions = {}
): Promise<void> {
  console.log("Generating WebAuthn authentication...");

  const controllersDir = path.resolve("src/controllers");
  if (!fs.existsSync(controllersDir)) {
    fs.mkdirSync(controllersDir, { recursive: true });
  }

  const viewsDir = path.resolve("src/views/webauthn");
  if (!fs.existsSync(viewsDir)) {
    fs.mkdirSync(viewsDir, { recursive: true });
  }

  // Generate controller
  const controllerTemplatePath = path.join(getTemplatesDir(), "webauthnController.ts.ejs");
  const controllerTemplate = fs.readFileSync(controllerTemplatePath, "utf-8");
  const controllerContent = ejs.render(controllerTemplate, {
    controllerName: "WebAuthnController",
    resourcePath: "webauthn",
  });
  fs.writeFileSync(path.join(controllersDir, "WebAuthnController.ts"), controllerContent);
  console.log("Created src/controllers/WebAuthnController.ts");

  // Generate views
  const viewTemplatePath = path.join(getTemplatesDir(), "webauthnView.ejs.ejs");

  const views = [
    { name: "register", title: "Register Security Key" },
    { name: "login", title: "Log in with Security Key" },
    { name: "authenticate", title: "Two-Factor Authentication" },
  ];

  for (const view of views) {
    const viewTemplate = fs.readFileSync(viewTemplatePath, "utf-8");
    const viewContent = ejs.render(viewTemplate, {
      title: view.title,
      viewName: view.name,
    });
    fs.writeFileSync(path.join(viewsDir, `${view.name}.ejs`), viewContent);
    console.log(`Created src/views/webauthn/${view.name}.ejs`);
  }

  // Run migrations if prisma exists
  if (!options.skipMigrate) {
    const schemaPath = path.resolve("prisma/schema.prisma");
    if (fs.existsSync(schemaPath)) {
      console.log("\nRunning Prisma migrate...");
      try {
        execSync("npx prisma migrate dev --name add_webauthn_credentials", {
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
  }

  console.log(`
WebAuthn authentication created successfully!

Routes:
  GET    /webauthn/register      -> register (display registration form)
  POST   /webauthn/register      -> completeRegistration (process registration)
  GET    /webauthn/login         -> login (display login form)
  POST   /webauthn/login         -> completeAuthentication (process login)
  GET    /webauthn/authenticate  -> authenticate (2FA challenge)
  POST   /webauthn/authenticate  -> completeAuthentication (2FA completion)

Required environment variables:
  WEBAUTHN_RP_ID     - Your domain (e.g., "localhost" or "example.com")
  WEBAUTHN_RP_NAME   - Your app name (e.g., "ErwinMVC App")

Note: WebAuthn requires a secure context (HTTPS or localhost).
`);
}
