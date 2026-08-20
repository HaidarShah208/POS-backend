import { Request, Response } from "express";
import * as inventoryService from "./inventory.service.js";
import type { GetInventoryQueryDto } from "./inventory.dto.js";
import { AppDataSource } from "../../config/data-source.js";
import { Branches } from "../../models/Branches.js";

export async function getInventory(req: Request, res: Response): Promise<void> {
  const branchId = req.params.branchId ?? req.user?.branchId;
  if (!branchId) {
    res.status(400).json({ error: "branchId required" });
    return;
  }

  if (req.user?.role !== "super_admin" && req.user?.organizationId) {
    const branch = await AppDataSource.getRepository(Branches).findOne({
      where: { id: branchId, organizationId: req.user.organizationId },
    });
    if (!branch) {
      res.status(403).json({ error: "Branch does not belong to your organization" });
      return;
    }
  }

  const query = req.query as unknown as GetInventoryQueryDto;
  const result = await inventoryService.getInventory({
    branchId,
    page: query.page,
    limit: query.limit,
    lowStockOnly: query.lowStockOnly,
    search: (query as Record<string, string>).search,
    sortBy: (query as Record<string, string>).sortBy,
    sortOrder: (query as Record<string, string>).sortOrder as "ASC" | "DESC",
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

    if (req.user?.role !== "super_admin" && req.user?.organizationId) {
      const branch = await AppDataSource.getRepository(Branches).findOne({
        where: { id: branchId, organizationId: req.user.organizationId },
      });
      if (!branch) {
        res.status(403).json({ error: "Branch does not belong to your organization" });
        return;
      }
    }

    const inv = await inventoryService.adjustStock({
      productId,
      branchId,
      type,
      quantity,
      createdById: userId,
      reason,
      organizationId: req.user?.organizationId,
    });
    res.json(inv);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Adjustment failed";
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
