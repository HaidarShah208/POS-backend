import { Request, Response } from "express";
import * as inventoryService from "./inventory.service.js";
import { getOrgId } from "../../middlewares/tenant.middleware.js";
import type { GetInventoryItemsQueryDto, GetStockMovementsQueryDto } from "./inventory.dto.js";

export async function getItems(req: Request, res: Response): Promise<void> {
  const organizationId = getOrgId(req);
  if (!organizationId) {
    res.status(403).json({ error: "Organization context required" });
    return;
  }

  const query = req.query as unknown as GetInventoryItemsQueryDto;
  const result = await inventoryService.getItems({
    organizationId,
    page: query.page,
    limit: query.limit,
    type: query.type,
    status: query.status,
    search: query.search,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });
  res.json(result);
}

export async function getItemById(req: Request, res: Response): Promise<void> {
  const organizationId = getOrgId(req);
  if (!organizationId) {
    res.status(403).json({ error: "Organization context required" });
    return;
  }

  const item = await inventoryService.getItemById(req.params.id, organizationId);
  if (!item) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }
  res.json(item);
}

export async function createItem(req: Request, res: Response): Promise<void> {
  const organizationId = getOrgId(req);
  if (!organizationId) {
    res.status(403).json({ error: "Organization context required" });
    return;
  }

  try {
    const item = await inventoryService.createItem(req.body, organizationId, req.user!.sub);
    res.status(201).json(item);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create item";
    res.status(400).json({ error: message });
  }
}

export async function updateItem(req: Request, res: Response): Promise<void> {
  const organizationId = getOrgId(req);
  if (!organizationId) {
    res.status(403).json({ error: "Organization context required" });
    return;
  }

  try {
    const item = await inventoryService.updateItem(req.params.id, req.body, organizationId, req.user!.sub);
    if (!item) {
      res.status(404).json({ error: "Inventory item not found" });
      return;
    }
    res.json(item);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update item";
    res.status(400).json({ error: message });
  }
}

export async function deleteItem(req: Request, res: Response): Promise<void> {
  const organizationId = getOrgId(req);
  if (!organizationId) {
    res.status(403).json({ error: "Organization context required" });
    return;
  }

  const deleted = await inventoryService.deleteItem(req.params.id, organizationId, req.user!.sub);
  if (!deleted) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }
  res.json({ message: "Item deleted successfully" });
}

export async function getSummary(req: Request, res: Response): Promise<void> {
  const organizationId = getOrgId(req);
  if (!organizationId) {
    res.status(403).json({ error: "Organization context required" });
    return;
  }

  const summary = await inventoryService.getSummary(organizationId);
  res.json(summary);
}

export async function adjustStock(req: Request, res: Response): Promise<void> {
  const organizationId = getOrgId(req);
  if (!organizationId) {
    res.status(403).json({ error: "Organization context required" });
    return;
  }

  try {
    const item = await inventoryService.adjustStock({
      organizationId,
      inventoryItemId: req.body.inventoryItemId,
      type: req.body.type,
      quantity: req.body.quantity,
      reason: req.body.reason,
      notes: req.body.notes,
      actorId: req.user!.sub,
    });
    res.json(item);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Stock adjustment failed";
    if (message.includes("not found")) {
      res.status(404).json({ error: message });
      return;
    }
    if (message.includes("Insufficient")) {
      res.status(400).json({ error: message });
      return;
    }
    res.status(400).json({ error: message });
  }
}

export async function getStockMovements(req: Request, res: Response): Promise<void> {
  const organizationId = getOrgId(req);
  if (!organizationId) {
    res.status(403).json({ error: "Organization context required" });
    return;
  }

  const query = req.query as unknown as GetStockMovementsQueryDto;
  const result = await inventoryService.getStockMovements({
    organizationId,
    inventoryItemId: query.inventoryItemId,
    type: query.type,
    referenceType: query.referenceType,
    page: query.page,
    limit: query.limit,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  });
  res.json(result);
}

export async function getItemHistory(req: Request, res: Response): Promise<void> {
  const organizationId = getOrgId(req);
  if (!organizationId) {
    res.status(403).json({ error: "Organization context required" });
    return;
  }

  const page = req.query.page ? Number(req.query.page) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const result = await inventoryService.getItemHistory(req.params.id, organizationId, page, limit);
  res.json(result);
}

export async function getLowStockItems(req: Request, res: Response): Promise<void> {
  const organizationId = getOrgId(req);
  if (!organizationId) {
    res.status(403).json({ error: "Organization context required" });
    return;
  }

  const items = await inventoryService.getLowStockItems(organizationId);
  res.json(items);
}

export async function recordWaste(req: Request, res: Response): Promise<void> {
  const organizationId = getOrgId(req);
  if (!organizationId) {
    res.status(403).json({ error: "Organization context required" });
    return;
  }

  try {
    const waste = await inventoryService.recordWaste({
      organizationId,
      inventoryItemId: req.body.inventoryItemId,
      quantity: req.body.quantity,
      reason: req.body.reason,
      notes: req.body.notes,
      actorId: req.user!.sub,
    });
    res.status(201).json(waste);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to record waste";
    if (message.includes("not found")) {
      res.status(404).json({ error: message });
      return;
    }
    if (message.includes("Insufficient")) {
      res.status(400).json({ error: message });
      return;
    }
    res.status(400).json({ error: message });
  }
}
