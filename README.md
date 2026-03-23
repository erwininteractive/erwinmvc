# @erwininteractive/mvc

A lightweight, full-featured MVC framework for Node.js 20+ built with TypeScript.

## Features

- **Express** - Fast, minimal web framework
- **EJS + Alpine.js** - Server-side templating with reactive client-side components
- **Optional Database** - Add Prisma + PostgreSQL when you need it
- **Optional Redis Sessions** - Scalable session management
- **JWT Authentication** - Secure token-based auth with bcrypt password hashing
- **WebAuthn (Passkeys)** - Passwordless authentication with security keys (YubiKey, Touch ID, Face ID)
- **CLI Tools** - Scaffold apps and generate models/controllers

## Quick Start

```bash
npx @erwininteractive/mvc init myapp
cd myapp
npm run dev
```

Visit http://localhost:3000 - your app is running!

---

## Getting Started

### Step 1: Create a New Page

Create `src/views/about.ejs`:

```html
<!doctype html>
<html>
<head>
  <title><%= title %></title>
</head>
<body>
  <h1><%= title %></h1>
  <p>Welcome to my about page!</p>
</body>
</html>
```

### Step 2: Add a Route

Edit `src/server.ts`:

```typescript
app.get("/about", (req, res) => {
  res.render("about", { title: "About Us" });
});
```

### Step 3: View Your Page

Visit http://localhost:3000/about

---

## Creating Pages

### EJS Templates

Create `.ejs` files in `src/views/`. EJS lets you use JavaScript in HTML:

```html
<!-- Output a variable (escaped) -->
<h1><%= title %></h1>

<!-- Output raw HTML -->
<%- htmlContent %>

<!-- JavaScript logic -->
<% if (user) { %>
  <p>Welcome, <%= user.name %>!</p>
<% } %>

<!-- Loop through items -->
<ul>
<% items.forEach(item => { %>
  <li><%= item.name %></li>
<% }); %>
</ul>

<!-- Include another template -->
<%- include('partials/header') %>
```

### Adding Routes

```typescript
// Simple page
app.get("/contact", (req, res) => {
  res.render("contact", { title: "Contact Us" });
});

// Handle form submission
app.post("/contact", (req, res) => {
  const { name, email, message } = req.body;
  console.log(`Message from ${name}: ${message}`);
  res.redirect("/contact?sent=true");
});

// JSON API endpoint
app.get("/api/users", (req, res) => {
  res.json([{ id: 1, name: "John" }]);
});
```

---

## Resources

Generate a complete resource (model + controller + views) with one command:

```bash
npx erwinmvc generate resource Post
```

This creates:
- `prisma/schema.prisma` - Adds the Post model
- `src/controllers/PostController.ts` - Full CRUD controller with form handling
- `src/views/posts/index.ejs` - List view
- `src/views/posts/show.ejs` - Detail view
- `src/views/posts/create.ejs` - Create form
- `src/views/posts/edit.ejs` - Edit form

### Resource Routes

| Action    | HTTP Method | URL              | Description      |
|-----------|-------------|------------------|------------------|
| `index`   | GET         | /posts           | List all         |
| `create`  | GET         | /posts/create    | Show create form |
| `store`   | POST        | /posts           | Create new       |
| `show`    | GET         | /posts/:id       | Show one         |
| `edit`    | GET         | /posts/:id/edit  | Show edit form   |
| `update`  | PUT         | /posts/:id       | Update           |
| `destroy` | DELETE      | /posts/:id       | Delete           |

### Wiring Up Routes

Add to `src/server.ts`:

```typescript
import * as PostController from "./controllers/PostController";

app.get("/posts", PostController.index);
app.get("/posts/create", PostController.create);
app.post("/posts", PostController.store);
app.get("/posts/:id", PostController.show);
app.get("/posts/:id/edit", PostController.edit);
app.put("/posts/:id", PostController.update);
app.delete("/posts/:id", PostController.destroy);
```

---

## Controllers

Generate just a controller (without model/views):

```bash
npx erwinmvc generate controller Product
```

This creates `src/controllers/ProductController.ts` with CRUD actions:

| Action    | HTTP Method | URL              | Description |
|-----------|-------------|------------------|-------------|
| `index`   | GET         | /products        | List all    |
| `show`    | GET         | /products/:id    | Show one    |
| `store`   | POST        | /products        | Create      |
| `update`  | PUT         | /products/:id    | Update      |
| `destroy` | DELETE      | /products/:id    | Delete      |

### Using Controllers

```typescript
import * as ProductController from "./controllers/ProductController";

app.get("/products", ProductController.index);
app.get("/products/:id", ProductController.show);
app.post("/products", ProductController.store);
app.put("/products/:id", ProductController.update);
app.delete("/products/:id", ProductController.destroy);
```

---

## Database (Optional)

Your app works without a database. Add one when you need it.

### Setup

```bash
npm run db:setup
```

Edit `.env` with your database URL:

```
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

Run migrations:

```bash
npx prisma migrate dev --name init
```

### Generate Models

```bash
npx erwinmvc generate model Post
```

Edit `prisma/schema.prisma` to add fields:

```prisma
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("posts")
}
```

Run migrations again:

```bash
npx prisma migrate dev --name add-post-fields
```

### Use in Code

```typescript
import { getPrismaClient } from "@erwininteractive/mvc";

