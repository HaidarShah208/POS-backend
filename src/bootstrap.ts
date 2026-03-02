import "dotenv/config";
import { resolveDatabaseUrlToIPv4 } from "./config/resolve-database-url.js";

async function main() {
  const url = process.env.DATABASE_URL;
  if (url) {
    try {
      const resolved = await resolveDatabaseUrlToIPv4(url);
      if (resolved !== url) {
        process.env.DATABASE_URL = resolved;
      }
    } catch (_) {
      // keep original URL
    }
  }
  await import("./server.js");
}

main();
