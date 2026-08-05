import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../server/app";

// Created at module scope so warm invocations reuse the same app.
const app = createApp();

/**
 * Vercel routes every `/api/*` request into this catch-all function. An Express
 * app is itself a `(req, res)` handler, so it can be handed the raw objects.
 *
 * The URL is normalised first: the router mounts on `/api`, and this keeps the
 * function working whether the platform forwards the original path or strips
 * the `/api` prefix when resolving the catch-all.
 */
export default function handler(
  req: IncomingMessage,
  res: ServerResponse,
): void {
  if (req.url && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(
    req,
    res,
  );
}
