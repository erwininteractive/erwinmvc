# @erwininteractive/mvc

A lightweight, full-featured MVC framework for Node.js 20+ built with TypeScript.

## Features

- **Express** - Fast, minimal web framework
- **EJS + Alpine.js** - Server-side templating with reactive client-side components
- **Optional Database** - Add Prisma + PostgreSQL when you need it
- **Optional Redis Sessions** - Scalable session management
- **JWT Authentication** - Secure token-based auth with bcrypt password hashing
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

## Controllers

Generate a controller with the CLI:

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

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `npx @erwininteractive/mvc init <dir>` | Create a new app |
| `npx erwinmvc generate controller <name>` | Generate a CRUD controller |
| `npx erwinmvc generate model <name>` | Generate a database model |

### Init Options

| Option | Description |
|--------|-------------|
| `--skip-install` | Skip running npm install |
| `--with-database` | Include Prisma database setup |

### Generate Options

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