const prisma = getPrismaClient();

app.get("/posts", async (req, res) => {
  const posts = await prisma.post.findMany();
  res.render("posts/index", { posts });
});
```

---

## Authentication

```typescript
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  authenticate,
} from "@erwininteractive/mvc";

// Hash a password
const hash = await hashPassword("secret123");

// Verify a password
const isValid = await verifyPassword("secret123", hash);

// Sign a JWT
const token = signToken({ userId: 1, email: "user@example.com" });

// Protect routes with middleware
app.get("/protected", authenticate, (req, res) => {
  res.json({ user: req.user });
});
```

### Auto-Inject User to Views

When a user is authenticated, their information is automatically available in all EJS templates via `res.locals.user`:

```typescript
// In any EJS template
<% if (user) { %>
  <p>Welcome, <%= user.email %></p>
<% } else { %>
  <a href="/auth/login">Login</a>
<% } %>
```

The middleware automatically:
- Extracts JWT from `req.cookies.token` or `Authorization` header
- Verifies the token using `JWT_SECRET`
- Sets `req.user` and `res.locals.user` for use in views

---

### WebAuthn (Passkeys)

Passwordless authentication with security keys:

```bash
npx erwinmvc webauthn
```

This generates:
- `src/controllers/WebAuthnController.ts` - Registration and login handlers
- `src/views/webauthn/` - EJS views for register/login pages
- Prisma `WebAuthnCredential` model for storing security key data

```typescript
import {
  startRegistration,
  completeRegistration,
  startAuthentication,
  completeAuthentication,
  getRPConfig,
} from "@erwininteractive/mvc";

const { rpID, rpName } = getRPConfig();

const options = await startRegistration(req, res);
await completeRegistration(req, res);

const options = await startAuthentication(req, res);
await completeAuthentication(req, res);
```

Environment variables:
- `WEBAUTHN_RP_ID` - Your domain (e.g., "localhost" or "example.com")
- `WEBAUTHN_RP_NAME` - Your app name (e.g., "ErwinMVC App")

Note: WebAuthn requires HTTPS or localhost.

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `npx @erwininteractive/mvc init <dir>` | Create a new app |
| `npx erwinmvc generate resource <name>` | Generate model + controller + views |
| `npx erwinmvc generate controller <name>` | Generate a CRUD controller |
| `npx erwinmvc generate model <name>` | Generate a database model |
| `npx erwinmvc webauthn` | Generate WebAuthn authentication (security keys) |

### Init Options

| Option | Description |
|--------|-------------|
| `--skip-install` | Skip running npm install |
| `--with-database` | Include Prisma database setup |
| `--with-ci` | Include GitHub Actions CI workflow |

### Resource Options

| Option | Description |
|--------|-------------|
| `--skip-model` | Skip generating Prisma model |
| `--skip-controller` | Skip generating controller |
| `--skip-views` | Skip generating views |
| `--skip-migrate` | Skip running Prisma migrate |
| `--api-only` | Generate API-only controller (no views) |

### Other Generate Options

| Option | Description |
|--------|-------------|
| `--skip-migrate` | Skip running Prisma migrate (model) |
| `--no-views` | Skip generating EJS views (controller) |

---

## Project Structure

```
myapp/
├── src/
│   ├── server.ts           # Main app - add routes here
│   ├── views/              # EJS templates
│   ├── controllers/        # Route handlers (optional)
│   └── middleware/         # Express middleware (optional)
├── public/                 # Static files (CSS, JS, images)
├── prisma/                 # Database (after db:setup)
│   └── schema.prisma
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

### Static Files

Files in `public/` are served at the root URL:

```
public/css/style.css  →  /css/style.css
public/images/logo.png  →  /images/logo.png
```

---

## App Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (auto-reload) |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run db:setup` | Install database dependencies |
| `npm run db:migrate` | Run database migrations |

---

## CI/CD (Optional)

Add GitHub Actions CI to your project for automated testing:

```bash
npx @erwininteractive/mvc init myapp --with-ci
```

Or add CI to an existing project by creating `.github/workflows/test.yml`:

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
```

### Adding Database Tests

If your app uses a database, add PostgreSQL as a service:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Build
        run: npm run build
```

### Secrets

For production deployments, add these secrets in your GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `DATABASE_URL` | Production database connection string |
| `REDIS_URL` | Production Redis connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `SESSION_SECRET` | Secret key for session encryption |

Access secrets in your workflow:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

---

## Environment Variables

All optional. Create `.env` from `.env.example`:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"  # For database
REDIS_URL="redis://localhost:6379"                         # For sessions
JWT_SECRET="your-secret-key"                               # For auth
SESSION_SECRET="your-session-secret"                       # For sessions
PORT=3000                                                  # Server port
NODE_ENV=development                                       # Environment
```

---

## Learn More

- [Express.js Documentation](https://expressjs.com/)
- [EJS Documentation](https://ejs.co/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Alpine.js Documentation](https://alpinejs.dev/)

## License

MIT
