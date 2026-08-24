import { Router } from "express";
import * as inventoryController from "./inventory.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireAdmin } from "../../middlewares/requireRole.middleware.js";
import { subscriptionGuard } from "../../middlewares/subscription.middleware.js";
import { validateBody, validateQuery } from "../../middlewares/validate.js";
import {
  GetInventoryItemsQueryDto,
  CreateInventoryItemDto,
  AdjustStockDto,
  GetStockMovementsQueryDto,
  RecordWasteDto,
} from "./inventory.dto.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard);

router.get("/", validateQuery(GetInventoryItemsQueryDto), inventoryController.getItems);
router.get("/summary", inventoryController.getSummary);
router.get("/low-stock", inventoryController.getLowStockItems);
router.get("/movements", validateQuery(GetStockMovementsQueryDto), inventoryController.getStockMovements);

router.post("/", requireAdmin, validateBody(CreateInventoryItemDto), inventoryController.createItem);
router.post("/adjust", requireAdmin, validateBody(AdjustStockDto), inventoryController.adjustStock);
router.post("/waste", requireAdmin, validateBody(RecordWasteDto), inventoryController.recordWaste);

router.get("/:id", inventoryController.getItemById);
router.get("/:id/history", inventoryController.getItemHistory);
router.put("/:id", requireAdmin, inventoryController.updateItem);
router.delete("/:id", requireAdmin, inventoryController.deleteItem);

export const inventoryRoutes = router;
