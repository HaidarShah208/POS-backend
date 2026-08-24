import { AppDataSource } from "../../config/data-source.js";
import { InventoryItems, InventoryItemStatus } from "../../models/InventoryItems.js";
import { StockMovements, StockMovementType, StockMovementReferenceType } from "../../models/StockMovements.js";
import { WasteRecords, WasteReason } from "../../models/WasteRecords.js";
import { logAudit } from "../../services/audit.service.js";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetItemsParams {
  organizationId: string;
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface AdjustStockParams {
  organizationId: string;
  inventoryItemId: string;
  type: "add" | "remove";
  quantity: number;
  reason: string;
  notes?: string;
  actorId: string;
}

export interface RecordWasteParams {
  organizationId: string;
  inventoryItemId: string;
  quantity: number;
  reason: WasteReason;
  notes?: string;
  actorId: string;
}

export interface GetStockMovementsParams {
  organizationId: string;
  inventoryItemId?: string;
  type?: string;
  referenceType?: string;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface InventorySummary {
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
  expiringSoon: number;
}

function recalculateStatus(currentQuantity: number, minimumQuantity: number): InventoryItemStatus {
  if (currentQuantity <= 0) return "OUT_OF_STOCK";
  if (currentQuantity <= minimumQuantity) return "LOW_STOCK";
  return "IN_STOCK";
}

const ALLOWED_SORT_FIELDS: Record<string, string> = {
  name: "item.name",
  currentQuantity: "item.currentQuantity",
  costPerUnit: "item.costPerUnit",
  createdAt: "item.createdAt",
  updatedAt: "item.updatedAt",
};

export async function getItems(params: GetItemsParams): Promise<PaginatedResult<InventoryItems>> {
  const { organizationId, type, status, search, sortBy = "createdAt", sortOrder = "DESC" } = params;
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const page = Math.max(params.page ?? 1, 1);
  const skip = (page - 1) * limit;

  const qb = AppDataSource.getRepository(InventoryItems)
    .createQueryBuilder("item")
    .leftJoinAndSelect("item.product", "product")
    .where("item.organizationId = :organizationId", { organizationId });

  if (type) {
    qb.andWhere("item.type = :type", { type });
  }

  if (status) {
    qb.andWhere("item.status = :status", { status });
  }

  if (search && search.trim()) {
    qb.andWhere("item.name ILIKE :search", { search: `%${search.trim()}%` });
  }

  const sortCol = ALLOWED_SORT_FIELDS[sortBy] || "item.createdAt";
  const direction = sortOrder === "ASC" ? "ASC" : "DESC";
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

export async function getItemById(id: string, organizationId: string): Promise<InventoryItems | null> {
  return AppDataSource.getRepository(InventoryItems).findOne({
    where: { id, organizationId },
    relations: ["product"],
  });
}

export async function createItem(
  data: Partial<InventoryItems>,
  organizationId: string,
  actorId: string
): Promise<InventoryItems> {
  const repo = AppDataSource.getRepository(InventoryItems);

  const currentQuantity = Number(data.currentQuantity ?? 0);
  const minimumQuantity = Number(data.minimumQuantity ?? 0);
  const status = recalculateStatus(currentQuantity, minimumQuantity);

  const item = repo.create({
    ...data,
    organizationId,
    currentQuantity,
    minimumQuantity,
    status,
  });

  const saved = await repo.save(item);

  if (currentQuantity > 0) {
    const movementRepo = AppDataSource.getRepository(StockMovements);
    const movement = movementRepo.create({
      organizationId,
      inventoryItemId: saved.id,
      type: "OPENING_STOCK" as StockMovementType,
      quantity: currentQuantity,
      previousQuantity: 0,
      newQuantity: currentQuantity,
      reason: "Initial stock",
      referenceType: "SYSTEM" as StockMovementReferenceType,
      performedById: actorId,
    });
    await movementRepo.save(movement);
  }

  logAudit({
    organizationId,
    actorId,
    action: "inventory.create",
    resource: "inventory_item",
    resourceId: saved.id,
    meta: { name: saved.name, type: saved.type, currentQuantity },
  });

  return repo.findOne({
    where: { id: saved.id },
    relations: ["product"],
  }) as Promise<InventoryItems>;
}

export async function updateItem(
  id: string,
  data: Partial<InventoryItems>,
  organizationId: string,
  actorId: string
): Promise<InventoryItems | null> {
  const repo = AppDataSource.getRepository(InventoryItems);
  const item = await repo.findOne({ where: { id, organizationId } });

  if (!item) return null;

  const { currentQuantity, id: _id, organizationId: _orgId, ...updateData } = data as Record<string, unknown>;

  Object.assign(item, updateData);

  const qty = Number(item.currentQuantity);
  const minQty = Number(item.minimumQuantity);
  item.status = recalculateStatus(qty, minQty);

  await repo.save(item);

  logAudit({
    organizationId,
    actorId,
    action: "inventory.update",
    resource: "inventory_item",
    resourceId: id,
    meta: updateData,
  });

  return repo.findOne({ where: { id }, relations: ["product"] });
}

export async function deleteItem(id: string, organizationId: string, actorId: string): Promise<boolean> {
  const repo = AppDataSource.getRepository(InventoryItems);
  const item = await repo.findOne({ where: { id, organizationId } });

  if (!item) return false;

  await repo.remove(item);

  logAudit({
    organizationId,
    actorId,
    action: "inventory.delete",
    resource: "inventory_item",
    resourceId: id,
    meta: { name: item.name },
  });

  return true;
}

export async function getSummary(organizationId: string): Promise<InventorySummary> {
  const repo = AppDataSource.getRepository(InventoryItems);

  const result = await repo
    .createQueryBuilder("item")
    .select("COUNT(*)::int", "totalItems")
    .addSelect("COUNT(*) FILTER (WHERE item.status = 'LOW_STOCK')::int", "lowStock")
    .addSelect("COUNT(*) FILTER (WHERE item.status = 'OUT_OF_STOCK')::int", "outOfStock")
    .addSelect("COALESCE(SUM(item.current_quantity * item.cost_per_unit), 0)", "totalValue")
    .addSelect("COUNT(*) FILTER (WHERE item.track_expiry = true)::int", "expiringSoon")
    .where("item.organization_id = :organizationId", { organizationId })
    .getRawOne();

  return {
    totalItems: Number(result.totalItems),
    lowStock: Number(result.lowStock),
    outOfStock: Number(result.outOfStock),
    totalValue: Number(result.totalValue),
    expiringSoon: Number(result.expiringSoon),
  };
}

export async function adjustStock(params: AdjustStockParams): Promise<InventoryItems> {
  const { organizationId, inventoryItemId, type, quantity, reason, notes, actorId } = params;

  return await AppDataSource.transaction(async (manager) => {
    const rows = await manager.query(
      `SELECT * FROM inventory_items WHERE id = $1 AND organization_id = $2 FOR UPDATE`,
      [inventoryItemId, organizationId]
    );

    if (!rows || rows.length === 0) {
      throw new Error("Inventory item not found");
    }

    const row = rows[0];
    const previousQuantity = Number(row.current_quantity);
    let newQuantity: number;

    if (type === "add") {
      newQuantity = previousQuantity + quantity;
    } else {
      if (previousQuantity < quantity) {
        throw new Error("Insufficient stock");
      }
      newQuantity = previousQuantity - quantity;
    }

    const newStatus = recalculateStatus(newQuantity, Number(row.minimum_quantity));

    await manager.query(
      `UPDATE inventory_items SET current_quantity = $1, status = $2, updated_at = NOW() WHERE id = $3`,
      [newQuantity, newStatus, inventoryItemId]
    );

    const movementType: StockMovementType = type === "add" ? "MANUAL_ADJUSTMENT" : "MANUAL_ADJUSTMENT";
    const movement = manager.getRepository(StockMovements).create({
      organizationId,
      inventoryItemId,
      type: movementType,
      quantity,
      previousQuantity,
      newQuantity,
      reason,
      notes: notes ?? null,
      referenceType: "MANUAL" as StockMovementReferenceType,
      performedById: actorId,
    });
    await manager.getRepository(StockMovements).save(movement);

    logAudit({
      organizationId,
      actorId,
      action: `inventory.adjust.${type}`,
      resource: "inventory_item",
      resourceId: inventoryItemId,
      meta: { previousQuantity, newQuantity, quantity, reason },
    });

    return manager.getRepository(InventoryItems).findOne({
      where: { id: inventoryItemId },
      relations: ["product"],
    }) as Promise<InventoryItems>;
  });
}

export async function getStockMovements(params: GetStockMovementsParams): Promise<PaginatedResult<StockMovements>> {
  const { organizationId, inventoryItemId, type, referenceType, dateFrom, dateTo } = params;
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const page = Math.max(params.page ?? 1, 1);
  const skip = (page - 1) * limit;

  const qb = AppDataSource.getRepository(StockMovements)
    .createQueryBuilder("movement")
    .leftJoinAndSelect("movement.inventoryItem", "inventoryItem")
    .leftJoinAndSelect("movement.performedBy", "performedBy")
    .where("movement.organizationId = :organizationId", { organizationId });

  if (inventoryItemId) {
    qb.andWhere("movement.inventoryItemId = :inventoryItemId", { inventoryItemId });
  }

  if (type) {
    qb.andWhere("movement.type = :type", { type });
  }

  if (referenceType) {
    qb.andWhere("movement.referenceType = :referenceType", { referenceType });
  }

  if (dateFrom) {
    qb.andWhere("movement.createdAt >= :dateFrom", { dateFrom });
  }

  if (dateTo) {
    qb.andWhere("movement.createdAt <= :dateTo", { dateTo });
  }

  qb.orderBy("movement.createdAt", "DESC");

  const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getItemHistory(
  itemId: string,
  organizationId: string,
  page?: number,
  limit?: number
): Promise<PaginatedResult<StockMovements>> {
  return getStockMovements({
    organizationId,
    inventoryItemId: itemId,
    page,
    limit,
  });
}

export async function getLowStockItems(organizationId: string): Promise<InventoryItems[]> {
  return AppDataSource.getRepository(InventoryItems).find({
    where: [
      { organizationId, status: "LOW_STOCK" as InventoryItemStatus },
      { organizationId, status: "OUT_OF_STOCK" as InventoryItemStatus },
    ],
    relations: ["product"],
    order: { currentQuantity: "ASC" },
  });
}

export async function recordWaste(params: RecordWasteParams): Promise<WasteRecords> {
  const { organizationId, inventoryItemId, quantity, reason, notes, actorId } = params;

  return await AppDataSource.transaction(async (manager) => {
    const rows = await manager.query(
      `SELECT * FROM inventory_items WHERE id = $1 AND organization_id = $2 FOR UPDATE`,
      [inventoryItemId, organizationId]
    );

    if (!rows || rows.length === 0) {
      throw new Error("Inventory item not found");
    }

    const row = rows[0];
    const previousQuantity = Number(row.current_quantity);

    if (previousQuantity < quantity) {
      throw new Error("Insufficient stock for waste recording");
    }

    const newQuantity = previousQuantity - quantity;
    const newStatus = recalculateStatus(newQuantity, Number(row.minimum_quantity));

    await manager.query(
      `UPDATE inventory_items SET current_quantity = $1, status = $2, updated_at = NOW() WHERE id = $3`,
      [newQuantity, newStatus, inventoryItemId]
    );

    const wasteRecord = manager.getRepository(WasteRecords).create({
      organizationId,
      inventoryItemId,
      quantity,
      reason,
      notes: notes ?? null,
      recordedById: actorId,
    });
    const savedWaste = await manager.getRepository(WasteRecords).save(wasteRecord);

    const movement = manager.getRepository(StockMovements).create({
      organizationId,
      inventoryItemId,
      type: "WASTAGE" as StockMovementType,
      quantity,
      previousQuantity,
      newQuantity,
      reason,
      notes: notes ?? null,
      referenceType: "WASTE" as StockMovementReferenceType,
      referenceId: savedWaste.id,
      performedById: actorId,
    });
    await manager.getRepository(StockMovements).save(movement);

    logAudit({
      organizationId,
      actorId,
      action: "inventory.waste",
      resource: "inventory_item",
      resourceId: inventoryItemId,
      meta: { quantity, reason, previousQuantity, newQuantity },
    });

    return savedWaste;
  });
}
