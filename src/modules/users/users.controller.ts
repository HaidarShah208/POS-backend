import { Request, Response } from "express";
import * as usersService from "./users.service.js";
import { getOrgId } from "../../middlewares/tenant.middleware.js";

export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const orgId = getOrgId(req);
    if (!orgId) { res.status(403).json({ error: "Organization context required" }); return; }
    const users = await usersService.getByOrganizationId(orgId);
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to fetch users" });
  }
}

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

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const orgId = getOrgId(req);
    if (!orgId) { res.status(403).json({ error: "Organization context required" }); return; }
    const deleted = await usersService.deleteUser(req.params.id, orgId, req.user!.sub);
    if (!deleted) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete user";
    if (msg.includes("Cannot delete")) {
      res.status(403).json({ error: msg });
      return;
    }
    res.status(500).json({ error: msg });
  }
}
