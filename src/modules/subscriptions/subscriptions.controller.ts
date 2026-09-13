import { Request, Response } from "express";
import * as svc from "./subscriptions.service.js";
import { getOrgId } from "../../middlewares/tenant.middleware.js";
import { uploadPublicFile } from "../../lib/supabaseStorage.js";

export async function getPlans(_req: Request, res: Response): Promise<void> {
  try {
    const plans = await svc.getPlans();
    res.json(plans);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to fetch plans" });
  }
}

export async function getMySubscription(req: Request, res: Response): Promise<void> {
  try {
    const orgId = getOrgId(req);
    if (!orgId) { res.status(403).json({ error: "Organization context required" }); return; }
    const subscription = await svc.getMySubscription(orgId);
    if (!subscription) { res.status(404).json({ error: "No subscription found" }); return; }
    res.json(subscription);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to fetch subscription" });
  }
}

export async function submitPayment(req: Request, res: Response): Promise<void> {
  try {
    const orgId = getOrgId(req);
    if (!orgId) { res.status(403).json({ error: "Organization context required" }); return; }
    const actorId = req.user?.sub;
    if (!actorId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const { planId, amount, paymentMethod, accountTitle, transactionId } = req.body;

    if (!planId || !amount || !paymentMethod) {
      res.status(400).json({ error: "planId, amount, and paymentMethod are required" });
      return;
    }

    const validMethods = ["EASYPAISA", "JAZZCASH", "BANK_TRANSFER"];
    if (!validMethods.includes(paymentMethod)) {
      res.status(400).json({ error: `Invalid payment method. Must be one of: ${validMethods.join(", ")}` });
      return;
    }

    const receiptImage = req.file ? await uploadPublicFile("receipts", req.file) : undefined;

    const payment = await svc.submitPayment(
      { planId, amount: Number(amount), paymentMethod, accountTitle, transactionId, receiptImage },
      orgId,
      actorId
    );
    res.status(201).json(payment);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Failed to submit payment" });
  }
}

export async function getPaymentStatus(req: Request, res: Response): Promise<void> {
  try {
    const orgId = getOrgId(req);
    if (!orgId) { res.status(403).json({ error: "Organization context required" }); return; }
    const payment = await svc.getPaymentStatus(orgId);
    if (!payment) { res.status(404).json({ error: "No payment submission found" }); return; }
    res.json(payment);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to fetch payment status" });
  }
}

export async function getAllPayments(req: Request, res: Response): Promise<void> {
  try {
    const { page, limit, status } = req.query;
    const result = await svc.getAllPayments({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string | undefined,
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to fetch payments" });
  }
}

export async function approvePayment(req: Request, res: Response): Promise<void> {
  try {
    const actorId = req.user?.sub;
    if (!actorId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const payment = await svc.approvePayment(req.params.id, actorId);
    if (!payment) { res.status(404).json({ error: "Payment submission not found" }); return; }
    res.json(payment);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Failed to approve payment" });
  }
}

export async function rejectPayment(req: Request, res: Response): Promise<void> {
  try {
    const actorId = req.user?.sub;
    if (!actorId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const { notes } = req.body;
    const payment = await svc.rejectPayment(req.params.id, notes ?? "", actorId);
    if (!payment) { res.status(404).json({ error: "Payment submission not found" }); return; }
    res.json(payment);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Failed to reject payment" });
  }
}
