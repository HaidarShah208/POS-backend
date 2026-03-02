import { Request, Response } from "express";

import * as usersService from "./users.service.js";

export async function getByBranch(req: Request, res: Response): Promise<void> {
  const branchId = req.params.branchId ?? req.user?.branchId;
  if (!branchId) {
    res.status(400).json({ error: "branchId required" });
    return;
  }
  const users = await usersService.getByBranchId(branchId);
  res.json(users);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const user = await usersService.getById(req.params.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
}
