import express, { Express } from "express";
import session from "express-session";
import { createClient, RedisClientType } from "redis";
import RedisStore from "connect-redis";
import helmet from "helmet";
import cors from "cors";
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
