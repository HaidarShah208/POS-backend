import { Request, Response } from "express";
import * as usersService from "./users.service.js";
import { getOrgId } from "../../middlewares/tenant.middleware.js";

export async function getByBranch(req: Request, res: Response): Promise<void> {
  const branchId = req.params.branchId ?? req.user?.branchId;
  if (!branchId) {
    res.status(400).json({ error: "branchId required" });
    return;
  }
  const orgId = getOrgId(req);
  const users = await usersService.getByBranchId(branchId, orgId);
  res.json(users);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  const user = await usersService.getById(req.params.id, orgId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
}
