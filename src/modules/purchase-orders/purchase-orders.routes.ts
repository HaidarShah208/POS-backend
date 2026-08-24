import { Router } from "express";
import * as ctrl from "./purchase-orders.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireAdmin } from "../../middlewares/requireRole.middleware.js";
import { subscriptionGuard } from "../../middlewares/subscription.middleware.js";
import { validateBody, validateQuery } from "../../middlewares/validate.js";
import { CreatePurchaseOrderDto, ReceiveItemsDto, GetPurchaseOrdersQueryDto } from "./purchase-orders.dto.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard);

router.get("/", validateQuery(GetPurchaseOrdersQueryDto), ctrl.getPurchaseOrders);
router.get("/:id", ctrl.getPurchaseOrderById);
router.post("/", requireAdmin, validateBody(CreatePurchaseOrderDto), ctrl.createPurchaseOrder);
router.post("/:id/receive", requireAdmin, validateBody(ReceiveItemsDto), ctrl.receiveItems);
router.patch("/:id/cancel", requireAdmin, ctrl.cancelPurchaseOrder);

export const purchaseOrdersRoutes = router;
