import express from "express";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { branchesRoutes } from "./modules/branches/branches.routes.js";
import { productsRoutes } from "./modules/products/products.routes.js";
import { ordersRoutes } from "./modules/orders/orders.routes.js";
import { inventoryRoutes } from "./modules/inventory/inventory.routes.js";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/branches", branchesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/inventory", inventoryRoutes);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
