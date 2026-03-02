import { Router } from "express";
import * as branchesController from "./branches.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", branchesController.getAll);
router.get("/:id", branchesController.getById);
router.post("/", authMiddleware, branchesController.create);

export const branchesRoutes = router;
