import { Router } from "express";
import * as ctrl from "./recipes.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireAdmin } from "../../middlewares/requireRole.middleware.js";
import { subscriptionGuard } from "../../middlewares/subscription.middleware.js";
import { validateBody } from "../../middlewares/validate.js";
import { CreateRecipeDto, UpdateRecipeDto } from "./recipes.dto.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard);

router.get("/", ctrl.getRecipes);
router.get("/:id", ctrl.getRecipeById);
router.post("/", requireAdmin, validateBody(CreateRecipeDto), ctrl.createRecipe);
router.put("/:id", requireAdmin, validateBody(UpdateRecipeDto), ctrl.updateRecipe);
router.delete("/:id", requireAdmin, ctrl.deleteRecipe);

export const recipesRoutes = router;
