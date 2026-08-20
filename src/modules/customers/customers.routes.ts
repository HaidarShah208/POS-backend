import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { subscriptionGuard } from "../../middlewares/subscription.middleware.js";
import * as ctrl from "./customers.controller.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard);

router.get("/", ctrl.getCustomers);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);
router.patch("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export const customersRoutes = router;
