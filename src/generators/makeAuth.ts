import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { getTemplatesDir, getPrismaDir } from "./paths";

export interface MakeAuthOptions {
  withoutModel?: boolean;
  sessionOnly?: boolean;
  jwtOnly?: boolean;
}

/**
 * Generate a complete authentication system (User model, AuthController, views)
 */
export async function makeAuth(options: MakeAuthOptions = {}): Promise<void> {
  const targetDir = process.cwd();
  const templateDir = path.join(getTemplatesDir(), "auth");

  console.log("Generating authentication system...");

  // Create auth template files if they don't exist
  createAuthTemplates(templateDir);

  // Copy auth templates
  if (fs.existsSync(templateDir)) {
    copyDirRecursive(templateDir, targetDir);
  }

  // Update .env with auth configuration
  const envPath = path.join(targetDir, ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    
    if (!envContent.includes("SESSION_SECRET")) {
      fs.appendFileSync(envPath, "\nSESSION_SECRET=\"change-me-session\"\n");
    }
  }

  // Update .env.example
  const envExamplePath = path.join(targetDir, ".env.example");
  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, "utf-8");
    
    if (!envContent.includes("SESSION_SECRET")) {
      fs.appendFileSync(envExamplePath, "\nSESSION_SECRET=\"change-me-session\"\n");
    }
  }

  console.log("\nAuthentication system generated successfully!");
  console.log(`
Next steps:
  1. Run migrations: npm run db:migrate
  2. Add auth routes to src/server.ts:
     - import * as auth from "./controllers/AuthController";
     - app.get("/login", auth.showLogin);
     - app.post("/login", auth.login);
     - app.get("/register", auth.showRegister);
     - app.post("/register", auth.register);
     - app.post("/logout", auth.logout);
`);

  // Generate AuthController.ejs files
  const authControllerTemplate = path.join(getTemplatesDir(), "authController.ts.ejs");
  if (fs.existsSync(authControllerTemplate)) {
    const destPath = path.join(targetDir, "src", "controllers", "AuthController.ts");
    const content = fs.readFileSync(authControllerTemplate, "utf-8");
    fs.writeFileSync(destPath, content);
    console.log("✓ Created src/controllers/AuthController.ts");
  }

  // Generate EJS views
  const viewsDir = path.join(targetDir, "src", "views", "auth");
  fs.mkdirSync(viewsDir, { recursive: true });

  const loginView = path.join(getTemplatesDir(), "views/auth/login.ejs");
  if (fs.existsSync(loginView)) {
    fs.copyFileSync(loginView, path.join(viewsDir, "login.ejs"));
    console.log("✓ Created src/views/auth/login.ejs");
  }

  const registerView = path.join(getTemplatesDir(), "views/auth/register.ejs");
  if (fs.existsSync(registerView)) {
    fs.copyFileSync(registerView, path.join(viewsDir, "register.ejs"));
    console.log("✓ Created src/views/auth/register.ejs");
  }
}

/**
 * Create auth template files if they don't exist
 */
function createAuthTemplates(templateDir: string): void {
  fs.mkdirSync(templateDir, { recursive: true });

  // Create AuthController template
  const controllerTemplate = `import { Request, Response } from "express";
import { hashPassword, verifyPassword, signToken, verifyToken } from "@erwininteractive/mvc";
import { getPrismaClient } from "@erwininteractive/mvc";

const prisma = getPrismaClient();

export async function showLogin(req: Request, res: Response) {
  res.render("auth/login", { title: "Login" });
}

export async function showRegister(req: Request, res: Response) {
  res.render("auth/register", { title: "Register" });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.render("auth/login", {
        title: "Login",
        error: "Invalid email or password"
      });
    }

    const isValid = await verifyPassword(password, user.hashedPassword);
    if (!isValid) {
      return res.render("auth/login", {
        title: "Login",
        error: "Invalid email or password"
      });
    }

    const token = signToken({ userId: user.id, email: user.email });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    });

    res.redirect("/");
  } catch (err) {
    console.error("Login error:", err);
    res.render("auth/login", {
      title: "Login",
      error: "An error occurred during login"
    });
  }
}

export async function register(req: Request, res: Response) {
  const { email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.render("auth/register", {
      title: "Register",
      error: "Passwords do not match"
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.render("auth/register", {
        title: "Register",
        error: "Email already in use"
      });
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.create({
      data: {
        email,
        hashedPassword,
        role: "user"
      }
    });

    res.redirect("/login");
  } catch (err) {
    console.error("Registration error:", err);
    res.render("auth/register", {
      title: "Register",
      error: "An error occurred during registration"
    });
  }
}

export async function logout(req: Request, res: Response) {
  res.clearCookie("token");
  res.redirect("/login");
}

export async function requireAuth(req: Request, res: Response, next: any) {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.redirect("/login");
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    res.clearCookie("token");
    res.redirect("/login");
  }
}
`;
  fs.writeFileSync(path.join(templateDir, "authController.ts.ejs"), controllerTemplate);

  // Create login view
  const loginView = `<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
  <style>
    body { font-family: sans-serif; max-width: 400px; margin: 50px auto; }
    input { width: 100%; padding: 8px; margin: 8px 0; }
    button { background: #007bff; color: white; padding: 10px; border: none; cursor: pointer; }
    .error { color: red; }
    .link { color: #007bff; }
  </style>
</head>
<body>
  <h1><%= title %></h1>
  
  <% if (error) { %>
    <p class="error"><%= error %></p>
  <% } %>
  
  <form method="POST" action="/login">
    <label>Email</label>
    <input type="email" name="email" required>
    
    <label>Password</label>
    <input type="password" name="password" required>
    
    <button type="submit">Login</button>
  </form>
  
  <p>Don't have an account? <a href="/register" class="link">Register</a></p>
</body>
</html>
`;
  fs.writeFileSync(path.join(templateDir, "views/auth/login.ejs.ejs"), loginView);

  // Create register view
  const registerView = `<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
  <style>
    body { font-family: sans-serif; max-width: 400px; margin: 50px auto; }
    input { width: 100%; padding: 8px; margin: 8px 0; }
    button { background: #28a745; color: white; padding: 10px; border: none; cursor: pointer; }
    .error { color: red; }
    .link { color: #007bff; }
  </style>
</head>
<body>
  <h1><%= title %></h1>
  
  <% if (error) { %>
    <p class="error"><%= error %></p>
  <% } %>
  
  <form method="POST" action="/register">
    <label>Email</label>
    <input type="email" name="email" required>
    
    <label>Password</label>
    <input type="password" name="password" required>
    
    <label>Confirm Password</label>
    <input type="password" name="confirmPassword" required>
    
    <button type="submit">Register</button>
  </form>
  
  <p>Already have an account? <a href="/login" class="link">Login</a></p>
</body>
</html>
`;
  fs.writeFileSync(path.join(templateDir, "views/auth/register.ejs.ejs"), registerView);
}

/**
 * Recursively copy a directory
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
    } else if (entry.name.endsWith(".ejs.ejs")) {
      // Remove .ejs.ejs suffix, write render version
      const content = fs.readFileSync(srcPath, "utf-8");
      const targetPath = destPath.replace(/\.ejs\.ejs$/, ".ejs");
      fs.writeFileSync(targetPath, content);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
