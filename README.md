# @andrewthecoder/erwinmvc

[![npm version](https://img.shields.io/npm/v/@andrewthecoder/erwinmvc.svg)](https://www.npmjs.com/package/@andrewthecoder/erwinmvc)

A lightweight, full-featured MVC framework for Node.js 20+ built with TypeScript.

## Features

- **Express** - Fast, unopinionated web framework for routing and middleware
- **EJS Templating** - Server-side templating with embedded JavaScript
- **Prisma ORM** - Type-safe database client (optional, PostgreSQL/MySQL/SQLite support)
- **Redis Sessions** - Scalable session management with connect-redis
- **JWT Authentication** - Secure token-based auth with bcrypt password hashing
- **Session-Based Auth** - Traditional session management with Express-Session
- **WebAuthn (Passkeys)** - Passwordless authentication with security keys (YubiKey, Touch ID, Face ID)
- **Tailwind CSS** - Modern, utility-first CSS framework (optional, included with `--with-tailwind`)
- **Zod Validation** - Type-safe form validation with TypeScript-first schemas
- **CLI Tools** - Scaffold apps with `--with-tailwind`, generate models/controllers/resources
- **Flash Messages** - Session-based success/error messages for forms
- **Cookie Parser** - Built-in cookie parsing for JWT and session support
- **Helmet Security** - HTTP header security middleware
- **CORS Support** - Cross-origin resource sharing middleware
- **GitHub Actions CI** - Automated testing with optional CI setup

## Quick Start

```bash
npx @andrewthecoder/erwinmvc init myapp
cd myapp
npm run dev
```

Visit http://localhost:3000 - your app is running!

## CLI Commands

### Initialize a new app

```bash
# Basic app
npx @andrewthecoder/erwinmvc init myapp

# With Tailwind CSS
npx @andrewthecoder/erwinmvc init myapp --with-tailwind

# With database support (Prisma)
npx @andrewthecoder/erwinmvc init myapp --with-database

# With database + Tailwind
npx @andrewthecoder/erwinmvc init myapp --with-database --with-tailwind

# With GitHub Actions CI
npx @andrewthecoder/erwinmvc init myapp --with-ci

# Skip npm install (install manually later)
npx @andrewthecoder/erwinmvc init myapp --skip-install
```

### Generate models

```bash
# Generate a Prisma model
npx erwinmvc generate model User
npx erwinmvc g model User

# Generate without running migration
npx erwinmvc generate model User --skip-migrate
```

### Generate controllers

```bash
# Generate a CRUD controller
npx erwinmvc generate controller User
npx erwinmvc g controller User

# Generate without views
npx erwinmvc generate controller User --no-views
```

### Generate resources (model + controller + views)

```bash
# Complete resource with all features
npx erwinmvc generate resource Post
npx erwinmvc g resource Post

# Skip specific parts
npx erwinmvc generate resource Post --skip-model
npx erwinmvc generate resource Post --skip-views
npx erwinmvc generate resource Post --skip-controller

# Skip database migration
npx erwinmvc generate resource Post --skip-migrate

# API-only resource (no views, JSON responses)
npx erwinmvc generate resource Post --api-only
```

### Authentication commands

```bash
# Generate complete authentication system (login/register)
npx erwinmvc make:auth
npx erwinmvc ma

# Skip User model (use existing)
npx erwinmvc make:auth --without-model

# Only JWT (no sessions)
npx erwinmvc make:auth --jwt-only

# Only sessions (no JWT)
npx erwinmvc make:auth --session-only
```

### WebAuthn (Passkeys)

```bash
# Generate WebAuthn authentication (security key login)
npx erwinmvc webauthn
npx erwinmvc w

# Skip database migration
npx erwinmvc webauthn --skip-migrate
```

### List routes

```bash
# Show all defined routes
npx erwinmvc list:routes
npx erwinmvc lr
```

## Project Structure

```
myapp/
├── src/
│   ├── controllers/   # MVC controllers
│   ├── views/         # EJS templates
│   └── server.ts      # App entry point
├── public/            # Static assets
│   └── dist/          # Compiled CSS (Tailwind)
├── prisma/            # Database (optional)
│   └── schema.prisma  # Prisma schema
├── .github/           # CI workflows (optional)
├── package.json
├── tsconfig.json
├── tailwind.config.ts  # Tailwind config (optional)
└── postcss.config.cjs  # PostCSS config (optional)
```

## Database Setup

```bash
# Setup Prisma database
npx erwinmvc init myapp --with-database
cd myapp

# Edit .env with your DATABASE_URL
# DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client (auto-run by CLI)
npx prisma generate
```

## Tailwind CSS Setup

```bash
npx erwinmvc init myapp --with-tailwind
cd myapp

# Configure content paths in tailwind.config.ts
# Edit src/assets/tailwind.css for custom styles

# Build CSS
npx tailwindcss -i ./src/assets/tailwind.css -o ./public/dist/tailwind.css --watch
```

## Authentication

### Session + JWT Auth

The `make:auth` command generates:

- User model with password hashing
- Register/login forms with Zod validation
- Session-based authentication
- JWT token generation for API access
- Password verification with bcrypt
- Flash messages for errors/success

### WebAuthn (Passkeys)

The `webauthn` command generates:

- Passkey registration flow
- Passkey authentication flow
- User credential storage in database
- Security key support (YubiKey, Touch ID, Face ID)

## Validation

Use Zod schemas for type-safe form validation:

```typescript
import { z } from "zod";
import { validate } from "@andrewthecoder/erwinmvc";

const userSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8)
});

app.post("/users", validate(userSchema), async (req, res) => {
  const user = req.validatedBody; // Type-safe validated data
  // ...
});
```

## API Reference

### Core Functions

- `createMvcApp(options)` - Create Express app with views, static files
- `startServer(app)` - Start HTTP server on port 3000
- `hashPassword(plain)` - Hash password with bcrypt
- `verifyPassword(plain, hash)` - Verify password
- `signToken(payload, expiresIn)` - Sign JWT token
- `verifyToken(token)` - Verify and decode JWT
- `authenticate` - Express middleware for JWT authentication
- `validate(schema, strategy)` - Zod validation middleware

### WebAuthn Functions

- `startRegistration(req, res)` - Begin WebAuthn registration
- `completeRegistration(req, res)` - Complete WebAuthn registration
- `startAuthentication(req, res)` - Begin WebAuthn login
- `completeAuthentication(req, res)` - Complete WebAuthn login
- `getRPConfig()` - Get relying party configuration

### Validation Helpers

- `getFieldErrors(error)` - Extract field errors from Zod error
- `getOldInput(req)` - Get previously submitted form data
- `getErrors(req)` - Get flash error messages
- `hasFieldError(field, errors)` - Check if field has errors
- `getFieldError(field, errors)` - Get error message for field

## Environment Variables

Required for full functionality:

```env
# Required
JWT_SECRET=your-secret-key-here

# Database (optional)
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# WebAuthn (optional, defaults to localhost)
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=MyApp
```

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth
npm test -- cli
npm test -- generators

# With coverage
npm run test -- --coverage
```

## Production Build

```bash
# Build TypeScript and CLI
npm run build

# The app is ready for production deployment
# Server runs on port 3000
```

## License

MIT, see [LICENSE](LICENSE).

## Contributing

PRs welcome. Please open an issue first for major changes.
