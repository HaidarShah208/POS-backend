import { Request, Response, NextFunction } from "express";

export function tenantMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.user.role === "super_admin") {
    next();
    return;
  }

  if (!req.user.organizationId) {
    res.status(403).json({ error: "No organization context" });
    return;
  }

  next();
}

export function getOrgId(req: Request): string | null {
  if (!req.user) return null;
  if (req.user.role === "super_admin") return null;
  return req.user.organizationId;
}
