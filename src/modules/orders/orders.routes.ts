import { Router } from "express";
import * as ordersController from "./orders.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validateBody, validateQuery } from "../../middlewares/validate.js";
import {
  PlaceOrderDto,
  GetOrdersQueryDto,
  UpdateOrderStatusDto,
} from "./orders.dto.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  validateBody(PlaceOrderDto),
  ordersController.placeOrder
);
router.get(
  "/",
  authMiddleware,
  validateQuery(GetOrdersQueryDto),
  ordersController.getOrders
);
router.get("/branch/:branchId", authMiddleware, ordersController.getByBranch);
router.get("/kitchen/:branchId", authMiddleware, ordersController.getKitchenOrders);
router.patch("/kitchen/status", authMiddleware, ordersController.updateKitchenStatus);
router.get("/:id", authMiddleware, ordersController.getById);
router.patch(
  "/:id/status",
  authMiddleware,
  validateBody(UpdateOrderStatusDto),
  ordersController.updateOrderStatus
);

export const ordersRoutes = router;
