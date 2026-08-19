import { Request, Response } from "express";
import * as branchesService from "./branches.service.js";
import { getOrgId } from "../../middlewares/tenant.middleware.js";

export async function getAll(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  const branches = await branchesService.getAll(orgId);
  res.json(branches);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  const branch = await branchesService.getById(req.params.id, orgId);
  if (!branch) {
    res.status(404).json({ error: "Branch not found" });
    return;
  }
  res.json(branch);
}

export async function create(req: Request, res: Response): Promise<void> {
  const orgId = getOrgId(req);
  const branch = await branchesService.create(req.body, orgId);
  res.status(201).json(branch);
}
