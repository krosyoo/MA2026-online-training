import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Run `vercel env pull .env` to fetch it from the " +
      "Vercel project, or copy .env.example to .env for local development.",
  );
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url },
});
