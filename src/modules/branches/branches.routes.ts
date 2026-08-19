import { Router } from "express";
import * as branchesController from "./branches.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireAdmin } from "../../middlewares/requireRole.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", branchesController.getAll);
router.get("/:id", branchesController.getById);
router.post("/", requireAdmin, branchesController.create);

export const branchesRoutes = router;
