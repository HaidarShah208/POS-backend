import "reflect-metadata";
import "dotenv/config";
import { AppDataSource } from "../config/data-source.js";

async function run() {
  await AppDataSource.initialize();
  const executed = await AppDataSource.runMigrations();
  console.log(`Ran ${executed.length} migration(s):`, executed.map((m) => m.name));
  await AppDataSource.destroy();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
