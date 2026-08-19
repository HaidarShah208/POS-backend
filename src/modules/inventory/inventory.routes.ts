import { Router } from "express";
import * as inventoryController from "./inventory.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireAdmin } from "../../middlewares/requireRole.middleware.js";
import { subscriptionGuard } from "../../middlewares/subscription.middleware.js";
import { validateBody, validateQuery } from "../../middlewares/validate.js";
import { AdjustStockDto, GetInventoryQueryDto } from "./inventory.dto.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard);

router.get(
  "/",
  validateQuery(GetInventoryQueryDto),
  inventoryController.getInventory
);
router.get(
  "/branch/:branchId",
  validateQuery(GetInventoryQueryDto),
  inventoryController.getInventory
);
router.post(
  "/adjust",
  requireAdmin,
  validateBody(AdjustStockDto),
  inventoryController.adjustStock
);

export const inventoryRoutes = router;
