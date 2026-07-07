import "reflect-metadata";
import { AppDataSource } from "./data-source.js";

let initPromise: Promise<void> | null = null;

export async function ensureDataSource(): Promise<void> {
  if (AppDataSource.isInitialized) return;

  if (!initPromise) {
    initPromise = AppDataSource.initialize()
      .then(() => undefined)
      .catch((err) => {
        initPromise = null;
        throw err;
      });
  }

  await initPromise;
}
