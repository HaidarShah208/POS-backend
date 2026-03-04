import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs/promises";
import multer from "multer";
import { env } from "./config/env.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { branchesRoutes } from "./modules/branches/branches.routes.js";
import { productsRoutes } from "./modules/products/products.routes.js";
import { ordersRoutes } from "./modules/orders/orders.routes.js";
import { inventoryRoutes } from "./modules/inventory/inventory.routes.js";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "2mb" }));

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
const LOGO_DIR = path.join(UPLOADS_ROOT, "logo");

/** Allow only safe filenames: no path separators, no directory traversal */
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

app.post("/api/uploads/logo", upload.single("logo"), (req, res, next) => {
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

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use((err: Error & { code?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({ error: "Max file size is 2MB only" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
