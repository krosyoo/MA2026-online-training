import { config } from "dotenv";

/**
 * Loads `.env` for local development. On Vercel the file does not exist and
 * real environment variables are already present — dotenv never overwrites
 * those, so importing this module is a no-op there.
 *
 * Import it before anything that reads `process.env` at module scope.
 */
config();
