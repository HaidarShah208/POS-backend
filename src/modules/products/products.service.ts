import { AppDataSource } from "../../config/data-source.js";
import { Products } from "../../models/Products.js";
import { Categories } from "../../models/Categories.js";
import { Inventory } from "../../models/Inventory.js";
import { Branches } from "../../models/Branches.js";
import { logAudit } from "../../services/audit.service.js";

const productRepo = () => AppDataSource.getRepository(Products);
const categoryRepo = () => AppDataSource.getRepository(Categories);

export async function getCategories(organizationId?: string | null) {
  const where: Record<string, unknown> = {};
  if (organizationId) where.organizationId = organizationId;
  return categoryRepo().find({ where, order: { sortOrder: "ASC", name: "ASC" } });
}

export async function getCategoryById(id: string, organizationId?: string | null) {
  const where: Record<string, unknown> = { id };
  if (organizationId) where.organizationId = organizationId;
  return categoryRepo().findOne({ where });
}

export async function createCategory(
  data: { name: string; slug: string; sortOrder?: number },
  organizationId?: string | null,
  actorId?: string | null
) {
  const cat = categoryRepo().create({
    ...data,
    sortOrder: data.sortOrder ?? 0,
    organizationId: organizationId || null,
  });
  const saved = await categoryRepo().save(cat);
  logAudit({ organizationId, actorId, action: "category.created", resource: "category", resourceId: saved.id });
  return saved;
}

export async function updateCategory(
  id: string,
  data: Partial<{ name: string; slug: string; sortOrder: number }>,
  organizationId?: string | null,
  actorId?: string | null
) {
  const where: Record<string, unknown> = { id };
  if (organizationId) where.organizationId = organizationId;
  const cat = await categoryRepo().findOne({ where });
  if (!cat) return null;
  Object.assign(cat, data);
  const saved = await categoryRepo().save(cat);
  logAudit({ organizationId, actorId, action: "category.updated", resource: "category", resourceId: id });
  return saved;
}

export async function deleteCategory(id: string, organizationId?: string | null, actorId?: string | null) {
  const where: Record<string, unknown> = { id };
  if (organizationId) where.organizationId = organizationId;
  const cat = await categoryRepo().findOne({ where });
  if (!cat) return false;
  const r = await categoryRepo().delete({ id, ...(organizationId ? { organizationId } : {}) });
  logAudit({ organizationId, actorId, action: "category.deleted", resource: "category", resourceId: id });
  return (r.affected ?? 0) > 0;
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
  branchId?: string;
  organizationId?: string | null;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ALLOWED_PRODUCT_SORTS = new Set(["name", "price", "createdAt", "status"]);
const PRODUCT_SORT_MAP: Record<string, string> = {
  name: "p.name",
  price: "p.price",
  createdAt: "p.created_at",
  status: "p.status",
};

export async function getProducts(params: GetProductsParams = {}): Promise<PaginatedResult<Products>> {
  const { search, categoryId, lowStockOnly, branchId, organizationId, sortBy = "name", sortOrder = "ASC" } = params;
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const page = params.page ?? 1;
  const skip = (page - 1) * limit;

  const qb = productRepo()
    .createQueryBuilder("p")
    .leftJoinAndSelect("p.category", "category");

  if (organizationId) {
    qb.andWhere("p.organization_id = :organizationId", { organizationId });
  }

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

  const sortCol = ALLOWED_PRODUCT_SORTS.has(sortBy) ? PRODUCT_SORT_MAP[sortBy] : "p.name";
  const direction = sortOrder === "DESC" ? "DESC" : "ASC";
  qb.orderBy(sortCol, direction);

  const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getProductById(id: string, organizationId?: string | null) {
  const where: Record<string, unknown> = { id };
  if (organizationId) where.organizationId = organizationId;
  return productRepo().findOne({
    where,
    relations: ["category"],
  });
}

export async function createProduct(
  data: {
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
  },
  organizationId?: string | null,
  actorId?: string | null
) {
  return await AppDataSource.transaction(async (manager) => {
    const prodRepo = manager.getRepository(Products);
    const invRepo = manager.getRepository(Inventory);
    const bRepo = manager.getRepository(Branches);

    const product = prodRepo.create({
      ...data,
      status: data.status ?? "active",
      organizationId: organizationId || null,
    });
    const saved = await prodRepo.save(product);

    const branchWhere: Record<string, unknown> = {};
    if (organizationId) branchWhere.organizationId = organizationId;
    const branches = await bRepo.find({ where: branchWhere, select: ["id"] });

    if (branches.length > 0) {
      const inventoryRecords = branches.map((branch) =>
        invRepo.create({
          productId: saved.id,
          branchId: branch.id,
          currentStock: 0,
          lowStockThreshold: 0,
        })
      );
      await invRepo.save(inventoryRecords);
    }

    logAudit({ organizationId, actorId, action: "product.created", resource: "product", resourceId: saved.id });

    return prodRepo.findOneOrFail({
      where: { id: saved.id },
      relations: ["category"],
    });
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
  }>,
  organizationId?: string | null,
  actorId?: string | null
) {
  const where: Record<string, unknown> = { id };
  if (organizationId) where.organizationId = organizationId;
  const existing = await productRepo().findOne({ where });
  if (!existing) return null;
  Object.assign(existing, data);
  const saved = await productRepo().save(existing);
  logAudit({ organizationId, actorId, action: "product.updated", resource: "product", resourceId: id });
  return productRepo().findOneOrFail({ where: { id: saved.id }, relations: ["category"] });
}

export async function deleteProduct(id: string, organizationId?: string | null, actorId?: string | null) {
  const where: Record<string, unknown> = { id };
  if (organizationId) where.organizationId = organizationId;
  const existing = await productRepo().findOne({ where });
  if (!existing) return false;
  const r = await productRepo().delete({ id, ...(organizationId ? { organizationId } : {}) });
  logAudit({ organizationId, actorId, action: "product.deleted", resource: "product", resourceId: id });
  return (r.affected ?? 0) > 0;
}
