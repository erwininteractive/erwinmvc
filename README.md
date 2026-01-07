# @erwininteractive/mvc

A lightweight, full-featured MVC framework for Node.js 20+ built with TypeScript.

## Features

- **Express** - Fast, minimal web framework
- **Prisma** - Modern database ORM with PostgreSQL
- **EJS + Alpine.js** - Server-side templating with reactive client-side components
- **Redis Sessions** - Scalable session management
- **JWT Authentication** - Secure token-based auth with bcrypt password hashing
- **CLI Tools** - Scaffold apps and generate models/controllers

## Quick Start

### Create a New Application

```bash
npx @erwininteractive/mvc init myapp
cd myapp
cp .env.example .env
# Edit .env with your database configuration
npx prisma migrate dev --name init
npm run dev
```

### Generate a Model

```bash
npx erwinmvc generate model Post
```

This creates a Prisma model and runs migrations.

### Generate a Controller

```bash
npx erwinmvc generate controller Post
```

This creates a CRUD controller with routes:
- `GET /posts` - List all posts
- `GET /posts/:id` - Show a single post
- `POST /posts` - Create a post
- `PUT /posts/:id` - Update a post
- `DELETE /posts/:id` - Delete a post

## CLI Commands

| Command | Description |
|---------|-------------|
| `erwinmvc init <dir>` | Scaffold a new MVC application |
| `erwinmvc generate model <name>` | Generate a Prisma model |
| `erwinmvc generate controller <name>` | Generate a CRUD controller |

### Options

**init:**
- `--skip-install` - Skip running npm install
- `--skip-prisma` - Skip Prisma client generation

**generate model:**
- `--skip-migrate` - Skip running Prisma migrate

**generate controller:**
- `--no-views` - Skip generating EJS views

## Framework API

### App Factory

```typescript
import { createMvcApp, startServer } from "@erwininteractive/mvc";

const { app, redisClient } = await createMvcApp({
  viewsPath: "src/views",
  publicPath: "public",
});

startServer(app);
```

### Database

```typescript
import { getPrismaClient } from "@erwininteractive/mvc";

const prisma = getPrismaClient();
const users = await prisma.user.findMany();
```

### Authentication

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

### Routing

```typescript
import { registerControllers } from "@erwininteractive/mvc";

// Auto-register all *Controller.ts files
await registerControllers(app, path.resolve("src/controllers"));
```

## Environment Variables

Create a `.env` file with:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/yourdb?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
SESSION_SECRET="your-session-secret"
PORT=3000
NODE_ENV=development
```

## Project Structure

Generated applications follow this structure:

```
myapp/
├── src/
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── views/           # EJS templates
│   └── server.ts        # Entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── public/              # Static files
├── .env.example
├── package.json
└── tsconfig.json
```

## Controller Convention

Controllers export named functions that map to routes:

```typescript
// src/controllers/PostController.ts
export async function index(req, res) { /* GET /posts */ }
export async function show(req, res)  { /* GET /posts/:id */ }
export async function store(req, res) { /* POST /posts */ }
export async function update(req, res) { /* PUT /posts/:id */ }
export async function destroy(req, res) { /* DELETE /posts/:id */ }
```

## License

MIT
