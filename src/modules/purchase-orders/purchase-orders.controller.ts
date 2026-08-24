import { Request, Response } from "express";
import { getOrgId } from "../../middlewares/tenant.middleware.js";
import * as purchaseOrdersService from "./purchase-orders.service.js";

export async function getPurchaseOrders(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  if (!orgId) {
    res.status(403).json({ error: "No organization context" });
    return;
  }
  const result = await purchaseOrdersService.getPurchaseOrders({
    ...req.query,
    organizationId: orgId,
  } as Parameters<typeof purchaseOrdersService.getPurchaseOrders>[0]);
  res.json(result);
}

export async function getPurchaseOrderById(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  if (!orgId) {
    res.status(403).json({ error: "No organization context" });
    return;
  }
  const po = await purchaseOrdersService.getPurchaseOrderById(req.params.id, orgId);
  if (!po) {
    res.status(404).json({ error: "Purchase order not found" });
    return;
  }
  res.json(po);
}

export async function createPurchaseOrder(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  if (!orgId) {
    res.status(403).json({ error: "No organization context" });
    return;
  }
  try {
    const po = await purchaseOrdersService.createPurchaseOrder(
      req.body,
      orgId,
      req.user!.sub
    );
    res.status(201).json(po);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create purchase order";
    res.status(400).json({ error: message });
  }
}

export async function receiveItems(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  if (!orgId) {
    res.status(403).json({ error: "No organization context" });
    return;
  }
  try {
    const po = await purchaseOrdersService.receiveItems(
      req.params.id,
      req.body,
      orgId,
      req.user!.sub
    );
    res.json(po);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to receive items";
    if (message.includes("not found")) {
      res.status(404).json({ error: message });
      return;
    }
    res.status(400).json({ error: message });
  }
}

export async function cancelPurchaseOrder(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  if (!orgId) {
    res.status(403).json({ error: "No organization context" });
    return;
  }
  try {
    const po = await purchaseOrdersService.cancelPurchaseOrder(
      req.params.id,
      orgId,
      req.user!.sub
    );
    res.json(po);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to cancel purchase order";
    if (message.includes("not found")) {
      res.status(404).json({ error: message });
      return;
    }
    res.status(400).json({ error: message });
  }
}
