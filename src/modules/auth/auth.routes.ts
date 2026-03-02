import { Router } from "express";
import * as authController from "./auth.controller.js";
import { validateBody } from "../../middlewares/validate.js";
import { RegisterDto, LoginDto } from "./auth.dto.js";

const router = Router();

router.post("/register", validateBody(RegisterDto), authController.register);
router.post("/login", validateBody(LoginDto), authController.login);

export const authRoutes = router;
