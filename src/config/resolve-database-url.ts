import "dotenv/config";
import dns from "node:dns/promises";

/**
 * Resolves the database URL host to IPv4 when possible.
 * Fixes ENETUNREACH on platforms (e.g. Railway) where IPv6 is resolved but not reachable.
 */
export async function resolveDatabaseUrlToIPv4(url: string): Promise<string> {
  if (!url || !url.startsWith("postgres")) return url;

  const hostMatch = url.match(/@(\[[^\]]+\]|[^:\/]+)(?::(\d+))?(\/|$)/);
  if (!hostMatch) return url;

  const host = hostMatch[1];
  if (host.startsWith("[")) return url;
  if (host === "localhost" || host === "127.0.0.1" || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return url;
  }

  try {
    const addresses = await dns.resolve4(host);
    if (addresses.length === 0) return url;
    const ipv4 = addresses[0];
    return url.replace(hostMatch[1], ipv4);
  } catch {
    return url;
  }
}
