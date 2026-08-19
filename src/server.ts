import "reflect-metadata";
import http from "http";
import app from "./app.js";
import { env, isDev } from "./config/env.js";
import { ensureDataSource } from "./config/init-db.js";
import { AppDataSource } from "./config/data-source.js";

let server: http.Server;

async function main() {
  try {
    await ensureDataSource();
    if (isDev) {
      console.log("Database connected");
    }
  } catch (err) {
    const e = err as { code?: string; address?: string };
    if (e.code === "ENETUNREACH" && typeof e.address === "string" && e.address.includes(":")) {
      console.error(
        "Database connection failed (IPv6 unreachable). Use Supabase Connection Pooler (Session mode) URI."
      );
    }
    console.error("Database connection failed:", err);
    process.exit(1);
  }

  const port = env.port;
  server = app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

async function shutdown(signal: string) {
  console.log(`${signal} received. Shutting down gracefully...`);

  if (server) {
    server.close(() => {
      console.log("HTTP server closed");
    });
  }

  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("Database connection closed");
    }
  } catch {
    console.error("Error closing database connection");
  }

  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

main();
