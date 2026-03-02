import { AppDataSource } from "../../config/data-source.js";
import { Products } from "../../models/Products.js";
import { Categories } from "../../models/Categories.js";
import { Inventory } from "../../models/Inventory.js";
import { Branches } from "../../models/Branches.js";

const productRepo = () => AppDataSource.getRepository(Products);
const categoryRepo = () => AppDataSource.getRepository(Categories);
const inventoryRepo = () => AppDataSource.getRepository(Inventory);
const branchRepo = () => AppDataSource.getRepository(Branches);

// Categories
export async function getCategories() {
  return categoryRepo().find({ order: { sortOrder: "ASC", name: "ASC" } });
}

export async function getCategoryById(id: string) {
  return categoryRepo().findOne({ where: { id } });
}

export async function createCategory(data: { name: string; slug: string; sortOrder?: number }) {
  const cat = categoryRepo().create({
    ...data,
    sortOrder: data.sortOrder ?? 0,
  });
  return categoryRepo().save(cat);
}

export async function updateCategory(
  id: string,
  data: Partial<{ name: string; slug: string; sortOrder: number }>
) {
  await categoryRepo().update(id, data as object);
  return categoryRepo().findOneOrFail({ where: { id } });
}

export async function deleteCategory(id: string) {
  const r = await categoryRepo().delete(id);
  return (r.affected ?? 0) > 0;
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
  branchId?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Products
export async function getProducts(params: GetProductsParams = {}): Promise<PaginatedResult<Products>> {
  const { page = 1, limit = 20, search, categoryId, lowStockOnly, branchId } = params;
  const skip = (page - 1) * limit;

  const qb = productRepo()
    .createQueryBuilder("p")
    .leftJoinAndSelect("p.category", "category")
    .orderBy("p.name", "ASC");

  if (categoryId) {
    qb.andWhere("p.category_id = :categoryId", { categoryId });
  }

  if (search && search.trim()) {
    qb.andWhere("(p.name ILIKE :search OR p.sku ILIKE :search OR p.barcode ILIKE :search)", {
      search: `%${search.trim()}%`,
    });
  }

  if (lowStockOnly && branchId) {
    qb.innerJoin(
      "inventory",
      "inv",
      "inv.product_id = p.id AND inv.branch_id = :branchId AND inv.current_stock < inv.low_stock_threshold",
      { branchId }
    );
  }

  const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getProductById(id: string) {
  return productRepo().findOne({
    where: { id },
    relations: ["category"],
  });
}

export async function createProduct(data: {
  categoryId: string;
  name: string;
  price: number;
  cost?: number;
  sku?: string;
  barcode?: string;
  image?: string;
  description?: string;
  status?: string;
  modifiers?: { id: string; name: string; price: number }[];
}) {
  const product = productRepo().create({
    ...data,
    status: data.status ?? "active",
  });
  const saved = await productRepo().save(product);

  const branches = await branchRepo().find({ select: ["id"] });
  for (const branch of branches) {
    const inv = inventoryRepo().create({
      productId: saved.id,
      branchId: branch.id,
      currentStock: 0,
      lowStockThreshold: 0,
    });
    await inventoryRepo().save(inv);
  }

  return productRepo().findOneOrFail({
    where: { id: saved.id },
    relations: ["category"],
  });
}

export async function updateProduct(
  id: string,
  data: Partial<{
    categoryId: string;
    name: string;
    price: number;
    cost: number;
    sku: string;
    barcode: string;
    image: string;
    description: string;
    status: string;
    modifiers: { id: string; name: string; price: number }[];
  }>
) {
  await productRepo().update(id, data as object);
  return productRepo().findOneOrFail({ where: { id }, relations: ["category"] });
}

export async function deleteProduct(id: string) {
  const r = await productRepo().delete(id);
  return (r.affected ?? 0) > 0;
}
