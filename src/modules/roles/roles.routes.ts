import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { subscriptionGuard } from "../../middlewares/subscription.middleware.js";
import { requireAdmin } from "../../middlewares/requireRole.middleware.js";
import * as rolesCtrl from "./roles.controller.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard);

router.get("/", rolesCtrl.getRoles);
router.get("/:id", rolesCtrl.getRoleById);
router.post("/", requireAdmin, rolesCtrl.createRole);
router.put("/:id", requireAdmin, rolesCtrl.updateRole);
router.delete("/:id", requireAdmin, rolesCtrl.deleteRole);

export const rolesRoutes = router;
