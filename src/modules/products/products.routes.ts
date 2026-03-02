import { Router } from "express";
import * as productsController from "./products.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/categories", productsController.getCategories);
router.get("/categories/:id", productsController.getCategoryById);
router.post("/categories", authMiddleware, productsController.createCategory);
router.patch("/categories/:id", authMiddleware, productsController.updateCategory);
router.delete("/categories/:id", authMiddleware, productsController.deleteCategory);

router.get("/", productsController.getProducts);
router.get("/:id", productsController.getProductById);
router.post("/", authMiddleware, productsController.createProduct);
router.patch("/:id", authMiddleware, productsController.updateProduct);
router.delete("/:id", authMiddleware, productsController.deleteProduct);

export const productsRoutes = router;
