import { Router } from "express";
import * as authController from "./auth.controller.js";
import { validateBody } from "../../middlewares/validate.js";
import { RegisterDto, LoginDto, RegisterOrgDto } from "./auth.dto.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireAdmin } from "../../middlewares/requireRole.middleware.js";

const router = Router();

router.post("/register", authMiddleware, requireAdmin, validateBody(RegisterDto), authController.register);
router.post("/register-organization", validateBody(RegisterOrgDto), authController.registerOrganization);
router.post("/login", validateBody(LoginDto), authController.login);

export const authRoutes = router;
