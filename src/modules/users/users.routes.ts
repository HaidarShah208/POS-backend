import { Router } from "express";
import * as usersController from "./users.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/branch/:branchId", usersController.getByBranch);
router.get("/:id", usersController.getById);

export const usersRoutes = router;
