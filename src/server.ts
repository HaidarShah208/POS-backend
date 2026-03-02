import "reflect-metadata";
import app from "./app.js";
import { env, isDev } from "./config/env.js";
import { AppDataSource } from "./config/data-source.js";

async function main() {
  try {
    await AppDataSource.initialize();
    if (isDev) {
      console.log("Database connected");
    }
  } catch (err) {
    const e = err as { code?: string; address?: string };
    if (e.code === "ENETUNREACH" && typeof e.address === "string" && e.address.includes(":")) {
      console.error(
        "Database connection failed (IPv6 unreachable). The app tried to use an IPv4-resolved URL; if this persists, set NODE_OPTIONS=--dns-result-order=ipv4first in Railway Variables, or use Supabase Connection Pooler (Session mode) URI."
      );
    }
    console.error("Database connection failed:", err);
    process.exit(1);
  }

  const port = env.port;
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

main();
