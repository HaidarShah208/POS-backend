import { Request, Response } from "express";
import * as inventoryService from "./inventory.service.js";
import type { GetInventoryQueryDto } from "./inventory.dto.js";

export async function getInventory(req: Request, res: Response): Promise<void> {
  const branchId = req.params.branchId ?? req.user?.branchId;
  if (!branchId) {
    res.status(400).json({ error: "branchId required" });
    return;
  }
  const query = req.query as unknown as GetInventoryQueryDto;
  const result = await inventoryService.getInventory({
    branchId,
    page: query.page,
    limit: query.limit,
    lowStockOnly: query.lowStockOnly,
  });
  res.json(result);
}

export async function adjustStock(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { productId, branchId, type, quantity, reason } = req.body;
    const inv = await inventoryService.adjustStock({
      productId,
      branchId,
      type,
      quantity,
      createdById: userId,
      reason,
    });
    res.json(inv);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Adjustment failed";
    if (message === "Inventory not found for this product and branch") {
      res.status(404).json({ error: message });
      return;
    }
    if (message === "Insufficient stock") {
      res.status(400).json({ error: message });
      return;
    }
    res.status(400).json({ error: message });
  }
}
