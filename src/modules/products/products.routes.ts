import { Router } from "express";
import * as productsController from "./products.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireAdmin } from "../../middlewares/requireRole.middleware.js";
import { subscriptionGuard } from "../../middlewares/subscription.middleware.js";
import { validateBody, validateQuery } from "../../middlewares/validate.js";
import {
  CreateProductDto,
  UpdateProductDto,
  GetProductsQueryDto,
} from "./products.dto.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard);

router.get("/categories", productsController.getCategories);
router.get("/categories/:id", productsController.getCategoryById);
router.post("/categories", requireAdmin, productsController.createCategory);
router.patch("/categories/:id", requireAdmin, productsController.updateCategory);
router.delete("/categories/:id", requireAdmin, productsController.deleteCategory);

router.get(
  "/",
  validateQuery(GetProductsQueryDto),
  productsController.getProducts
);
router.get("/:id", productsController.getProductById);
router.post(
  "/",
  requireAdmin,
  validateBody(CreateProductDto),
  productsController.createProduct
);
router.put(
  "/:id",
  requireAdmin,
  validateBody(UpdateProductDto),
  productsController.updateProduct
);
router.patch(
  "/:id",
  requireAdmin,
  validateBody(UpdateProductDto),
  productsController.updateProduct
);
router.delete("/:id", requireAdmin, productsController.deleteProduct);

export const productsRoutes = router;
