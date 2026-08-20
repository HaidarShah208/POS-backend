import "dotenv/config";

function required(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    const hint =
      typeof process.env.RAILWAY_ENVIRONMENT !== "undefined"
        ? " Set it in Railway: Project → your service → Variables."
        : typeof process.env.VERCEL !== "undefined"
          ? " Set it in Vercel: Project Settings → Environment Variables."
          : " Add it to your .env file or set it in your hosting platform.";
    throw new Error(`Missing required env: ${key}.${hint}`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function optionalInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? fallback : parsed;
}

function optionalList(key: string, fallback: string[]): string[] {
  const raw = process.env[key];
  if (!raw || raw.trim() === "") return fallback;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export const env = {
  nodeEnv: optional("NODE_ENV", "development"),
  port: parseInt(optional("PORT", "3000"), 10),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: optional("JWT_EXPIRES_IN", "7d"),
  CORS_ORIGIN: optionalList("CORS_ORIGIN", ["http://localhost:3001"]),

  dbPoolMax: optionalInt("DB_POOL_MAX", 20),
  dbPoolMin: optionalInt("DB_POOL_MIN", 2),
  dbConnectionTimeout: optionalInt("DB_CONNECTION_TIMEOUT", 10000),
  dbIdleTimeout: optionalInt("DB_IDLE_TIMEOUT", 30000),

  rateLimitAuthMax: optionalInt("RATE_LIMIT_AUTH_MAX", 20),
  rateLimitAuthWindowMs: optionalInt("RATE_LIMIT_AUTH_WINDOW_MS", 15 * 60 * 1000),
  rateLimitApiMax: optionalInt("RATE_LIMIT_API_MAX", 200),
  rateLimitApiWindowMs: optionalInt("RATE_LIMIT_API_WINDOW_MS", 60 * 1000),
} as const;

export const isDev = env.nodeEnv === "development";
export const isProd = env.nodeEnv === "production";
