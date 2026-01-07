# My MVC App

Built with [@erwininteractive/mvc](https://github.com/erwininteractive/mvc).

## Quick Start

```bash
npm run dev
```

Visit http://localhost:3000

---

## Getting Started

### Step 1: Create a New Page

Create a new file `src/views/about.ejs`:

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

Edit `src/server.ts` and add a route for your page:

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

Create `.ejs` files in `src/views/`. EJS lets you use JavaScript in your HTML:

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

Edit `src/server.ts` to add routes:

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

Controllers help organize your route handlers. Generate one with the CLI:

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

Import and wire up your controller in `src/server.ts`:

```typescript
import * as ProductController from "./controllers/ProductController";

app.get("/products", ProductController.index);
app.get("/products/:id", ProductController.show);
app.post("/products", ProductController.store);
app.put("/products/:id", ProductController.update);
app.delete("/products/:id", ProductController.destroy);
```

### Writing a Simple Controller

```typescript
// src/controllers/PagesController.ts
import { Request, Response } from "express";

export function home(req: Request, res: Response) {
  res.render("home", { title: "Home" });
}

export function about(req: Request, res: Response) {
  res.render("about", { title: "About Us" });
}
```

---

## Database (Optional)

This app works without a database. Add one when you need it.

### Step 1: Setup Prisma

```bash
npm run db:setup
```

### Step 2: Configure Database URL

Copy `.env.example` to `.env` and set your database URL:

```
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

### Step 3: Run Migrations

```bash
npx prisma migrate dev --name init
```

### Step 4: Generate Models

```bash
npx erwinmvc generate model Post
```

This adds a model to `prisma/schema.prisma`. Edit it to add your fields:

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

Then run migrations again:

```bash
npx prisma migrate dev --name add-post-fields
```

### Step 5: Use in Your Code

```typescript
import { getPrismaClient } from "@erwininteractive/mvc";

const prisma = getPrismaClient();

// List all posts
app.get("/posts", async (req, res) => {
  const posts = await prisma.post.findMany();
  res.render("posts/index", { posts });
});

// Get single post
app.get("/posts/:id", async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: Number(req.params.id) }
  });
  res.render("posts/show", { post });
});

// Create post
app.post("/posts", async (req, res) => {
  const post = await prisma.post.create({
    data: { title: req.body.title, content: req.body.content }
  });
  res.redirect(`/posts/${post.id}`);
});
```

---

## Project Structure

```
src/
  server.ts           # Main app - add routes here
  views/
    index.ejs         # Home page
    *.ejs             # Your page templates
  controllers/        # Route handlers (optional)
  middleware/         # Express middleware (optional)
public/               # Static files (served directly)
  css/                # Stylesheets
  js/                 # Client-side JavaScript
  images/             # Images
prisma/               # Database (after db:setup)
  schema.prisma       # Database models
```

### Static Files

Files in `public/` are served at the root URL:

- `public/css/style.css` → http://localhost:3000/css/style.css
- `public/images/logo.png` → http://localhost:3000/images/logo.png
- `public/js/app.js` → http://localhost:3000/js/app.js

Link to them in your templates:

```html
<link rel="stylesheet" href="/css/style.css">
<script src="/js/app.js"></script>
<img src="/images/logo.png" alt="Logo">
```

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (auto-reload) |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run db:setup` | Install database dependencies |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema changes (no migration) |

### CLI Commands

| Command | Description |
|---------|-------------|
| `npx erwinmvc generate controller <Name>` | Create a CRUD controller |
| `npx erwinmvc generate model <Name>` | Create a database model |

---

## Learn More

- [Express.js Documentation](https://expressjs.com/)
- [EJS Documentation](https://ejs.co/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Alpine.js Documentation](https://alpinejs.dev/)
