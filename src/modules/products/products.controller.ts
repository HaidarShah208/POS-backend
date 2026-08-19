import { Request, Response } from "express";
import * as productsService from "./products.service.js";
import type { GetProductsQueryDto } from "./products.dto.js";
import { getOrgId } from "../../middlewares/tenant.middleware.js";

export async function getCategories(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  const list = await productsService.getCategories(orgId);
  res.json(list);
}

export async function getCategoryById(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  const cat = await productsService.getCategoryById(req.params.id, orgId);
  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json(cat);
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  const cat = await productsService.createCategory(req.body, orgId);
  res.status(201).json(cat);
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  const cat = await productsService.updateCategory(req.params.id, req.body, orgId);
  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json(cat);
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  const ok = await productsService.deleteCategory(req.params.id, orgId);
  if (!ok) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.status(204).send();
}

export async function getProducts(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as GetProductsQueryDto;
  const orgId = getOrgId(req);
  const branchId = query.lowStockOnly ? req.user?.branchId : undefined;
  const result = await productsService.getProducts({
    page: query.page,
    limit: query.limit,
    search: query.search,
    categoryId: query.categoryId,
    lowStockOnly: query.lowStockOnly,
    branchId,
    organizationId: orgId,
  });
  res.json(result);
}

export async function getProductById(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  const product = await productsService.getProductById(req.params.id, orgId);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(product);
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  const product = await productsService.createProduct(req.body, orgId);
  res.status(201).json(product);
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  const product = await productsService.updateProduct(req.params.id, req.body, orgId);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(product);
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  const ok = await productsService.deleteProduct(req.params.id, orgId);
  if (!ok) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.status(204).send();
}
