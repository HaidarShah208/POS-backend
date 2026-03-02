import { Router } from "express";
import * as productsController from "./products.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireAdmin } from "../../middlewares/requireRole.middleware.js";
import { validateBody, validateQuery } from "../../middlewares/validate.js";
import {
  CreateProductDto,
  UpdateProductDto,
  GetProductsQueryDto,
} from "./products.dto.js";

const router = Router();

router.get("/categories", productsController.getCategories);
router.get("/categories/:id", productsController.getCategoryById);
router.post("/categories", authMiddleware, productsController.createCategory);
router.patch("/categories/:id", authMiddleware, productsController.updateCategory);
router.delete("/categories/:id", authMiddleware, productsController.deleteCategory);

router.get(
  "/",
  validateQuery(GetProductsQueryDto),
  productsController.getProducts
);
router.get("/:id", productsController.getProductById);
router.post(
  "/",
  authMiddleware,
  requireAdmin,
  validateBody(CreateProductDto),
  productsController.createProduct
);
router.put(
  "/:id",
  authMiddleware,
  requireAdmin,
  validateBody(UpdateProductDto),
  productsController.updateProduct
);
router.patch(
  "/:id",
  authMiddleware,
  requireAdmin,
  validateBody(UpdateProductDto),
  productsController.updateProduct
);
router.delete("/:id", authMiddleware, requireAdmin, productsController.deleteProduct);

export const productsRoutes = router;
