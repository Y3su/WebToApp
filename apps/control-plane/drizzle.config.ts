import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/server/db/schema.ts",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgres://webtoapp:webtoapp@localhost:5432/webtoapp",
  },
  strict: true,
  verbose: true,
});
