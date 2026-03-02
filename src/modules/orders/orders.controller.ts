import { Request, Response } from "express";
import * as ordersService from "./orders.service.js";

export async function placeOrder(req: Request, res: Response): Promise<void> {
  const branchId = req.user?.branchId ?? req.body.branchId;
  if (!branchId) {
    res.status(400).json({ error: "branchId required" });
    return;
  }
  const { items, subtotal, tax, discount, grandTotal, orderType, paymentMethod } = req.body;
  const result = await ordersService.placeOrder({
    branchId,
    userId: req.user?.sub,
    items,
    subtotal,
    tax,
    discount,
    grandTotal,
    orderType,
    paymentMethod,
  });
  res.status(201).json(result);
}

export async function getByBranch(req: Request, res: Response): Promise<void> {
  const branchId = req.params.branchId ?? req.user?.branchId;
  if (!branchId) {
    res.status(400).json({ error: "branchId required" });
    return;
  }
  const orders = await ordersService.getByBranchId(branchId);
  res.json(orders);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const order = await ordersService.getById(req.params.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
}

export async function getKitchenOrders(req: Request, res: Response): Promise<void> {
  const branchId = req.params.branchId ?? req.user?.branchId;
  if (!branchId) {
    res.status(400).json({ error: "branchId required" });
    return;
  }
  const orders = await ordersService.getKitchenOrders(branchId);
  res.json(orders);
}

export async function updateKitchenStatus(req: Request, res: Response): Promise<void> {
  const { orderId, status } = req.body as { orderId: string; status: "NEW" | "PREPARING" | "READY" };
  const ok = await ordersService.updateOrderStatus(orderId, status);
  if (!ok) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.status(204).send();
}
