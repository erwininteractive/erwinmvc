import express, { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { createClient, RedisClientType } from "redis";
import RedisStore from "connect-redis";
import helmet from "helmet";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config();

export interface MvcAppOptions {
  /** Directory for EJS views (default: "src/views") */
  viewsPath?: string;
  /** Directory for static files (default: "public") */
  publicPath?: string;
  /** Directory for controllers (default: "src/controllers") */
  controllersPath?: string;
  /** Enable Redis sessions (default: true if REDIS_URL is set) */
  enableRedis?: boolean;
  /** Custom CORS options */
  corsOptions?: cors.CorsOptions;
  /** Custom Helmet options */
  helmetOptions?: Parameters<typeof helmet>[0];
}

export interface MvcApp {
  app: Express;
  redisClient: RedisClientType | null;
}

/**
 * Create and configure an Express MVC application.
 *
 * Includes:
 * - Helmet for security headers
 * - CORS support
 * - JSON and URL-encoded body parsing
 * - Redis-backed sessions (if REDIS_URL is set)
 * - EJS view engine
 * - Static file serving
 */
export async function createMvcApp(options: MvcAppOptions = {}): Promise<MvcApp> {
  const {
    viewsPath = "src/views",
    publicPath = "public",
    enableRedis = !!process.env.REDIS_URL,
    corsOptions = {},
    helmetOptions = {},
  } = options;

  const app = express();

  // Security middleware
  app.use(helmet(helmetOptions));
  app.use(cors(corsOptions));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static files
  app.use(express.static(path.resolve(publicPath)));

  // Session store (Redis if available, memory otherwise)
  let redisClient: RedisClientType | null = null;

  if (enableRedis && process.env.REDIS_URL) {
    try {
      redisClient = createClient({ url: process.env.REDIS_URL });
      await redisClient.connect();

      const store = new RedisStore({
        client: redisClient,
        prefix: "mvc:",
      });

      app.use(
        session({
          store,
          secret: process.env.SESSION_SECRET || "default-secret-change-me",
          resave: false,
          saveUninitialized: false,
          cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
          },
        })
      );
      console.log("Using Redis session store");
    } catch (err) {
      console.warn("Failed to connect to Redis, using memory sessions:", err);
      redisClient = null;
      setupMemorySessions(app);
    }
  } else {
    // Use memory sessions when Redis is not configured
    setupMemorySessions(app);
  }

  // View engine
  app.set("view engine", "ejs");
  app.set("views", path.resolve(viewsPath));

  // Auto-inject authenticated user into views via res.locals
  app.use((req: Request & { user?: any }, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        req.user = decoded;
        res.locals.user = decoded;
      }
    } catch {
      // Token invalid or expired
    }
    next();
  });

  // Add respond helper to response
  app.use((req, res, next) => {
    (res as any).respond = function (viewName: string, data: Record<string, unknown>) {
      const accept = req.headers.accept as string | undefined;
      if (accept?.includes("application/json")) {
        res.json(data);
      } else {
        res.render(viewName, data);
      }
      return res;
    };
    next();
  });

  return { app, redisClient };
}

/**
 * Setup memory-based sessions (for development without Redis).
 */
function setupMemorySessions(app: Express): void {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "default-secret-change-me",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
      },
    })
  );
}

/**
 * Start the Express server.
 */
export function startServer(
  app: Express,
  port: number = Number(process.env.PORT) || 3000
): void {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

/**
 * Helper for content negotiation - respond with EJS view or JSON based on Accept header.
 * @param res - Express response object
 * @param viewName - Name of the EJS view to render (without extension)
 * @param data - Data to pass to the view or send as JSON
 * 
 * If Accept header contains "text/html", renders the view.
 * If Accept header contains "application/json", sends JSON response.
 */
export function respond(
  res: Response,
  viewName: string,
  data: Record<string, unknown>
): Response {
  const accept = res.getHeader("Accept") as string | undefined;
  
  if (accept?.includes("application/json")) {
    res.json(data);
  } else {
    res.render(viewName, data);
  }
  return res;
}

// Extend Express types to include respond method
declare global {
  namespace Express {
    interface Response {
      respond: typeof respond;
    }
  }
}
