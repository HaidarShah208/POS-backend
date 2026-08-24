import { Router } from "express";
import * as adminController from "./admin.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireSuperAdmin } from "../../middlewares/requireRole.middleware.js";

const router = Router();

router.use(authMiddleware, requireSuperAdmin);

router.get("/stats", adminController.getPlatformStats);
router.get("/organizations", adminController.getOrganizations);
router.get("/organizations/:id", adminController.getOrganizationById);
router.get("/organizations/:id/payments", adminController.getOrganizationPayments);
router.patch("/organizations/:id", adminController.updateOrganization);
router.patch("/organizations/:id/status", adminController.updateOrganizationStatus);

export const adminRoutes = router;
