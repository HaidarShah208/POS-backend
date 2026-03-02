import { AppDataSource } from "../../config/data-source.js";
import { Inventory } from "../../models/Inventory.js";
import { StockAdjustments } from "../../models/StockAdjustments.js";

const inventoryRepo = () => AppDataSource.getRepository(Inventory);
const adjustmentRepo = () => AppDataSource.getRepository(StockAdjustments);

export interface GetInventoryParams {
  branchId: string;
  page?: number;
  limit?: number;
  lowStockOnly?: boolean;
}

export interface PaginatedInventoryResult {
  data: Inventory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getInventory(
  params: GetInventoryParams
): Promise<PaginatedInventoryResult> {
  const { branchId, page = 1, limit = 20, lowStockOnly } = params;
  const skip = (page - 1) * limit;

  const qb = inventoryRepo()
    .createQueryBuilder("inv")
    .leftJoinAndSelect("inv.product", "product")
    .leftJoinAndSelect("product.category", "category")
    .where("inv.branch_id = :branchId", { branchId })
    .orderBy("product.name", "ASC");

  if (lowStockOnly) {
    qb.andWhere("inv.current_stock < inv.low_stock_threshold");
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

export async function getInventoryByProductAndBranch(
  productId: string,
  branchId: string
) {
  return inventoryRepo().findOne({
    where: { productId, branchId },
    relations: ["product"],
  });
}

export interface AdjustStockParams {
  productId: string;
  branchId: string;
  type: "add" | "remove";
  quantity: number;
  createdById: string;
  reason: string;
}

export async function adjustStock(params: AdjustStockParams) {
  const { productId, branchId, type, quantity, createdById, reason } = params;

  const inv = await inventoryRepo().findOne({
    where: { productId, branchId },
    relations: ["product"],
  });

  if (!inv) {
    throw new Error("Inventory not found for this product and branch");
  }

  if (type === "remove" && inv.currentStock < quantity) {
    throw new Error("Insufficient stock");
  }

  const adjustment = adjustmentRepo().create({
    inventoryId: inv.id,
    type,
    quantity,
    reason,
    createdById,
  });
  await adjustmentRepo().save(adjustment);

  inv.currentStock += type === "add" ? quantity : -quantity;
  await inventoryRepo().save(inv);

  return inventoryRepo().findOne({
    where: { id: inv.id },
    relations: ["product"],
  });
}

export async function setLowStockThreshold(
  inventoryId: string,
  branchId: string,
  threshold: number
) {
  const inv = await inventoryRepo().findOne({
    where: { id: inventoryId, branchId },
  });
  if (!inv) return null;
  inv.lowStockThreshold = Math.max(0, threshold);
  await inventoryRepo().save(inv);
  return inv;
}
