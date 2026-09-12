import "reflect-metadata";
import express from "express";
import cors from "cors";
import { createRequire } from "module";

const require_ = createRequire(import.meta.url);
const helmet = require_("helmet") as unknown as (options?: Record<string, unknown>) => express.RequestHandler;
const rateLimit = require_("express-rate-limit") as unknown as (options: Record<string, unknown>) => express.RequestHandler;
import path from "path";
import fs from "fs/promises";
import multer from "multer";
import { env } from "./config/env.js";
import { ensureDataSource } from "./config/init-db.js";
import { AppDataSource } from "./config/data-source.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { branchesRoutes } from "./modules/branches/branches.routes.js";
import { productsRoutes } from "./modules/products/products.routes.js";
import { ordersRoutes } from "./modules/orders/orders.routes.js";
import { inventoryRoutes } from "./modules/inventory/inventory.routes.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";
import { rolesRoutes } from "./modules/roles/roles.routes.js";
import { suppliersRoutes } from "./modules/suppliers/suppliers.routes.js";
import { recipesRoutes } from "./modules/recipes/recipes.routes.js";
import { purchaseOrdersRoutes } from "./modules/purchase-orders/purchase-orders.routes.js";
import { subscriptionRoutes } from "./modules/subscriptions/subscriptions.routes.js";

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

const authLimiter = rateLimit({
  windowMs: env.rateLimitAuthWindowMs,
  max: env.rateLimitAuthMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

const apiLimiter = rateLimit({
  windowMs: env.rateLimitApiWindowMs,
  max: env.rateLimitApiMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/register-organization", authLimiter);
app.use("/api", apiLimiter);

app.use(async (_req, _res, next) => {
  try {
    await ensureDataSource();
    next();
  } catch (err) {
    next(err);
  }
});

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
const LOGO_DIR = path.join(UPLOADS_ROOT, "logo");
const RECEIPTS_DIR = path.join(UPLOADS_ROOT, "receipts");

function isSafeLogoFilename(name: string): boolean {
  if (!name || name.length > 200) return false;
  if (name.includes("..") || name.includes("/") || name.includes("\\")) return false;
  return /^[a-zA-Z0-9._-]+$/.test(name);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdir(LOGO_DIR, { recursive: true }).then(() => cb(null, LOGO_DIR)).catch((err) => cb(err as Error, ""));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const safeExt = /^.[a-zA-Z0-9]+$/.test(ext) ? ext : ".png";
    cb(null, `logo-${Date.now()}${safeExt}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    cb(null, allowed);
  },
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/branches", branchesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/recipes", recipesRoutes);
app.use("/api/purchase-orders", purchaseOrdersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/suppliers", suppliersRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

app.post("/api/uploads/logo", authMiddleware, upload.single("logo"), (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "Logo file is required (multipart field: logo)" });
    return;
  }
  res.json({ filename: file.filename });
});

app.get("/api/files/logo/:filename", (req, res) => {
  const { filename } = req.params;
  if (!isSafeLogoFilename(filename)) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }
  const filePath = path.resolve(LOGO_DIR, filename);
  res.sendFile(filePath, { maxAge: "1d" }, (err) => {
    if (err) {
      if (!res.headersSent) res.status(404).json({ error: "Logo not found" });
    }
  });
});

app.get("/api/files/receipt/:filename", (req, res) => {
  const { filename } = req.params;
  if (!isSafeLogoFilename(filename)) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }
  const filePath = path.resolve(RECEIPTS_DIR, filename);
  res.sendFile(filePath, { maxAge: "1d" }, (err) => {
    if (err) {
      if (!res.headersSent) res.status(404).json({ error: "Receipt not found" });
    }
  });
});

app.get("/health", async (_req, res) => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.query("SELECT 1");
      res.json({ ok: true, db: "connected" });
    } else {
      res.status(503).json({ ok: false, db: "not initialized" });
    }
  } catch {
    res.status(503).json({ ok: false, db: "unreachable" });
  }
});

app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: Error & { code?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({ error: "Max file size is 2MB" });
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack || err.message);
  }
  res.status(500).json({ error: "Internal server error" });
});

export default app;
