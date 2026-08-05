import { ConfigurationError } from "./env";
import cookieParser from "cookie-parser";
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { registerRoutes } from "./routes";

export function log(message: string, source = "express"): void {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Builds the Express app with the API mounted, and nothing else. Serving the
 * client is left to the caller: locally that is Vite's dev middleware
 * (`server/index.ts`), on Vercel it is the CDN, which never reaches this app.
 */
export function createApp(): Express {
  const app = express();

  // Vercel terminates TLS upstream; without this, `secure` cookies are dropped.
  app.set("trust proxy", 1);

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      if (req.path.startsWith("/api")) {
        log(
          `${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`,
        );
      }
    });
    next();
  });

  registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    if (res.headersSent) return;

    // A missing environment variable is the operator's problem, not the user's,
    // and the message names the exact setting — worth returning verbatim so a
    // half-configured deployment diagnoses itself.
    if (err instanceof ConfigurationError) {
      res.status(503).json({ message: err.message });
      return;
    }

    const status = err?.status || err?.statusCode || 500;
    res.status(status).json({
      message:
        status === 500 ? "서버 오류가 발생했습니다." : err?.message || "Error",
    });
  });

  return app;
}
