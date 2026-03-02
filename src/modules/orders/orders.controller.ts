import { Request, Response } from "express";
import * as ordersService from "./orders.service.js";
import type { GetOrdersQueryDto } from "./orders.dto.js";

export async function placeOrder(req: Request, res: Response): Promise<void> {
  const branchId = req.user?.branchId ?? req.body?.branchId;
  if (!branchId) {
    res.status(400).json({ error: "branchId required. Ensure you are logged in and your account has a branch, or send branchId in the request body." });
    return;
  }
  const { items, subtotal, tax, discount, grandTotal, orderType, paymentMethod } = req.body;
  if (!items?.length) {
    res.status(400).json({ error: "items array is required and must not be empty" });
    return;
  }
  try {
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
  } catch (e) {
    const message =
      (e instanceof Error ? e.message : null)?.trim() || "Order failed";
    res.status(400).json({ error: message });
  }
}

export async function getOrders(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as GetOrdersQueryDto;
  const branchId = query.branchId ?? req.user?.branchId;
  let dateFrom: Date | undefined;
  let dateTo: Date | undefined;
  if (query.dateFrom) {
    dateFrom = new Date(query.dateFrom);
    if (isNaN(dateFrom.getTime())) {
      res.status(400).json({ error: "Invalid dateFrom" });
      return;
    }
  }
  if (query.dateTo) {
    dateTo = new Date(query.dateTo);
    dateTo.setDate(dateTo.getDate() + 1);
    if (isNaN(dateTo.getTime())) {
      res.status(400).json({ error: "Invalid dateTo" });
      return;
    }
  }
  const result = await ordersService.getOrders({
    branchId,
    status: query.status as ordersService.GetOrdersParams["status"],
    dateFrom,
    dateTo,
    page: query.page,
    limit: query.limit,
  });
  res.json(result);
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

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body as { status: string };
  const result = await ordersService.updateOrderStatus(req.params.id, status as "pending" | "accepted" | "preparing" | "ready" | "completed" | "cancelled");
  if (!result.ok) {
    res.status(result.error?.includes("transition") ? 400 : 404).json({ error: result.error });
    return;
  }
  res.status(204).send();
}

export async function updateKitchenStatus(req: Request, res: Response): Promise<void> {
  const { orderId, status } = req.body as { orderId: string; status: "NEW" | "PREPARING" | "READY" };
  const ok = await ordersService.updateKitchenStatus(orderId, status);
  if (!ok) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.status(204).send();
}
