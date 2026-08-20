import { AppDataSource } from "../../config/data-source.js";
import { Inventory } from "../../models/Inventory.js";
import { StockAdjustments } from "../../models/StockAdjustments.js";
import { logAudit } from "../../services/audit.service.js";

const inventoryRepo = () => AppDataSource.getRepository(Inventory);

export interface GetInventoryParams {
  branchId: string;
  page?: number;
  limit?: number;
  lowStockOnly?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface PaginatedInventoryResult {
  data: Inventory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ALLOWED_INV_SORTS = new Set(["productName", "currentStock", "updatedAt"]);
const INV_SORT_MAP: Record<string, string> = {
  productName: "product.name",
  currentStock: "inv.currentStock",
  updatedAt: "inv.updatedAt",
};

export async function getInventory(
  params: GetInventoryParams
): Promise<PaginatedInventoryResult> {
  const { branchId, lowStockOnly, search, sortBy = "productName", sortOrder = "ASC" } = params;
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const page = params.page ?? 1;
  const skip = (page - 1) * limit;

  const qb = inventoryRepo()
    .createQueryBuilder("inv")
    .leftJoinAndSelect("inv.product", "product")
    .leftJoinAndSelect("product.category", "category")
    .where("inv.branch_id = :branchId", { branchId });

  if (lowStockOnly) {
    qb.andWhere("inv.current_stock < inv.low_stock_threshold");
  }

  if (search && search.trim()) {
    qb.andWhere("(product.name ILIKE :search OR product.sku ILIKE :search)", {
      search: `%${search.trim()}%`,
    });
  }

  const sortCol = ALLOWED_INV_SORTS.has(sortBy) ? INV_SORT_MAP[sortBy] : "product.name";
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
  organizationId?: string | null;
}

export async function adjustStock(params: AdjustStockParams) {
  const { productId, branchId, type, quantity, createdById, reason, organizationId } = params;

  return await AppDataSource.transaction(async (manager) => {
    const invRepo = manager.getRepository(Inventory);
    const adjRepo = manager.getRepository(StockAdjustments);

    if (type === "remove") {
      const result = await manager.query(
        `UPDATE inventory SET current_stock = current_stock - $1, updated_at = now()
         WHERE product_id = $2 AND branch_id = $3 AND current_stock >= $1`,
        [quantity, productId, branchId]
      );
      if (result[1] === 0) {
        throw new Error("Insufficient stock or inventory not found");
      }
    } else {
      const result = await manager.query(
        `UPDATE inventory SET current_stock = current_stock + $1, updated_at = now()
         WHERE product_id = $2 AND branch_id = $3`,
        [quantity, productId, branchId]
      );
      if (result[1] === 0) {
        throw new Error("Inventory not found for this product and branch");
      }
    }

    const inv = await invRepo.findOne({
      where: { productId, branchId },
    });

    if (!inv) {
      throw new Error("Inventory record not found");
    }

    const adjustment = adjRepo.create({
      inventoryId: inv.id,
      type,
      quantity,
      reason,
      createdById,
    });
    await adjRepo.save(adjustment);

    logAudit({
      organizationId,
      actorId: createdById,
      action: `inventory.${type}`,
      resource: "inventory",
      resourceId: inv.id,
      meta: { productId, branchId, quantity, reason, newStock: inv.currentStock },
    });

    return invRepo.findOne({
      where: { id: inv.id },
      relations: ["product"],
    });
  });
}
