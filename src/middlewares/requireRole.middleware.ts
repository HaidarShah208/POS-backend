import { Request, Response, NextFunction } from "express";

export function requireRole(...allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (req.user.role === "super_admin") {
      next();
      return;
    }
    if (!allowed.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden: insufficient role" });
      return;
    }
    next();
  };
}

export function requirePermission(...required: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (req.user.role === "super_admin") {
      next();
      return;
    }
    const userPerms = req.user.permissions ?? [];
    const hasAll = required.every((p) => userPerms.includes(p));
    if (!hasAll) {
      res.status(403).json({ error: "Forbidden: insufficient permissions" });
      return;
    }
    next();
  };
}

export const requireAdmin = requireRole("owner", "admin");
export const requireSuperAdmin = requireRole("super_admin");
export const requireOwnerOrAbove = requireRole("super_admin", "owner");
