import { Router } from "express";
import * as ordersController from "./orders.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validate.js";
import { PlaceOrderDto } from "./orders.dto.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  validateBody(PlaceOrderDto),
  ordersController.placeOrder
);
router.get("/branch/:branchId", authMiddleware, ordersController.getByBranch);
router.get("/kitchen/:branchId", authMiddleware, ordersController.getKitchenOrders);
router.patch("/kitchen/status", authMiddleware, ordersController.updateKitchenStatus);
router.get("/:id", authMiddleware, ordersController.getById);

export const ordersRoutes = router;
