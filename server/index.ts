import { createServer } from "http";
import { createApp, log } from "./app";
import { serveStatic, setupVite } from "./vite";

/**
 * Local / self-hosted entrypoint: one long-running process that serves both the
 * API and the client. Vercel does not use this file — it runs the same app
 * through `api/[...path].ts` and serves the client from the CDN.
 */
(async () => {
  const app = createApp();
  const server = createServer(app);

  // Vite must be set up after the API routes so its catch-all does not shadow
  // them.
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
