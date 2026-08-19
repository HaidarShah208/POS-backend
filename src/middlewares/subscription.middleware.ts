import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source.js";
import { Subscriptions } from "../models/Subscriptions.js";

const BLOCKED_STATUSES = ["expired", "suspended", "cancelled", "past_due"];

export function subscriptionGuard(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.user.role === "super_admin") {
    next();
    return;
  }

  if (!req.user.organizationId) {
    next();
    return;
  }

  const orgId = req.user.organizationId;

  AppDataSource.getRepository(Subscriptions)
    .findOne({
      where: { organizationId: orgId },
      order: { createdAt: "DESC" },
    })
    .then((sub) => {
      if (!sub) {
        res.status(403).json({ error: "No active subscription" });
        return;
      }

      if (BLOCKED_STATUSES.includes(sub.status)) {
        res.status(403).json({
          error: `Subscription ${sub.status}. Please renew your subscription.`,
          code: "SUBSCRIPTION_BLOCKED",
          status: sub.status,
        });
        return;
      }

      if (sub.status === "trialing" && sub.trialEndsAt && new Date() > sub.trialEndsAt) {
        AppDataSource.getRepository(Subscriptions)
          .update(sub.id, { status: "expired" })
          .catch(() => {});
        res.status(403).json({
          error: "Trial period has expired. Please upgrade your plan.",
          code: "TRIAL_EXPIRED",
        });
        return;
      }

      next();
    })
    .catch(() => {
      res.status(500).json({ error: "Failed to verify subscription" });
    });
}
