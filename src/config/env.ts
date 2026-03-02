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
  /** Comma-separated allowed origins for CORS (e.g. http://localhost:3001,https://myapp.vercel.app) */
  corsOrigins: optionalList("CORS_ORIGIN", ["http://localhost:3000", "http://localhost:3001"]),
} as const;

export const isDev = env.nodeEnv === "development";
