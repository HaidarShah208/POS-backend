import { Router } from "express";
import * as ordersController from "./orders.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { subscriptionGuard } from "../../middlewares/subscription.middleware.js";
import { validateBody, validateQuery } from "../../middlewares/validate.js";
import {
  PlaceOrderDto,
  GetOrdersQueryDto,
  UpdateOrderStatusDto,
} from "./orders.dto.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard);

router.post(
  "/",
  validateBody(PlaceOrderDto),
  ordersController.placeOrder
);
router.get(
  "/",
  validateQuery(GetOrdersQueryDto),
  ordersController.getOrders
);
router.get("/branch/:branchId", ordersController.getByBranch);
router.get("/kitchen/:branchId", ordersController.getKitchenOrders);
router.patch("/kitchen/status", ordersController.updateKitchenStatus);
router.get("/:id", ordersController.getById);
router.patch(
  "/:id/status",
  validateBody(UpdateOrderStatusDto),
  ordersController.updateOrderStatus
);

export const ordersRoutes = router;
