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
    console.error("Database connection failed:", err);
    process.exit(1);
  }

  const port = env.port;
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

main();
